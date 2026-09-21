"""Small DCC-00 data contract; pure stdlib, shared by server and Blender."""
import copy, json, math, uuid
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
REPO = ROOT.parent
CLASSES = json.loads((ROOT/'registry/classes.json').read_text(encoding='utf-8-sig'))
ASSETS = json.loads((ROOT/'registry/assets.json').read_text(encoding='utf-8-sig'))
SCHEMA = 'ra-dcc00-authoring-v0'
def new_actor(class_id, x=640, y=1800):
    out={'class':class_id,'transform':{'x':x,'y':y,'z':0,'yaw':0},**copy.deepcopy(CLASSES[class_id]['defaults'])}
    if CLASSES[class_id]['tier']!='C': out['ra_id']=str(uuid.uuid4())
    return out

def asset_path(asset):
    item=ASSETS.get(asset,{})
    if not item.get('path'): return None
    p=(REPO/item['path']).resolve()
    if not p.is_relative_to(REPO.resolve()): return None
    return p

def number(v): return isinstance(v,(int,float)) and not isinstance(v,bool) and math.isfinite(v)

def validate(doc, scene_ids=None, check_assets=True):
    issues=[]
    def add(level,code,where,message): issues.append(dict(level=level,code=code,where=where,message=message))
    if not isinstance(doc,dict): return [dict(level='BLOCK',code='DOCUMENT',where='root',message='Object required')]
    if doc.get('schema')!=SCHEMA: add('BLOCK','SCHEMA','root','Unsupported DCC-00 schema')
    world=doc.get('world',{})
    if not isinstance(world,dict) or world.get('testbed')!='existing-multi-asset-rnd' or any(world.get(k)!=v for k,v in [('width',1280),('height',3600),('unitsPerMeter',14)]): add('BLOCK','WORLD','world','Expected existing 1280 x 3600 testbed at 14 units/m')
    for key in ['actors','decorations','paths','tombstones']:
        if not isinstance(doc.get(key),list): add('BLOCK','ARRAY',key,'Array required')
    if any(i['code']=='ARRAY' for i in issues): return issues
    paths=set()
    for p in doc['paths']:
        if not isinstance(p,dict): add('BLOCK','PATH','paths','Object required'); continue
        pid=p.get('id')
        if not isinstance(pid,str) or not pid or pid in paths: add('BLOCK','PATH_ID','paths','Unique path ID required')
        else: paths.add(pid)
        points=p.get('points')
        if not isinstance(points,list) or len(points)<2 or any(not isinstance(v,dict) or any(not number(v.get(k)) for k in ['x','y','z']) for v in (points if isinstance(points,list) else [])): add('BLOCK','PATH_POINTS',str(pid),'At least two finite XYZ points required')
        elif all(v==points[0] for v in points): add('BLOCK','PATH_LENGTH',str(pid),'Path must have length')
    ids=set()
    for group in ['actors','decorations']:
        for index,a in enumerate(doc[group]):
            loc=f'{group}[{index}]'
            if not isinstance(a,dict): add('BLOCK','ACTOR',loc,'Object required'); continue
            cls=a.get('class');spec=CLASSES.get(cls) if isinstance(cls,str) else None
            if not spec: add('BLOCK','UNKNOWN_CLASS',loc,'Unknown class is preserved, not editable'); continue
            ident=a.get('ra_id'); tier=spec['tier']
            if (group=='decorations') != (tier=='C'): add('BLOCK','TIER',loc,'Actor in wrong identity collection')
            if tier!='C':
                if not isinstance(ident,str) or not ident: add('BLOCK','MISSING_ID',loc,'Stable ID required')
                elif ident in ids: add('BLOCK','DUPLICATE_ID',loc,ident)
                else: ids.add(ident)
            transform=a.get('transform',{})
            if not isinstance(transform,dict) or any(not number(transform.get(k)) for k in ['x','y','z','yaw']): add('BLOCK','TRANSFORM',loc,'Finite XYZ/yaw required')
            for key,field in spec['fields'].items():
                val=a.get(key);t=field['type'];valid=(isinstance(val,str) if t=='string' else type(val) is bool if t=='boolean' else val in field['choices'] if t=='enum' else number(val))
                if not valid: add('BLOCK','FIELD',loc+'.'+key,'Required typed field invalid');continue
                if t=='number' and ('min' in field and val<field['min'] or 'minExclusive' in field and val<=field['minExclusive']): add('BLOCK','RANGE',loc+'.'+key,'Value outside allowed range')
            if 'asset' in spec['fields'] and isinstance(a.get('asset'),str):
                asset=ASSETS.get(a['asset']);p=asset_path(a['asset'])
                if not asset or (asset.get('path') and check_assets and (p is None or not p.is_file())): add('WARNING','MISSING_ASSET',loc,'Preview proxy; semantic actor retained')
            if cls=='PresentationActor' and a.get('path') not in paths: add('BLOCK' if a.get('enabled') else 'WARNING','MISSING_PATH',loc,'Choose an existing path')
            unknown=set(a)-set(spec['fields'])-{'class','ra_id','transform'}
            if unknown: add('WARNING','UNKNOWN_PRESERVED',loc,', '.join(sorted(unknown)))
    deleted=set()
    for t in doc['tombstones']:
        if not isinstance(t,dict) or not isinstance(t.get('ra_id'),str) or not t.get('ra_id') or t.get('deleted') is not True: add('BLOCK','TOMBSTONE','tombstones','ra_id and deleted=true required');continue
        if t['ra_id'] in ids or t['ra_id'] in deleted: add('BLOCK','TOMBSTONE_CONFLICT',t['ra_id'],'Deleted ID conflicts with active or duplicate record')
        deleted.add(t['ra_id'])
    if scene_ids is not None:
        for ident in ids-set(scene_ids): add('BLOCK','MISSING_FROM_SCENE',ident,'Reload or restore; absence is not semantic deletion')
    return issues

def reconcile(source, actors, decorations, paths, deleted=()):
    """Missing referenced records survive. Only an explicit delete creates tombstones."""
    out=copy.deepcopy(source);deleted=set(deleted)
    existing={a.get('ra_id'):a for a in actors if isinstance(a,dict)}
    result=[];seen=set()
    for old in source['actors']:
        ident=old.get('ra_id')
        if ident in deleted: continue
        result.append(copy.deepcopy(existing.get(ident,old)));seen.add(ident)
    result += [copy.deepcopy(a) for a in actors if a.get('ra_id') not in seen and a.get('ra_id') not in deleted]
    # Keep duplicate scene IDs for validation rather than silently merging them.
    counts={}
    for a in actors:
        i=a.get('ra_id');counts[i]=counts.get(i,0)+1
        if counts[i]>1: result.append(copy.deepcopy(a))
    out['actors']=result;out['decorations']=copy.deepcopy(decorations);out['paths']=copy.deepcopy(paths)
    known={t['ra_id'] for t in out['tombstones']}
    for ident in sorted(deleted-known): out['tombstones'].append({'ra_id':ident,'deleted':True})
    return out

def sample_path(points, seconds, start, duration, loop):
    t=max(0,(seconds-start)/duration)
    t=t%1 if loop and seconds>=start else min(1,t)
    lengths=[math.dist([a[k] for k in ('x','y','z')],[b[k] for k in ('x','y','z')]) for a,b in zip(points,points[1:])]
    distance=t*sum(lengths)
    for a,b,length in zip(points,points[1:],lengths):
        if distance<=length and length: return {k:a[k]+(b[k]-a[k])*distance/length for k in ('x','y','z')}
        distance-=length
    return {k:points[-1][k] for k in ('x','y','z')}

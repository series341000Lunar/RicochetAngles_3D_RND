"""Loopback DCC-00 workspace only. No arbitrary write path, no dependencies."""
import argparse, hashlib, json, os, sys, tempfile, threading
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit
ROOT=Path(__file__).resolve().parents[1]; REPO=ROOT.parent
sys.path.insert(0,str(ROOT/'blender_addon/ricochetangles_dcc00'))
from core import validate
WORKSPACE=ROOT/'workspace/testbed.authoring.json'; LOCK=threading.Lock()
def encode(doc): return (json.dumps(doc,ensure_ascii=False,indent=2,allow_nan=False)+'\n').encode('utf-8')
def atomic_write(data):
    WORKSPACE.parent.mkdir(parents=True,exist_ok=True)
    with tempfile.NamedTemporaryFile(dir=WORKSPACE.parent,suffix='.tmp',delete=False) as f:
        tmp=f.name;f.write(data);f.flush();os.fsync(f.fileno())
    try: os.replace(tmp,WORKSPACE)
    finally:
        if os.path.exists(tmp): os.unlink(tmp)
def read():
    raw=WORKSPACE.read_bytes();return json.loads(raw.decode('utf-8-sig')),hashlib.sha256(raw).hexdigest()
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*a,**kw): super().__init__(*a,directory=str(REPO),**kw)
    def json_reply(self,status,data):
        body=encode(data);self.send_response(status);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(body)));self.send_header('Cache-Control','no-store');self.end_headers();self.wfile.write(body)
    def trusted(self):
        expected=f'127.0.0.1:{self.server.server_port}'
        return self.headers.get('Host')==expected and self.headers.get('Origin',f'http://{expected}')==f'http://{expected}'
    def do_GET(self):
        if not self.trusted(): return self.json_reply(403,{'error':'Loopback origin required'})
        route=urlsplit(self.path).path
        if route=='/api/workspace':
            try:
                with LOCK: doc,revision=read()
                return self.json_reply(200,dict(document=doc,revision=revision,validation=validate(doc)))
            except (ValueError,OSError) as e: return self.json_reply(422,dict(error='WORKSPACE_PARSE_FAILURE',detail=str(e)))
        if route.startswith('/api/'): return self.json_reply(404,{'error':'Unknown endpoint'})
        p=Path(self.translate_path(self.path)).resolve()
        if not p.is_relative_to(REPO.resolve()) or any(part.startswith('.') for part in p.relative_to(REPO.resolve()).parts) or p.is_dir() or 'MainlineReference' in p.parts:
            return self.json_reply(403,{'error':'Not a public testbed file'})
        super().do_GET()
    def do_PUT(self):
        if not self.trusted(): return self.json_reply(403,{'error':'Loopback origin required'})
        if self.path!='/api/workspace': return self.json_reply(404,{'error':'Only the designated workspace can be saved'})
        if self.headers.get('Content-Type')!='application/json': return self.json_reply(415,{'error':'application/json required'})
        try:
            size=int(self.headers.get('Content-Length','0'))
            if not 0<size<=8*1024*1024: return self.json_reply(413,{'error':'Workspace exceeds 8 MiB'})
            doc=json.loads(self.rfile.read(size));issues=validate(doc)
            if any(i['level']=='BLOCK' for i in issues): return self.json_reply(422,{'validation':issues})
            data=encode(doc)
            with LOCK:
                old,revision=read()
                if self.headers.get('If-Match')!=revision: return self.json_reply(409,{'error':'STALE_WORKSPACE: reload before saving'})
                oldids={a['ra_id'] for a in old['actors']};newids={a['ra_id'] for a in doc['actors']};tombs={t['ra_id'] for t in doc['tombstones']}
                if oldids-newids-tombs: return self.json_reply(422,{'error':'Referenced actor disappearance requires an explicit tombstone'})
                if any(t not in doc['tombstones'] for t in old['tombstones']): return self.json_reply(422,{'error':'Existing tombstones must be preserved'})
                atomic_write(data)
            self.json_reply(200,dict(document=doc,revision=hashlib.sha256(data).hexdigest(),validation=issues))
        except (ValueError,TypeError,KeyError,OSError) as e: self.json_reply(422,{'error':str(e)})
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--port',type=int,default=8766);args=parser.parse_args()
    if not WORKSPACE.exists(): atomic_write((ROOT/'fixtures/seed.authoring.json').read_bytes())
    print(f'DCC-00 editor: http://127.0.0.1:{args.port}/dcc00/html/editor.html',flush=True)
    print(f'DCC-00 testbed: http://127.0.0.1:{args.port}/dcc00/html/testbed.html',flush=True)
    ThreadingHTTPServer(('127.0.0.1',args.port),Handler).serve_forever()

import copy,importlib.util,json,sys,tempfile,threading,unittest,urllib.request,urllib.error
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'blender_addon/ricochetangles_dcc00'))
import core
spec=importlib.util.spec_from_file_location('server',ROOT/'server/authoring_server.py');server=importlib.util.module_from_spec(spec);spec.loader.exec_module(server)
class Contract(unittest.TestCase):
    def setUp(self):self.doc=json.loads((ROOT/'fixtures/seed.authoring.json').read_text())
    def codes(self,d):return {i['code'] for i in core.validate(d)}
    def test_seed(self):self.assertFalse(any(i['level']=='BLOCK' for i in core.validate(self.doc)))
    def test_identity(self):
        self.doc['actors'][1]['ra_id']=self.doc['actors'][0]['ra_id'];self.assertIn('DUPLICATE_ID',self.codes(self.doc));del self.doc['actors'][1]['ra_id'];self.assertIn('MISSING_ID',self.codes(self.doc))
    def test_unknown_preservation(self):
        out=core.reconcile(self.doc,self.doc['actors'],self.doc['decorations'],self.doc['paths']);self.assertEqual(out,self.doc)
    def test_missing_preserved_and_blocked(self):
        out=core.reconcile(self.doc,self.doc['actors'][1:],self.doc['decorations'],self.doc['paths']);self.assertEqual(out['actors'],self.doc['actors']);self.assertTrue(any(i['code']=='MISSING_FROM_SCENE' for i in core.validate(out,[])))
    def test_tombstone(self):
        out=core.reconcile(self.doc,self.doc['actors'][1:],self.doc['decorations'],self.doc['paths'],['tank-scout']);self.assertNotIn('tank-scout',[a['ra_id'] for a in out['actors']]);self.assertIn({'ra_id':'tank-scout','deleted':True},out['tombstones'])
    def test_anonymous_delete(self):
        out=core.reconcile(self.doc,self.doc['actors'],[],self.doc['paths']);self.assertEqual(out['decorations'],[]);self.assertEqual(out['tombstones'],[]);self.assertNotIn('ra_id',core.new_actor('Decoration'))
    def test_invalid_numbers_class_and_path(self):
        self.doc['actors'][0]['homeRadius']=float('nan');self.doc['actors'][2]['sizeX']=0;self.doc['actors'][4]['class']='Future';self.doc['actors'][5]['path']='missing';self.doc['actors'][5]['durationSeconds']=0
        self.assertTrue({'FIELD','RANGE','UNKNOWN_CLASS','MISSING_PATH'}<=self.codes(self.doc))
    def test_missing_asset(self):
        self.doc['actors'][0]['asset']='not-present';self.assertIn('MISSING_ASSET',self.codes(self.doc));self.assertFalse(any(i['level']=='BLOCK' for i in core.validate(self.doc)))
    def test_asset_inventory(self):self.assertTrue(core.asset_path('m41').is_file());self.assertIsNone(core.asset_path('unknown'))
    def test_path_timing(self):
        p=[dict(x=0,y=0,z=0),dict(x=10,y=0,z=0),dict(x=10,y=10,z=0)]
        self.assertEqual(core.sample_path(p,6,1,10,False),dict(x=10,y=0,z=0));self.assertEqual(core.sample_path(p,11,1,10,True),p[0]);self.assertEqual(core.sample_path(p,0,1,10,False),p[0])
    def test_bad_document_shapes(self):
        for d in [[],{},dict(self.doc,actors={}),dict(self.doc,paths=[{'id':[],'points':None}])]:self.assertTrue(any(i['level']=='BLOCK' for i in core.validate(d)))
class HTTP(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp=tempfile.TemporaryDirectory();server.WORKSPACE=Path(cls.tmp.name)/'only.authoring.json';server.atomic_write((ROOT/'fixtures/seed.authoring.json').read_bytes());cls.http=server.ThreadingHTTPServer(('127.0.0.1',0),server.Handler);cls.port=cls.http.server_port;threading.Thread(target=cls.http.serve_forever,daemon=True).start()
    @classmethod
    def tearDownClass(cls):cls.http.shutdown();cls.http.server_close();cls.tmp.cleanup()
    def req(self,method='GET',path='/api/workspace',doc=None,headers=None):
        h={'Content-Type':'application/json',**(headers or {})};request=urllib.request.Request(f'http://127.0.0.1:{self.port}'+path,data=None if doc is None else json.dumps(doc).encode(),headers=h,method=method)
        try:
            with urllib.request.urlopen(request) as result:return result.status,json.load(result)
        except urllib.error.HTTPError as e:return e.code,json.load(e)
    def test_http_boundaries_and_conflict(self):
        status,data=self.req();self.assertEqual(status,200);doc=data['document'];doc['actors'][0]['homeRadius']=321
        status,saved=self.req('PUT',doc=doc,headers={'If-Match':data['revision']});self.assertEqual(status,200);self.assertEqual(saved['document']['futureExtension'],doc['futureExtension'])
        self.assertEqual(self.req('PUT',doc=doc,headers={'If-Match':data['revision']})[0],409)
        self.assertEqual(self.req('PUT','/arbitrary.json',doc)[0],404)
        self.assertEqual(self.req('PUT',doc=doc,headers={'Origin':'https://other.example'})[0],403)
        self.assertEqual(self.req(path='/.git/config')[0],403)
        removed=copy.deepcopy(doc);removed['actors'].pop(0);self.assertEqual(self.req('PUT',doc=removed,headers={'If-Match':saved['revision']})[0],422)
        server.WORKSPACE.write_text('{broken');self.assertEqual(self.req()[0],422)
if __name__=='__main__':unittest.main(verbosity=2)

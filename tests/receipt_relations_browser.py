"""GOATnote RECEIPT-RELATIONS-002: real Chromium mobile, consent and TIME-CUT witness."""
import json, pathlib, threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

ROOT=pathlib.Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):
        super().__init__(*args,directory=str(ROOT),**kwargs)
    def do_GET(self):
        if self.path.startswith('/nested/GOATnote/'):
            self.path=self.path[len('/nested/GOATnote'):]
        super().do_GET()
    def log_message(self,*args): pass

HASH='a'*64
SOURCE='2026-10-09T12:00:00.000Z'
receipt={
 'id':'receipt-one','title':'Frozen WebZ receipt','draft':'A human revised draft',
 'versions':[{'id':'webz-source-'+HASH,'text':'Original receipt byte witness','createdAt':SOURCE},
             {'id':'later-edit','text':'Later interpretation','createdAt':'2026-10-10T12:00:00.000Z'}],
 'margins':[],'returnThreads':[],
 'webzReceipt':{'source_sha256':'sha256:'+HASH,'imported_from':'EXPLICIT_WEBZ_HANDOFF'}
}
human={
 'id':'another-note','title':'Notebook observation','draft':'Updated local draft',
 'versions':[{'id':'human-source-v0','text':'Original human passage','createdAt':SOURCE}],
 'margins':[],'returnThreads':[]
}
seed={'schema':1,'notes':[receipt,human],'edges':[],'rooms':[],'walks':[]}
server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
origin=f'http://127.0.0.1:{server.server_port}'
results=[]
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True)
  for prefix in ('/','/nested/GOATnote/'):
   context=browser.new_context(viewport={'width':360,'height':780},accept_downloads=True)
   page=context.new_page()
   errors=[]; requests=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   context.on('request',lambda r:requests.append(r.url))
   page.on('dialog',lambda d:d.accept())
   page.goto(origin+prefix)
   page.evaluate('(seed) => localStorage.setItem("goatnote-v1",JSON.stringify(seed))',seed)
   page.reload()
   assert page.locator('#openReceiptRelations').count()==1
   page.locator('#openReceiptRelations').click()
   assert page.locator('#receiptRelationDialog').evaluate('(e) => e.open')
   page.locator('#rr-from').select_option('receipt-one')
   page.locator('#rr-to').select_option('another-note')
   page.locator('#rr-type').fill('echoes the human source')
   page.locator('#rr-discovery').fill('I first noticed a recurrence after rereading both frozen originals')
   page.locator('#rr-evidence').fill('The two saved versions; significance not yet established')
   page.locator('#receiptRelationForm button[type=submit]').click()
   page.wait_for_function("""() => {
     const db=JSON.parse(localStorage.getItem('goatnote-v1')||'{}');
     return db.edges?.length===1 && db.rooms?.length===1 && !!window.GOATtimeAPI;
   }""")
   state=page.evaluate("""() => {
     const db=JSON.parse(localStorage.getItem('goatnote-v1'));
     const e=db.edges[0], room=db.rooms[0];
     const before=window.GOATtimeAPI.snapshot(room.id,new Date(Date.parse(e.firstPerceivedAt)-1).toISOString());
     const after=window.GOATtimeAPI.snapshot(room.id,e.firstPerceivedAt);
     return {edge:e, room, before:before.items.find(x=>x.kind==='edge').historical.status,
       after:after.items.find(x=>x.kind==='edge').historical.status, notes:db.notes.length};
   }""")
   assert state['edge']['from']['versionId']=='webz-source-'+HASH
   assert state['edge']['to']['versionId']=='human-source-v0'
   assert state['edge']['status']=='perceived'
   assert state['room']['items'][-1]['kind']=='edge'
   assert state['before']=='not-yet-perceived'
   assert state['after']=='perceived'
   assert state['notes']==2
   page.locator('#goatedge-open').click()
   page.locator('#ge-list-view button').filter(has_text='INSPECT').click()
   assert page.locator('#ge-edit-view input[aria-label="First perceived at"]').is_disabled()
   assert page.locator('#ge-edit-view button').filter(has_text='HOLD CURRENT AS FROM').is_disabled()
   assert page.locator('#ge-edit-view button').filter(has_text='NOT TRAVERSABLE').is_disabled()
   assert not errors,errors
   assert all(urlparse(url).netloc==urlparse(origin).netloc for url in requests)
   results.append({'prefix':prefix,'human_confirmed':True,'source_frozen':True,
     'timecut_before':'not-yet-perceived','timecut_after':'perceived',
     'auto_admit':False,'third_party_requests':0,'browser_errors':0})
   context.close()
  browser.close()
 print(json.dumps({'schema':'goatnote/receipt-relations-chromium/v0','results':results},indent=2))
finally:
 server.shutdown()
 server.server_close()

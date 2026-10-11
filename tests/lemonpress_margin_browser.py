"""GOATnote x LemonPRESS: one explicit human margin travels, private notebook does not."""
import json,pathlib,threading
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT),**kw)
 def do_GET(self):
  if self.path.startswith('/nested/GOATnote/'):self.path=self.path[len('/nested/GOATnote'):]
  super().do_GET()
 def log_message(self,*a):pass
time='2026-10-11T15:30:00.000Z'
quote='The house takes attendance.'
body='A private preface. '+quote+' Confidential epilogue.'
start=body.index(quote)
db={'schema':1,'notes':[
 {'id':'receipt-note','title':'An old source','draft':'UNSELECTED_LATER_DRAFT',
 'versions':[{'id':'v-source','text':body,'createdAt':time}],
 'margins':[{'id':'m1','kind':'question','text':'When was this relation first seen?',
  'versionId':'v-source','anchor':{'start':start,'end':start+len(quote),'quote':quote},
  'createdAt':time}],
 'returnThreads':[{'id':'rt-private','sourceVersionId':'v-source','entries':[
  {'id':'rt-entry','kind':'carry','text':'NEVER_EXPORT_PRIVATE_THREAD'}]}]},
 {'id':'private-note','title':'PRIVATE_OTHER_NOTE','draft':'HIDDEN_DRAFT',
  'versions':[{'id':'v-hidden','text':'TOP_SECRET_OTHER_VERSION'}],'margins':[]}
 ],'edges':[{'id':'edge1','type':'echoes','status':'perceived',
  'from':{'noteId':'receipt-note','versionId':'v-source','anchor':None},
  'to':{'noteId':'private-note','versionId':'v-hidden','anchor':None},
  'firstPerceivedAt':'2026-10-10T09:00:00.000Z',
  'discoveryTrace':'An observation made in time',
  'evidencePath':'Two source versions'}],'walks':[],'rooms':[]}
srv=ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=srv.serve_forever,daemon=True).start()
origin=f'http://127.0.0.1:{srv.server_port}'
result=[]
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True)
  for prefix in ('/','/nested/GOATnote/'):
   context=browser.new_context(viewport={'width':360,'height':760},is_mobile=True,has_touch=True,accept_downloads=True)
   page=context.new_page();errors=[];requests=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   context.on('request',lambda r:requests.append(r.url))
   page.goto(origin+prefix)
   page.evaluate('(db)=>localStorage.setItem("goatnote-v1",JSON.stringify(db))',db)
   page.reload()
   page.locator('#openLemonPress').click()
   page.locator('#lpm-note').select_option('receipt-note')
   page.locator('#lpm-margin').select_option('m1')
   page.locator('#lpm-edge').select_option('edge1')
   # The first attempt is declined; no file is downloaded and no notebook mutation.
   page.once('dialog',lambda d:d.dismiss())
   page.locator('#lpm-export').click()
   assert 'Disclosure declined' in page.locator('#lpm-status').inner_text()
   assert page.evaluate('JSON.parse(localStorage.getItem("goatnote-v1")).notes.length')==2
   page.once('dialog',lambda d:d.accept())
   with page.expect_download() as dl:
    page.locator('#lpm-export').click()
   packet=json.loads(pathlib.Path(dl.value.path()).read_text())
   assert packet['schema']=='goatnote.lemonpress-margin/v0'
   assert packet['source']['excerpt']==quote
   assert packet['reading']['margin_id']=='m1'
   assert packet['relation']['first_perceived_at']=='2026-10-10T09:00:00.000Z'
   assert packet['source']['version_body_disclosed'] is False
   assert packet['authority']['press_admission'] is False
   raw=json.dumps(packet)
   for secret in ['TOP_SECRET_OTHER_VERSION','NEVER_EXPORT_PRIVATE_THREAD',
                  'UNSELECTED_LATER_DRAFT','Confidential epilogue.',
                  'A private preface.','PRIVATE_OTHER_NOTE']:
    assert secret not in raw,secret
   assert not errors,errors
   assert all(urlparse(url).netloc==urlparse(origin).netloc for url in requests)
   result.append({'path':prefix,'one_margin':True,'private_notes_not_carried':True,
       'decline_safe':True,'relation_opt_in':True,'third_party_requests':0})
   context.close()
  browser.close()
 print(json.dumps({'schema':'goatnote/lemonpress-selected-margin-browser/v0','results':result},indent=2))
finally:srv.shutdown();srv.server_close()

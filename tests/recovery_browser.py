"""GOATnote Recovery Gate 003: browser file export, tamper refusal, fresh-context restore,
native TIME-CUT replay, mobile touch, nested URL and no remote transport."""
import json,pathlib,threading
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

ROOT=pathlib.Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
 def do_GET(self):
  if self.path.startswith('/nested/GOATnote/'):
   self.path=self.path[len('/nested/GOATnote'):]
  super().do_GET()
 def log_message(self,*args):pass

hashpart='a'*64
time='2026-10-10T11:00:00.000Z'
receipt={'id':'receipt-source','title':'WebZ original','draft':'later commentary',
 'versions':[{'id':'webz-source-'+hashpart,'text':'Immutable record and source byte assertion','title':'Frozen original','createdAt':time},
             {'id':'later-human-draft','text':'later commentary','createdAt':'2026-10-11T09:00:00.000Z'}],
 'margins':[{'id':'margin-witness','kind':'witness','versionId':'webz-source-'+hashpart,
             'text':'Human question carried beside source','createdAt':time,
             'anchor':{'start':0,'end':9,'quote':'Immutable'}}],
 'returnThreads':[{'id':'return-1','sourceVersionId':'webz-source-'+hashpart,'createdAt':time,
                   'entries':[{'id':'carry-1','kind':'carry','text':'Do not overwrite origin','createdAt':time}]}],
 'webzReceipt':{'source_sha256':'sha256:'+hashpart,'source_schema':'cannon.branch-work-receipt/v0',
                'reported_mode':'UNVERIFIED_ARCHIVE','goatnote_signature_verified':False,
                'human_signer_authenticated':False,'imported_from':'EXPLICIT_WEBZ_HANDOFF',
                'evidence_relation_posture':'NO_AUTHORITY_TRANSFER'}}
human={'id':'human-source','title':'Human independent memory','draft':'Original memory',
       'versions':[{'id':'v-human','text':'Original memory','createdAt':time}],
       'margins':[],'returnThreads':[]}
walk={'id':'walk-1','title':'Human walk','mode':'story','createdAt':time,'updatedAt':time,
 'stops':[{'id':'walk-stop','kind':'source','noteId':'receipt-source',
           'versionId':'webz-source-'+hashpart,'noteTitleAtAdd':'WebZ original',
           'anchor':None,'transition':'Retain exact version','addedAt':time}]}
seed={'schema':1,'notes':[receipt,human],'walks':[walk],'rooms':[],'edges':[]}

server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
origin=f'http://127.0.0.1:{server.server_port}'
results=[]
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True)
  for prefix in ('/','/nested/GOATnote/'):
   url=origin+prefix
   # Touch-enabled Chromium viewport to exercise the actual DOM, not a DOM stub.
   context=browser.new_context(viewport={'width':360,'height':780},
       is_mobile=True,has_touch=True,device_scale_factor=2,accept_downloads=True)
   page=context.new_page()
   errors=[];requests=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   context.on('request',lambda r:requests.append(r.url))
   page.on('dialog',lambda d:d.accept())
   page.goto(url)
   page.evaluate('(seed) => localStorage.setItem("goatnote-v1",JSON.stringify(seed))',seed)
   page.reload()
   page.locator('#openReceiptRelations').click()
   page.locator('#rr-from').select_option('receipt-source')
   page.locator('#rr-to').select_option('human-source')
   page.locator('#rr-discovery').fill('I first saw this relationship while reviewing the exact source today')
   page.locator('#rr-evidence').fill('Different frozen source versions, no causal claim')
   page.locator('#receiptRelationForm button[type=submit]').click()
   page.wait_for_function("""() => {
     const db=JSON.parse(localStorage.getItem('goatnote-v1')||'{}');
     return db.edges?.length===1 && db.rooms?.length===1 && !!window.GOATtimeAPI;
   }""")
   initial=page.evaluate('JSON.parse(localStorage.getItem("goatnote-v1"))')
   assert initial['notes'][0]['margins'][0]['anchor']['quote']=='Immutable'
   assert initial['notes'][0]['returnThreads'][0]['entries'][0]['text']=='Do not overwrite origin'
   assert initial['edges'][0]['status']=='perceived'
   assert initial['edges'][0]['from']['versionId']=='webz-source-'+hashpart
   page.locator('#openRecovery').click()
   with page.expect_download() as download:
    page.locator('#grc-export').click()
   file=pathlib.Path(download.value.path())
   payload=json.loads(file.read_text())
   assert payload['schema']=='goatnote.recovery-bundle/v0'
   assert payload['posture']=='SELF_CHECKSUM_NOT_AUTHENTICATED'
   assert payload['notebook']==initial
   assert payload['notebook']['walks'][0]['stops'][0]['versionId']=='webz-source-'+hashpart
   assert payload['notebook']['rooms'][0]['items'][-1]['kind']=='edge'
   # Occupied notebook is never overwritten by this recovery entrance.
   page.locator('#grc-file').set_input_files({'name':'snapshot.json','mimeType':'application/json',
     'buffer':json.dumps(payload).encode()})
   page.wait_for_function("()=>document.querySelector('#grc-result').textContent.includes('already has a notebook')")
   assert page.locator('#grc-restore').is_disabled()
   assert page.evaluate('JSON.parse(localStorage.getItem("goatnote-v1")).edges.length')==1
   # Fresh browser profile with isolated localStorage.
   clean=browser.new_context(viewport={'width':320,'height':740},
       is_mobile=True,has_touch=True,device_scale_factor=2,accept_downloads=True)
   q=clean.new_page();clean_errors=[];clean_requests=[]
   q.on('pageerror',lambda e:clean_errors.append(str(e)))
   clean.on('request',lambda r:clean_requests.append(r.url))
   q.on('dialog',lambda d:d.accept())
   q.goto(url)
   assert q.evaluate('localStorage.getItem("goatnote-v1")') is None
   q.locator('#openRecovery').click()
   corrupted=json.loads(json.dumps(payload))
   corrupted['notebook']['notes'][0]['versions'][0]['text']='FORGED OVERWRITE'
   q.locator('#grc-file').set_input_files({'name':'tampered.json','mimeType':'application/json',
     'buffer':json.dumps(corrupted).encode()})
   q.wait_for_function("()=>document.querySelector('#grc-result').textContent.includes('CHECKSUM_MISMATCH')")
   assert q.locator('#grc-restore').is_disabled()
   assert q.evaluate('localStorage.getItem("goatnote-v1")') is None
   q.locator('#grc-file').set_input_files({'name':'snapshot.json','mimeType':'application/json',
     'buffer':json.dumps(payload).encode()})
   q.wait_for_function("()=>document.querySelector('#grc-result').textContent.includes('SELF_CHECKSUM_VALID')")
   assert q.locator('#grc-restore').is_disabled()
   q.locator('#grc-word').fill('RESTORE')
   assert q.locator('#grc-restore').is_enabled()
   q.locator('#grc-restore').click()
   q.wait_for_function("""() => !!window.GOATtimeAPI && !!JSON.parse(localStorage.getItem('goatnote-v1')||'{}').edges?.length""")
   recovered=q.evaluate("""() => {
      const db=JSON.parse(localStorage.getItem('goatnote-v1')),e=db.edges[0],room=db.rooms[0];
      const before=window.GOATtimeAPI.snapshot(room.id,new Date(Date.parse(e.firstPerceivedAt)-1).toISOString());
      const after=window.GOATtimeAPI.snapshot(room.id,e.firstPerceivedAt);
      return {db,before:before.items.find(x=>x.kind==='edge').historical.status,
        after:after.items.find(x=>x.kind==='edge').historical.status,
        traversable:window.GOATedgesAPI.isTraversable(e)};
   }""")
   assert recovered['db']==initial
   assert recovered['before']=='not-yet-perceived'
   assert recovered['after']=='perceived'
   assert recovered['traversable'] is False
   assert len(recovered['db']['notes'][0]['margins'])==1
   assert len(recovered['db']['notes'][0]['returnThreads'])==1
   assert recovered['db']['walks'][0]['stops'][0]['versionId']=='webz-source-'+hashpart
   assert q.evaluate('document.documentElement.scrollWidth<=window.innerWidth')
   assert all(urlparse(req).netloc==urlparse(origin).netloc for req in requests+clean_requests)
   assert not errors,errors
   assert not clean_errors,clean_errors
   results.append({'path':prefix,'viewport':'320–360 touch Chromium',
     'full_file_roundtrip':True,'tamper_refused':True,'occupied_restore_blocked':True,
     'source_history_preserved':True,'timecut_before':recovered['before'],
     'timecut_after':recovered['after'],'external_requests':0})
   clean.close();context.close()
  browser.close()
 print(json.dumps({'schema':'goatnote/recovery-browser-witness/v0','results':results},indent=2))
finally:server.shutdown();server.server_close()

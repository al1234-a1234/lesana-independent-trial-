"""Run from the authoring project against an independently extracted source release."""
import pathlib,subprocess,os,time,signal,json,urllib.request,http.cookiejar,uuid,sys
root=pathlib.Path(sys.argv[1]).resolve();out=pathlib.Path(__file__).resolve().parents[1]/'evidence';base='http://localhost:3001';jar=http.cookiejar.CookieJar();opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar));log=open(out/'release-smoke-server.log','w');env=dict(os.environ);env.pop('APP_ORIGIN',None);env.update({'PORT':'3001','SAT_DATABASE_PATH':str(root/'.smoke-data'/'state.sqlite'),'NEXT_TELEMETRY_DISABLED':'1'})
def start():
 p=subprocess.Popen(['node','node_modules/next/dist/bin/next','start','--port','3001','--hostname','127.0.0.1'],cwd=root,env=env,stdout=log,stderr=log,start_new_session=True)
 for _ in range(50):
  try:
   with opener.open(base+'/api/state',timeout=1) as r:return p,json.load(r)
  except Exception:
   if p.poll() is not None:raise RuntimeError('Server failed; see release smoke log')
   time.sleep(.2)
 raise RuntimeError('Server readiness timeout')
def stop(p):
 os.killpg(p.pid,signal.SIGTERM);p.wait(timeout=10)
proc=None
try:
 proc,initial=start();assert not initial['records'];content=json.loads((root/'content/stories.json').read_text())[0];line=content['lines'][0]
 attempt={'id':str(uuid.uuid4()),'lineId':content['slug']+'-1','inputs':[line['text']],'punctuation':False,'durationMs':1000,'replays':0,'mode':'story'}
 request=urllib.request.Request(base+'/api/attempts',data=json.dumps(attempt).encode(),headers={'Content-Type':'application/json','Origin':base})
 with opener.open(request,timeout=5) as r:saved=json.load(r)
 assert len(saved['records'])==1;stop(proc);proc=None
 proc,restarted=start();assert len(restarted['records'])==1;assert restarted['records'][0]['attempts']==1
 result={'source':'Independently extracted ZIP with fresh npm ci --offline and production build','defaultEnvironment':'APP_ORIGIN absent; localhost URL from README','initialRecordCount':0,'savedRecordCount':len(saved['records']),'recordCountAfterProcessRestart':len(restarted['records']),'attemptsAfterRestart':restarted['records'][0]['attempts'],'result':'PASS','cookiesSavedInEvidence':False}
 (out/'release-smoke.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
finally:
 if proc and proc.poll() is None:stop(proc)
 log.close()

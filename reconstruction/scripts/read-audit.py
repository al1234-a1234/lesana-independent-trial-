"""Optional provenance check. Reads a local audit ZIP; never accesses the network."""
import sys,zipfile,json,hashlib,pathlib
archive=pathlib.Path(sys.argv[1]);out=pathlib.Path(__file__).resolve().parents[1]/'evidence'/'source-analysis.json'
tests={
'01526328ce5bcd21.js':['StoryPlayer','record_line','fahm_pending_lines','wrong>=3','accuracy<.9'],
'ffb4a6e0ea79abfb.js':['LinePlayer','playbackRate','preservesPitch','speechSynthesis','canonicalChar','charsMatch','KeyboardCapture']}
result={'archiveSha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'networkRequests':0,'sourceFiles':[],'runtimeImportsFromAudit':0}
with zipfile.ZipFile(archive) as z:
 for name,markers in tests.items():
  candidate=next(n for n in z.namelist() if n.endswith('/assets/'+name));raw=z.read(candidate);text=raw.decode();result['sourceFiles'].append({'entry':candidate,'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest(),'markers':{m:m in text for m in markers}})
out.write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))

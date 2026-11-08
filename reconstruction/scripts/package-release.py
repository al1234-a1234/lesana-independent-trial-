"""Build a source release without local databases, credentials or dependencies."""
import pathlib,zipfile,hashlib,json,sys
root=pathlib.Path(__file__).resolve().parents[1]
target=pathlib.Path(sys.argv[1] if len(sys.argv)>1 else root.parent/'library-files'/'satr-rebuild.zip');target.parent.mkdir(parents=True,exist_ok=True)
excluded={'node_modules','.next','.git','.test-data','test-results','__pycache__','docs'}
files=[]
for f in sorted(root.rglob('*')):
 rel=f.relative_to(root)
 if not f.is_file() or any(part in excluded for part in rel.parts):continue
 if f.name in ['SHA256.json','tsconfig.tsbuildinfo'] or f.suffix in ['.sqlite','.sqlite-wal','.sqlite-shm','.pyc']:continue
 if f.name.startswith('.env') and f.name!='.env.example':continue
 if rel.parts[0]=='private-data' and f.name!='.gitkeep':continue
 files.append(f)
manifest=[{'file':str(f.relative_to(root)),'bytes':f.stat().st_size,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()} for f in files]
(root/'SHA256.json').write_text(json.dumps(manifest,indent=2));files.append(root/'SHA256.json')
with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED) as archive:
 for file in files:archive.write(file,pathlib.Path('satr-rebuild')/file.relative_to(root))
with zipfile.ZipFile(target) as archive:
 assert archive.testzip() is None
 assert sum(name.count('/')==1 and name.endswith('.md') for name in archive.namelist())==10
 assert not any('/node_modules/' in name or name.endswith('.sqlite') for name in archive.namelist())
 for m in manifest:assert hashlib.sha256(archive.read('satr-rebuild/'+m['file'])).hexdigest()==m['sha256']
print(json.dumps({'zip':str(target),'bytes':target.stat().st_size,'files':len(files),'sha256':hashlib.sha256(target.read_bytes()).hexdigest()},indent=2))

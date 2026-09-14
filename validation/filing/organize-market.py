from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo
import re,json,hashlib,os,sys,collections
vault=Path('/Users/tongshen/Koumakan_Library');base=vault/'Market'
backup=Path('/Users/tongshen/Library/Application Support/Patchouli/backups/market-filing-20260913')
files=sorted(base.glob('*.md'));mapping={};raw={};groups=collections.Counter()
for p in files:
 text=p.read_text();match=re.search(r'^"?created_at"?:\s*"([^"\n]+)"',text,re.M)
 if not match:raise ValueError(f'Missing creation date: {p}')
 dt=datetime.fromisoformat(match[1].replace('Z','+00:00')).astimezone(ZoneInfo('America/New_York'))
 folder=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][dt.month-1]+dt.strftime('_%d_%y')
 target=base/folder/p.name
 assert not target.exists(),target
 mapping[str(p.relative_to(vault))]=str(target.relative_to(vault));raw[p]=p.read_bytes();groups[folder]+=1
# All existing links to these cards use unique filename wikilinks. Check the entire vault
# for path-dependent references; abort rather than guess a rewrite if one exists.
all_notes=list(vault.rglob('*.md'))
for old in mapping:
 stem=Path(old).stem
 assert sum(p.stem==stem for p in all_notes)==1,stem
 for p in all_notes:
  text=p.read_text()
  for target in re.findall(r'\[\[([^\]|#]+)',text):
   if '/' in target and (target.removesuffix('.md')==old.removesuffix('.md') or target.endswith('/'+stem)):
    raise ValueError(f'Path-dependent wikilink needs review: {p}: {target}')
  if re.search(r'\]\([^)]*'+re.escape(stem)+r'[^)]*\)',text):raise ValueError(f'Markdown path link needs review: {p}')
report={'timezone':'America/New_York','basis':'created_at','groups':dict(groups),'mapping':mapping,'sha256':{str(p.relative_to(vault)):hashlib.sha256(b).hexdigest() for p,b in raw.items()},'links':'Unique basename wikilinks retain targets after moves; no path-dependent references found'}
Path('validation/filing/market-plan.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(dict(groups)))
if '--apply' in sys.argv:
 backup.mkdir(parents=True,exist_ok=False)
 for p,b in raw.items():(backup/p.name).write_bytes(b)
 (backup/'plan.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
 for p,b in raw.items():
  assert p.read_bytes()==b,p
  dest=vault/mapping[str(p.relative_to(vault))];dest.parent.mkdir(exist_ok=True)
  os.link(p,dest) # no-clobber promotion, source retained until hash verification
  assert dest.read_bytes()==b
  p.unlink()
 print(f'Moved {len(raw)} cards; exact bytes verified; backup: {backup}')

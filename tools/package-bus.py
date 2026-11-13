"""Deterministic public package; explicit allowlist excludes local/private files."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED, ZipInfo
import json, shutil
root=Path(__file__).resolve().parents[1]
source=root/'scripting/wusheng-bus'
version=json.loads((source/'script.json').read_text(encoding='utf-8'))['version']
files=[source/n for n in ['index.tsx','widget.tsx','view.tsx','api.ts','model.ts','account.ts','login.ts','appearance.ts','nearby.ts','paging.ts','nearby-view.tsx','map.tsx','ride.ts','ride-page.tsx','app_intents.tsx','script.json','README.md']]+sorted((source/'vendor').glob('*'))
package=root/'packages'/('wusheng-bus-'+version+'.zip')
with ZipFile(package,'w',compression=ZIP_DEFLATED) as z:
 for p in files:
  assert p.is_file()
  info=ZipInfo(p.relative_to(source).as_posix(),date_time=(2026,11,11,0,0,0));info.compress_type=ZIP_DEFLATED
  z.writestr(info,p.read_bytes())
shutil.copyfile(package,package.with_suffix('.scripting'))
shutil.copyfile(package,root/'packages/wusheng-bus.scripting')
shutil.copyfile(package,root/'packages/wusheng-bus.zip')
print('Packaged public app and widget:',len(files),'files; no private account files included.')

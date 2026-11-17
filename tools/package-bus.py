"""Deterministic public package; explicit allowlist excludes local/private files."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED, ZipInfo
import json, shutil
root=Path(__file__).resolve().parents[1]
source=root/'scripting/wusheng-bus'
version=json.loads((source/'script.json').read_text(encoding='utf-8'))['version']
files=[source/n for n in ['README.md', 'account.ts', 'active-trip.ts', 'api.ts', 'app_intents.tsx', 'appearance.ts', 'frequent-stops.ts', 'index.tsx', 'login.ts', 'map.tsx', 'model.ts', 'nearby-view.tsx', 'nearby.ts', 'orders-page.tsx', 'orders.ts', 'paging.ts', 'places.ts', 'qr-ink.ts', 'rest-view.tsx', 'ride-page.tsx', 'ride-progress.ts', 'ride-ticket.tsx', 'ride-widget-cache.ts', 'ride-widget-gate.ts', 'ride-widget.tsx', 'ride.ts', 'route-links.ts', 'runtime.ts', 'script.json', 'style-preview.tsx', 'transit-page.tsx', 'transit-session.ts', 'transit.ts', 'trip-diagram.tsx', 'trip-origin.ts', 'trip-page.tsx', 'trip-planner.ts', 'trip-widget.tsx', 'version.ts', 'view.tsx', 'widget-actions.tsx', 'widget-display.ts', 'widget-ui.tsx', 'widget.tsx']]+sorted((source/'vendor').glob('*'))
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

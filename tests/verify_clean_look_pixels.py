"""Read-only raster evidence: distinguish an actual black outline from hidden draws."""
import json
from pathlib import Path
import numpy as np
from PIL import Image
root=Path(__file__).resolve().parents[1]/'Docs/clean-lookdev'
b=np.asarray(Image.open(root/'B-clean-low-poly-world.png').convert('RGB')).astype(int)
c=np.asarray(Image.open(root/'C-clean-black-outline-world.png').convert('RGB')).astype(int)
extra=(c.max(axis=2)<24)&(b.mean(axis=2)>35)
result={'black_outline_pixels':int(extra.sum()),'outline_screen_fraction':float(extra.mean()),
        'changed_pixels':int((np.max(abs(c-b),axis=2)>3).sum()),
        'pass':bool(extra.sum()>1000 and extra.mean()<.02)}
d=np.asarray(Image.open(root/'D-contour-only-all-world.png').convert('RGB')).astype(int)
# Ignore HUD labels: compare the battlefield raster under identical camera/settings.
roi=np.ones(b.shape[:2],dtype=bool);roi[:60]=False;roi[-60:]=False
outer=(d.max(axis=2)<24)&(b.mean(axis=2)>35)&roi
result['contour_only_black_pixels']=int(outer.sum())
result['contour_only_changed_pixels']=int(((np.max(abs(d-b),axis=2)>3)&roi).sum())
result['pass']=bool(result['pass'] and outer.sum()>1000 and outer.mean()<.02)
(root/'pixel-validation.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf8')
print(json.dumps(result));raise SystemExit(0 if result['pass'] else 1)

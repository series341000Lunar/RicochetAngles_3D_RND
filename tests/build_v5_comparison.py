from pathlib import Path
from PIL import Image,ImageDraw
import numpy as np,json
r=Path(__file__).resolve().parents[1]/'Docs/bloom_v5'
names=['A_Player_Bloom_OFF','B_Player_Bloom_ON','C_Boss_Bloom_OFF','D_Boss_Bloom_ON','E_Q_Bloom_OFF','F_Q_Bloom_ON','G_Focus_Boss_Bloom','H_45_Bloom_diagnostic']
sheet=Image.new('RGB',(1280,1560),(20,24,20));d=ImageDraw.Draw(sheet)
for i,n in enumerate(names):
 im=Image.open(r/('V5_'+n+'.png')).convert('RGB').resize((640,360))
 x=i%2*640;y=i//2*390;sheet.paste(im,(x,y+25));d.text((x+12,y+5),n,fill='white')
sheet.save(r/'V5_comparison.jpg',quality=92)
sheet=Image.new('RGB',(960,660),(20,24,20));d=ImageDraw.Draw(sheet);stats={}
for j,(a,b,box) in enumerate([('A_Player_Bloom_OFF','B_Player_Bloom_ON',(470,265,650,400)),('C_Boss_Bloom_OFF','D_Boss_Bloom_ON',(700,255,870,420)),('E_Q_Bloom_OFF','F_Q_Bloom_ON',(840,80,1040,240))]):
 for i,n in enumerate([a,b]):
  im=Image.open(r/('V5_'+n+'.png')).convert('RGB');crop=im.crop(box).resize((450,185));sheet.paste(crop,(i*480,j*220+25));d.text((i*480+8,j*220+5),n,fill='white')
 aa=np.array(Image.open(r/('V5_'+a+'.png')).convert('RGB')).astype(int);bb=np.array(Image.open(r/('V5_'+b+'.png')).convert('RGB')).astype(int)
 diff=np.abs(aa-bb);stats[a]={'max':int(diff.max()),'pixelsOver2':int((diff.max(axis=2)>2).sum()),'mean':float(diff.mean()),'yellowOff':int(np.all(aa==[255,217,13],axis=2).sum()),'yellowOn':int(np.all(bb==[255,217,13],axis=2).sum())}
sheet.save(r/'V5_crops.jpg',quality=95)
a=np.array(Image.open(r/'V5_M_Zero_Strength.png'));b=np.array(Image.open(r/'V5_N_No_Eligible_Source.png'))
stats['noEligibleSource_exact']=bool(np.array_equal(a,b))
a=np.array(Image.open(r/'V5_O_Player_Zero_Strength.png')).astype(int);b=np.array(Image.open(r/'V5_P_Player_Active_Strength.png')).astype(int)
diff=np.abs(a[:,:,:3]-b[:,:,:3]).max(axis=2);yy,xx=np.indices(diff.shape);center=json.loads((r/'V5_glow_center.json').read_text())
stats['samePipelineGlow']={'pixelsOver1':int((diff>1).sum()),'outside32pxOver1':int(((diff>1)&((xx-center['x'])**2+(yy-center['y'])**2>32**2)).sum()),'max':int(diff.max())}
assert stats['samePipelineGlow']['pixelsOver1']>0 and stats['samePipelineGlow']['outside32pxOver1']==0
assert stats['noEligibleSource_exact']
(r/'V5_pixel_metrics.json').write_text(json.dumps(stats,indent=2));print(json.dumps(stats))

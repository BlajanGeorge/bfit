import sys
from PIL import Image, ImageSequence
import numpy as np
from scipy import ndimage as ndi
# Make small regions that flicker between filled and empty consistent across the loop.
# Big flickering areas are real motion and are left alone.
src,dst=sys.argv[1],sys.argv[2]
LO=int(sys.argv[3]) if len(sys.argv)>3 else 150; HI=int(sys.argv[4]) if len(sys.argv)>4 else 3000
im=Image.open(src); dur=im.info.get('duration',125)
fr=[np.array(f.convert('RGBA').copy()) for f in ImageSequence.Iterator(im)]
n=len(fr); op=np.stack([f[:,:,3]>=128 for f in fr]); cnt=op.sum(0)
flick=(cnt>0)&(cnt<n)
lab,l=ndi.label(flick); sizes=ndi.sum(flick,lab,range(1,l+1))
sel=np.zeros_like(flick)
for j,s in enumerate(sizes,1):
    if LO<=s<=HI: sel|=(lab==j)
print('consistency-fixed area:',int(sel.sum()),'px')
stack=np.stack(fr).astype(np.float32)
alpha=stack[...,3]
fill=np.zeros(fr[0].shape,np.uint8)
ys,xs=np.where(sel)
for y,x in zip(ys,xs):
    k=np.where(alpha[:,y,x]>=128)[0]
    if len(k)==0: continue
    fill[y,x,:3]=np.median(stack[k,y,x,:3],axis=0).round(); fill[y,x,3]=255
out=[]
for i,f in enumerate(fr):
    g=f.copy(); g[sel]=fill[sel]; out.append(Image.fromarray(g,'RGBA'))
out[0].save(dst,save_all=True,append_images=out[1:],duration=dur,loop=0,lossless=True)
# verify
chk=[int((np.array(o)[:,:,3][sel]>=128).sum()) for o in out]
print('opaque px inside that area per frame:',chk[:6],'... all equal:',len(set(chk))==1)

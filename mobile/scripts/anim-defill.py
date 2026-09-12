import sys
from PIL import Image, ImageSequence
import numpy as np
from scipy import ndimage as ndi
# Remove flat grey "fill" artefacts that appear in some frames only: a pixel is erased when it sits in a
# region that flickers between opaque and transparent across the loop AND is locally featureless in that frame.
src,dst=sys.argv[1],sys.argv[2]; VAR=float(sys.argv[3]) if len(sys.argv)>3 else 4; MIN=int(sys.argv[4]) if len(sys.argv)>4 else 700
im=Image.open(src); dur=im.info.get('duration',125)
fr=[np.array(f.convert('RGBA').copy()) for f in ImageSequence.Iterator(im)]
opq=np.stack([f[:,:,3]>=128 for f in fr]); n=len(fr)
def flatmask(f):
    g=f[:,:,:3].mean(axis=2).astype(np.float32)
    v=ndi.uniform_filter(g*g,9)-ndi.uniform_filter(g,9)**2
    return (f[:,:,3]>=128)&(v<VAR)
flat=np.stack([flatmask(f) for f in fr])
cand=(flat.sum(0)>=2)&(opq.sum(0)<=n-3)&(opq.sum(0)>=2)
lab,l=ndi.label(cand); sizes=ndi.sum(cand,lab,range(1,l+1))
zone=np.zeros_like(cand)
for j,s in enumerate(sizes,1):
    if s>=MIN: zone|=(lab==j)
print('artefact zone',int(zone.sum()),'px')
out=[]; removed=0
for i,f in enumerate(fr):
    kill=zone&flat[i]
    kill=ndi.binary_opening(kill,structure=np.ones((3,3)))
    lab2,l2=ndi.label(kill); s2=ndi.sum(kill,lab2,range(1,l2+1))
    k=np.zeros_like(kill)
    for j,s in enumerate(s2,1):
        if s>=300: k|=(lab2==j)
    g=f.copy(); g[k]=[0,0,0,0]; removed+=int(k.sum())
    out.append(Image.fromarray(g,'RGBA'))
    if k.sum(): print(f'  frame {i+1}: erased {int(k.sum())} px')
print('total erased',removed)
out[0].save(dst,save_all=True,append_images=out[1:],duration=dur,loop=0,lossless=True)

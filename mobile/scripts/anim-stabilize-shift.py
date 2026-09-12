import sys
from PIL import Image, ImageSequence
import numpy as np
from scipy.signal import fftconvolve
# Translation-only alignment, integer pixels, no resampling and no compositing:
# nothing can pulse and depth/occlusion stays exactly as the generator drew it.
src,dst=sys.argv[1],sys.argv[2]; STRIP=int(sys.argv[3]) if len(sys.argv)>3 else 140
im=Image.open(src); dur=im.info.get('duration',125)
fr=[f.convert('RGBA').copy() for f in ImageSequence.Iterator(im)]
W,H=fr[0].size
A0=np.array(fr[0])[:,:,3]>=128
ys=np.where(A0.any(1))[0]; y1=ys.max(); ty0=y1-STRIP
strip=A0[ty0:y1+1]; xs=np.where(strip.any(0))[0]; tx0,tx1=xs.min(),xs.max()
T=strip[:,tx0:tx1+1].astype(np.float32); th,tw=T.shape; tn=T.sum()
print(f'template {tw}x{th} at x{tx0} y{ty0}')
out=[]
for i,f in enumerate(fr):
    G=(np.array(f)[:,:,3]>=128).astype(np.float32)
    corr=fftconvolve(G,T[::-1,::-1],mode='valid')
    gs=fftconvolve(G,np.ones_like(T),mode='valid')
    iou=corr/np.maximum(gs+tn-corr,1)
    k=int(np.argmax(iou)); oy,ox=divmod(k,iou.shape[1])
    dx,dy=tx0-ox,ty0-oy
    g=Image.new('RGBA',(W,H),(0,0,0,0)); g.paste(f,(dx,dy)); out.append(g)
    print(f'{i+1:2d} iou {iou.flat[k]:.4f} shift {dx:4d},{dy:4d}')
out[0].save(dst,save_all=True,append_images=out[1:],duration=dur,loop=0,lossless=True)

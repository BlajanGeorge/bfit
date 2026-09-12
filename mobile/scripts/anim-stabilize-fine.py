import sys
from PIL import Image, ImageSequence
import numpy as np
from scipy.signal import fftconvolve
src,dst=sys.argv[1],sys.argv[2]
STRIP=int(sys.argv[3]) if len(sys.argv)>3 else 140
SMIN,SMAX,SSTEP=(float(sys.argv[4]),float(sys.argv[5]),float(sys.argv[6])) if len(sys.argv)>6 else (0.92,1.09,0.0025)
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
    best=(-1,1.0,0,0)
    for s in np.arange(SMIN,SMAX+1e-9,SSTEP):
        g=f.resize((round(W*s),round(H*s)),Image.LANCZOS)
        G=(np.array(g)[:,:,3]>=128).astype(np.float32)
        if G.shape[0]<th or G.shape[1]<tw: continue
        corr=fftconvolve(G,T[::-1,::-1],mode='valid')
        gs=fftconvolve(G,np.ones_like(T),mode='valid')
        iou=corr/np.maximum(gs+tn-corr,1)
        k=int(np.argmax(iou)); oy,ox=divmod(k,iou.shape[1])
        if iou.flat[k]>best[0]: best=(float(iou.flat[k]),float(s),ox,oy)
    iou,s,ox,oy=best
    g=f.resize((round(W*s),round(H*s)),Image.LANCZOS)
    cv=Image.new('RGBA',(W,H),(0,0,0,0)); cv.paste(g,(tx0-ox,ty0-oy),g); out.append(cv)
    print(f'{i+1:2d} iou {iou:.4f} scale {s:.4f} paste {tx0-ox:5d},{ty0-oy:5d}')
out[0].save(dst,save_all=True,append_images=out[1:],duration=dur,loop=0,lossless=True)

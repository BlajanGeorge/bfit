import sys
from PIL import Image, ImageSequence
import numpy as np
# Scale+position normalisation by template-matching a static strip (bench/legs) from frame 1 into every frame.
src,dst=sys.argv[1],sys.argv[2]; STRIP=int(sys.argv[3]) if len(sys.argv)>3 else 130
im=Image.open(src); dur=im.info.get('duration',125)
fr=[f.convert('RGBA').copy() for f in ImageSequence.Iterator(im)]
A=np.array(fr[0])[:,:,3]>=128; ys,xs=np.where(A); y1=ys.max()
ty0=y1-STRIP; strip=A[ty0:y1+1]; tx=np.where(strip.any(0))[0]; tx0,tx1=tx.min(),tx.max()
T=strip[:,tx0:tx1+1]; th,tw=T.shape
print('template',tw,'x',th,'at',tx0,ty0)
def best_fit(f):
    bb=None
    for s in np.arange(0.80,1.35,0.02):
        g=f.resize((round(f.width*s),round(f.height*s)),Image.LANCZOS); G=np.array(g)[:,:,3]>=128
        H,W=G.shape
        if H<th or W<tw: continue
        step=4
        for oy in range(0,H-th,step):
            row=G[oy:oy+th]
            for ox in range(0,W-tw,step):
                win=row[:,ox:ox+tw]; u=(win|T).sum()
                if not u: continue
                iou=(win&T).sum()/u
                if bb is None or iou>bb[0]: bb=(iou,s,ox,oy)
    return bb
out=[]
for i,f in enumerate(fr):
    iou,s,ox,oy=best_fit(f)
    g=f.resize((round(f.width*s),round(f.height*s)),Image.LANCZOS)
    cv=Image.new('RGBA',f.size,(0,0,0,0)); cv.paste(g,(tx0-ox,ty0-oy),g); out.append(cv)
    print(f'{i+1:2d} iou {iou:.3f} scale {s:.2f} paste {tx0-ox:5d},{ty0-oy:5d}')
out[0].save(dst,save_all=True,append_images=out[1:],duration=dur,loop=0,lossless=True)

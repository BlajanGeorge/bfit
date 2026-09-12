import sys
from PIL import Image, ImageSequence, ImageFilter
import numpy as np
from scipy import ndimage as ndi
src,dst=sys.argv[1],sys.argv[2]; T=int(sys.argv[3]) if len(sys.argv)>3 else 30; R=int(sys.argv[4]) if len(sys.argv)>4 else 5; RES=int(sys.argv[5]) if len(sys.argv)>5 else 22
BIG=1000; RES_MED=43; MINA=100; ATTACH=20   # big blobs: residual>RES; medium blobs: residual>RES_MED and within ATTACH px of a big blob
im=Image.open(src); dur=im.info.get('duration',125)
fr=[np.array(f.convert('RGBA').copy()).astype(np.int16) for f in ImageSequence.Iterator(im)]
H,W=fr[0].shape[:2]; stack=np.stack(fr)
def residual(f,base,blob,sl):
    y0,y1=sl[0].start,sl[0].stop; x0,x1=sl[1].start,sl[1].stop; best=1e9
    for dy in range(-R,R+1):
        for dx in range(-R,R+1):
            ya,yb=max(0,y0+dy),min(H,y1+dy); xa,xb=max(0,x0+dx),min(W,x1+dx)
            if yb-ya!=y1-y0 or xb-xa!=x1-x0: continue
            best=min(best,float(np.abs(f[ya:yb,xa:xb]-base[y0:y1,x0:x1]).max(axis=2)[blob].mean()))
    return best
def masks(base):
    ms=[]
    for f in fr:
        raw=np.abs(f-base).max(axis=2)>T; op=ndi.binary_opening(raw,structure=np.ones((3,3)))
        lab,n=ndi.label(op); big=np.zeros_like(op); med=[]
        for j,sl in enumerate(ndi.find_objects(lab),1):
            blob=lab[sl]==j; a=int(blob.sum())
            if a<MINA: continue
            res=residual(f,base,blob,sl)
            if a>=BIG and res>RES: big[sl]|=blob
            elif a<BIG and res>RES_MED: med.append((sl,blob))
        near=ndi.binary_dilation(big,iterations=ATTACH); keep=big.copy()
        for sl,blob in med:
            if (near[sl]&blob).any(): keep[sl]|=blob
        ms.append(ndi.binary_dilation(keep,iterations=6))
    return ms
# pass 1: plain median -> motion masks; pass 2: background = median over frames where the pixel is NOT moving
base=np.median(stack,axis=0).round().astype(np.int16)
ms=masks(base); M=np.stack(ms)
masked=np.where(M[...,None],np.nan,stack.astype(np.float32))
bg=np.nanmedian(masked,axis=0); bg=np.where(np.isnan(bg),base,bg).round().astype(np.int16)
ms=masks(bg)
comp=[]
for i,(f,keep) in enumerate(zip(fr,ms)):
    m=Image.fromarray((keep*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.GaussianBlur(1.5))
    w=(np.array(m).astype(np.float32)/255)[...,None]
    comp.append((w*f+(1-w)*bg).round().clip(0,255).astype(np.int16)); print(i+1,'moving %',round(float((w[...,0]>0.5).mean()*100),1))
# temporal run smoothing: per pixel, consecutive frames (circular) whose value barely changes get their run median,
# so a part that is standing still (bar held at the top, chest under it) is pixel-identical across those frames
S=60; C=np.stack(comp); n=len(comp)
stat=np.abs(C-np.roll(C,1,axis=0)).max(axis=3)<S
run=np.zeros(C.shape[:3],np.int16)
for i in range(1,n): run[i]=np.where(stat[i],run[i-1],run[i-1]+1)
run=np.where(stat[0][None]&(run==run[n-1][None]),0,run)   # frame 0 continues the last run -> same run
res=C.astype(np.float32).copy()
for k in range(n):
    sel=(run==k)
    if not sel.any(): continue
    vals=np.where(sel[...,None],C.astype(np.float32),np.nan)
    with np.errstate(all='ignore'): med=np.nanmedian(vals,axis=0)
    res=np.where(sel[...,None],med[None],res)
print('temporal smoothing touched px:',int((np.abs(res-C).max(axis=3)>0).sum()))
out=[]
for i in range(n):
    o=res[i].round().clip(0,255).astype(np.uint8); o[0,i]=[0,0,0,1]; out.append(Image.fromarray(o,'RGBA'))
out[0].save(dst,save_all=True,append_images=out[1:],duration=dur,loop=0,lossless=True)

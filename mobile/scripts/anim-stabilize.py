import sys
from PIL import Image, ImageSequence
import numpy as np
# like stabilize.py, plus per-frame scale normalisation: figure height (head top -> feet bottom) matched to frame 1, anchored at the feet
src,dst=sys.argv[1],sys.argv[2]; drop=[int(x)-1 for x in sys.argv[3].split(',')] if len(sys.argv)>3 and sys.argv[3] else []
im=Image.open(src); dur=im.info.get('duration',125)
fr=[f.convert('RGBA').copy() for f in ImageSequence.Iterator(im)]
def metrics(f):
    a=np.array(f)[:,:,3]>=128; ys,xs=np.where(a); top,bot=ys.min(),ys.max()
    fx=np.where(a[bot-40:bot+1,:].any(0))[0]; return top,bot,(fx.min()+fx.max())/2
top0,bot0,cx0=metrics(fr[0]); h0=bot0-top0; out=[]
for i,f in enumerate(fr):
    top,bot,cx=metrics(f); s=h0/(bot-top)
    if abs(s-1)>0.004:
        W,H=f.size; g=f.resize((round(W*s),round(H*s)),Image.LANCZOS)
        canvas=Image.new('RGBA',(W,H),(0,0,0,0)); canvas.paste(g,(round(cx-cx*s),round(bot-bot*s))); f=canvas
    top,bot,cx=metrics(f); dx=round(cx0-cx); dy=round(bot0-bot)
    g=Image.new('RGBA',f.size,(0,0,0,0)); g.paste(f,(dx,dy)); out.append(g)
    print(i+1,'scale',round(s,3),'shift',dx,dy)
keep=[f for i,f in enumerate(out) if i not in drop]
d=int(round(len(fr)*dur/len(keep)))
keep[0].save(dst,save_all=True,append_images=keep[1:],duration=d,loop=0,lossless=True); print(len(keep),'frames @',d,'ms')

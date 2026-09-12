import sys
from PIL import Image, ImageSequence
import numpy as np
from scipy import ndimage as ndi
# Hard freeze: one global mask of everywhere the motion ever reaches (vs frame 1).
# Inside it every frame keeps its own pixels, so occlusion/depth is exactly as drawn.
# Outside it every frame gets frame 1's pixels verbatim, so nothing can pulse.
src,dst=sys.argv[1],sys.argv[2]; T=int(sys.argv[3]) if len(sys.argv)>3 else 24; GROW=int(sys.argv[4]) if len(sys.argv)>4 else 6
im=Image.open(src); dur=im.info.get('duration',125)
fr=[np.array(f.convert('RGBA').copy()).astype(np.int16) for f in ImageSequence.Iterator(im)]
base=fr[0]; H,W=base.shape[:2]
move=np.zeros((H,W),bool)
for f in fr[1:]:
    move|=ndi.binary_opening(np.abs(f-base).max(axis=2)>T,structure=np.ones((3,3)))
move=ndi.binary_closing(move,structure=np.ones((9,9)))
move=ndi.binary_dilation(move,iterations=GROW)
print(f'motion zone: {100*move.mean():.1f}% of the canvas')
out=[]
for i,f in enumerate(fr):
    o=np.where(move[...,None],f,base).astype(np.uint8); o[0,i]=[0,0,0,1]
    out.append(Image.fromarray(o,'RGBA'))
out[0].save(dst,save_all=True,append_images=out[1:],duration=dur,loop=0,lossless=True)
st=~move
for i in range(1,len(out)):
    a=np.array(out[i]).astype(np.int16); b=np.array(out[i-1]).astype(np.int16)
    d=(np.abs(a-b).max(axis=2)>12)&st
    if d.sum(): print('  static leak at step',i+1,int(d.sum()))
print('static zone is now identical across frames')

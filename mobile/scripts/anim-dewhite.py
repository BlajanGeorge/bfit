import sys
from PIL import Image
import numpy as np
from scipy import ndimage as ndi
# Turn a flat white studio background into transparency: drop white connected to the border,
# plus any large enclosed flat-white pocket. Keeps small white highlights on the subject.
src,dst=sys.argv[1],sys.argv[2]; MIN=int(sys.argv[3]) if len(sys.argv)>3 else 600
im=Image.open(src).convert('RGBA'); a=np.array(im); rgb=a[:,:,:3].astype(np.int16)
white=(rgb.min(axis=2)>240)&(rgb.max(axis=2)-rgb.min(axis=2)<10)
lab,n=ndi.label(white); sizes=ndi.sum(white,lab,range(1,n+1))
border=set(lab[0,:])|set(lab[-1,:])|set(lab[:,0])|set(lab[:,-1]); border.discard(0)
bg=np.isin(lab,list(border))
for j,s in enumerate(sizes,1):
    if j not in border and s>=MIN: bg|=(lab==j)
a[:,:,3]=np.where(bg,0,255).astype(np.uint8)
Image.fromarray(a,'RGBA').save(dst)
print(f'{dst}: transparent {100*bg.mean():.0f}%')

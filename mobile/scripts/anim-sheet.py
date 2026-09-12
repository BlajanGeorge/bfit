import sys
from PIL import Image, ImageSequence
import numpy as np
src,dst=sys.argv[1],sys.argv[2]
im=Image.open(src); fr=[f.convert('RGBA').copy() for f in ImageSequence.Iterator(im)]
w,h=fr[0].size; tw,th=int(w*0.5),int(h*0.5)
sheet=Image.new('RGBA',(tw*4+18,th*4+18),(20,22,30,255))
tr=[]
for i,f in enumerate(fr):
    a=np.array(f)[:,:,3]; tr.append(round((a<128).mean()*100))
    t=f.resize((tw,th)); sheet.paste(t,((i%4)*(tw+6),(i//4)*(th+6)),t)
sheet.save(dst); print(len(fr),w,h,'transparent% per frame',tr)

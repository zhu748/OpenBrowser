"""Exact RGB comparison. Deliberate brand/local-shell changes are outside the reported content clip."""
import sys,json
from PIL import Image,ImageChops
left,right,out=sys.argv[1:4]
a,b=Image.open(left).convert('RGB'),Image.open(right).convert('RGB')
if a.size!=b.size:
 print(json.dumps({'equal':False,'sizeA':a.size,'sizeB':b.size}));sys.exit(0)
diff=ImageChops.difference(a,b)
changed=sum(pixel!=(0,0,0) for pixel in diff.getdata())
if changed:
 red=Image.new('RGB',a.size,'#ff0040');mask=diff.convert('L').point(lambda value:255 if value else 0)
 Image.composite(red,Image.blend(a,b,.5),mask).save(out)
else:diff.save(out)
print(json.dumps({'equal':changed==0,'width':a.width,'height':a.height,'changedPixels':changed,'totalPixels':a.width*a.height,'bbox':diff.getbbox()}))

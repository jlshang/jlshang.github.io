exec(open('models.py').read().split("out={}; report={}")[0])
out={};report={}
# C60: truncated icosahedron, all edges short blue
ico=[]
for s1 in (1,-1):
  for s2 in (1,-1):
    for v in ([s1,0,s2*p],[0,s2*p,s1],[s2*p,s1,0]): ico.append(np.array(v,float))
E=[(i,j) for i in range(12) for j in range(i+1,12) if abs(np.linalg.norm(ico[i]-ico[j])-2)<1e-6]
print('ico edges',len(E))
sc=B1/(2/3)
m=Model()
pts={}
for i,j in E:
  a=ico[i]+(ico[j]-ico[i])/3; b=ico[i]+2*(ico[j]-ico[i])/3
  m.strut(a*sc,b*sc,'blue')
# pentagon edges
for i in range(12):
  nb=[j for a,b in E for j in ((b,) if a==i else (a,) if b==i else ())]
  for x in nb:
    for y in nb:
      if x<y and abs(np.linalg.norm(ico[x]-ico[y])-2)<1e-6:
        m.strut((ico[i]+(ico[x]-ico[i])/3)*sc,(ico[i]+(ico[y]-ico[i])/3)*sc,'blue')
report['c60']=check(m,'c60'); out['c60']=m.dump()
# bigger diamond (depth 5)
O=np.zeros(3)
T=[np.array(v)/3**.5 for v in ([1,1,1],[1,-1,-1],[-1,1,-1],[-1,-1,1])]
def diamond(depth):
  m=Model(); m.ball(O); frontier=[(O,1)]; seen={key3(O)}
  for d in range(depth):
    nf=[]
    for v,s in frontier:
      for t in T:
        w=v+s*t*Y1; m.strut(v,w,'yellow')
        if key3(w) not in seen: seen.add(key3(w)); nf.append((w,-s))
    frontier=nf
  return m
for d in (4,5):
  mm=diamond(d); report[f'dia{d}']=check(mm,'d'); out[f'dia{d}']=mm.dump()
import json
json.dump(out,open('extra.json','w'))
print(json.dumps(report,ensure_ascii=False))

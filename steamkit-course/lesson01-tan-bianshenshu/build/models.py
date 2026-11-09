import numpy as np, json, itertools
p=(1+5**.5)/2; ip=1/p
gens=[np.array([[0,0,1],[1,0,0],[0,1,0]],float),np.array([[-1,0,0],[0,-1,0],[0,0,1]],float),
      np.array([[.5,-p/2,ip/2],[p/2,ip/2,-.5],[ip/2,.5,p/2]])]
G=[np.eye(3)]
def key(m): return tuple(np.round(m,4).ravel())
seen={key(G[0])}
i=0
while i<len(G):
  for g in gens:
    m=g@G[i]
    if key(m) not in seen: seen.add(key(m)); G.append(m)
  i+=1
assert len(G)==60
def orbit(v):
  out=[]
  for m in G:
    w=m@np.array(v,float); w=w/np.linalg.norm(w)
    if not any(np.allclose(w,o,atol=1e-6) for o in out): out.append(w)
  return out
BLUE=orbit([0,0,1]); YEL=orbit([1,1,1]); RED=orbit([1,0,p])
print(len(BLUE),len(YEL),len(RED))
B1=2*p*p   # short blue, ball radius 1 units (5.236)
Y1=3**.5*p*p # short yellow (4.534)
def isdir(v,S): u=v/np.linalg.norm(v); return any(np.allclose(u,s,atol=1e-6) for s in S)
N=np.array([1,1,1])/3**.5
plane=[b for b in BLUE if abs(b@N)<1e-9]
print('blue in plane',len(plane))
# pick 3 at 120
d0=plane[0]; tri=[b for b in plane if abs(b@d0-1)<1e-9 or abs(b@d0+0.5)<1e-9]
print('tri',len(tri))
def P(v): return [round(float(x),6) for x in v]
# honeycomb generator: atom type A at lattice with bonds tri, type B uses -tri
def honey(cells):
  # cells: list of (i,j) hex centers in axial coords; hex vertex positions
  a1=(tri[0]-tri[1])*B1; a2=(tri[0]-tri[2])*B1
  return a1,a2
a1=(tri[0]-tri[1])*B1; a2=(tri[1]-tri[2])*B1
# A atoms at n*a1+m*a2 ; B atoms at A + tri[0]*B1
def hexagon_vertices(c):  # c = hex center position; vertices: center + B1 * (each of 6 plane dirs)
  return [c+B1*d for d in plane]
# center of hexagon containing origin A atom: origin - tri[k]*B1 ... hex center = A - B1*tri? Actually A atom's neighbours at +tri; hex center at -tri[k]
def key3(v): return tuple(np.round(v,4))
class Model:
  def __init__(s): s.balls=[]; s.struts=[]; s.idx={}
  def ball(s,v):
    k=key3(v)
    if k not in s.idx: s.idx[k]=len(s.balls); s.balls.append(np.array(v,float))
    return s.idx[k]
  def strut(s,a,b,kind):
    ia,ib=s.ball(a),s.ball(b)
    e=tuple(sorted((ia,ib)))
    if e not in [tuple(sorted(x[:2])) for x in s.struts]: s.struts.append((ia,ib,kind))
  def copy(s):
    m=Model(); m.balls=[x.copy() for x in s.balls]; m.struts=list(s.struts); m.idx=dict(s.idx); return m
  def dump(s):
    return {'b':[P(v) for v in s.balls],'s':[[a,b,k] for a,b,k in s.struts]}
def check(m,name):
  holes={}
  for a,b,k in m.struts:
    v=m.balls[b]-m.balls[a]; L=np.linalg.norm(v)
    S={'blue':BLUE,'yellow':YEL,'red':RED}[k]
    assert isdir(v,S),(name,k)
    for ball,d in ((a,v/L),(b,-v/L)):
      for o in holes.setdefault(ball,[]): assert not np.allclose(o,d,atol=1e-6),('hole clash',name)
      holes[ball].append(d)
  # ball overlap
  for i,j in itertools.combinations(range(len(m.balls)),2):
    assert np.linalg.norm(m.balls[i]-m.balls[j])>2.5,(name,'overlap')
  from collections import Counter
  c=Counter((k,round(float(np.linalg.norm(m.balls[b]-m.balls[a])),3)) for a,b,k in m.struts)
  return {'balls':len(m.balls),'struts':dict((f'{k}:{l}',n) for (k,l),n in c.items())}
out={}; report={}
O=np.zeros(3)
# --- p8 hand3
m=Model(); m.ball(O)
for d in tri: m.strut(O,d*B1,'blue')
out['hand3']=m.dump(); report['hand3']=check(m,'hand3')
# central hexagon containing O and neighbours tri[0],tri[1]: ring O, t0, t0 - t2?.. build by walking
# A atoms bond with +tri, B atoms bond with -tri. ring: O(A)->O+t0 (B)-> +(-t1) (A) -> +t2 (B) -> +(-t0)(A) -> +t1 (B) -> +(-t2) back to O
t0,t1,t2=[d*B1 for d in tri]
ring=[O,t0,t0-t1,t0-t1+t2,-t1+t2,t2]   # O, n1=t0, a, b, d, n2=t2 ; check closure: t2 + (-t2)=O ok
# verify ring edges
for i in range(6):
  v=ring[(i+1)%6]-ring[i]; assert abs(np.linalg.norm(v)-B1)<1e-6
stages=[]
m=Model(); m.ball(O)
for d in (t0,t1,t2): m.strut(O,d,'blue')
stages.append(m.copy())
for i in (1,2,3):
  m.strut(ring[i],ring[i+1],'blue'); stages.append(m.copy())
m.strut(ring[4],ring[5],'blue'); stages.append(m.copy())
out['ring']=[s.dump() for s in stages]; report['ring']=[check(s,'ring') for s in stages]
hexc=sum(ring)/6
# --- hexagon alone & pentagon for p10
m=Model()
for i in range(6): m.strut(ring[i]-hexc,ring[(i+1)%6]-hexc,'blue')
out['hex']=m.dump(); report['hex']=check(m,'hex'); out['hexNormal']=P(N)
R0=np.array(RED[0]); pplane=[b for b in BLUE if abs(b@R0)<1e-9]
e0=pplane[0]
# rotation by 72 about R0 within group
rot=[g for g in G if np.allclose(g@R0,R0) and abs((g@e0)@e0-np.cos(2*np.pi/5))<1e-6][0]
pts=[O]; e=e0*B1
for i in range(4): pts.append(pts[-1]+e); e=rot@e
assert abs(np.linalg.norm(pts[-1]+e-O))<1e-6
pc=sum(pts)/5
m=Model()
for i in range(5): m.strut(pts[i]-pc,pts[(i+1)%5]-pc,'blue')
out['pent']=m.dump(); report['pent']=check(m,'pent'); out['pentNormal']=P(R0)
# --- coronene growth (p11): central hex = ring, outer hexes centered at hexc + 2*(hexc - edge midpoint)...
# hex centers neighbours: hexc + (ring[i]+ring[i+1]-2hexc)  (center reflected across edge)
def hexverts(c): return [c+(r-hexc) for r in ring]
outer=[]
for i in range(6):
  mid=(ring[i]+ring[(i+1)%6])/2; outer.append(hexc+2*(mid-hexc))
# order outer starting with hex containing edge O - t1 (n3 = t1 is O's third neighbour)
def contains(c,v): return any(np.allclose(x,v) for x in hexverts(c))
start=[k for k,c in enumerate(outer) if contains(c,O) and contains(c,t1)][0]
order=[(start+k)%6 for k in range(6)]
# choose direction so that next shares edge
net=[]
m=stages[-1].copy(); net.append(m.copy())
for k in order:
  vs=hexverts(outer[k])
  for i in range(6): m.strut(vs[i],vs[(i+1)%6],'blue')
  net.append(m.copy())
sel=[net[0],net[1],net[2],net[3],net[6]]
out['net']=[s.dump() for s in sel]; report['net']=[check(s,'net') for s in sel]
full=net[6]
# --- two layers: layer2 = layer1 + Y1*N ; supports at 4 balls
lift=N*Y1
two=full.copy(); nb=len(full.balls)
for a,b,k in full.struts: two.strut(full.balls[a]+lift,full.balls[b]+lift,'blue')
# supports: 4 well spread balls
cen=sum(full.balls)/nb
far=sorted(range(nb),key=lambda i:-np.linalg.norm(full.balls[i]-cen))
sup=[]
for i in far:
  if all(np.linalg.norm(full.balls[i]-full.balls[j])>12 for j in sup): sup.append(i)
  if len(sup)==3: break
sup.append(min(range(nb),key=lambda i:np.linalg.norm(full.balls[i]-cen)))
layers=two.copy()
for i in sup: two.strut(full.balls[i],full.balls[i]+lift,'yellow')
out['layers']={'layer':full.dump(),'lift':P(lift),'supports':sup}
report['layers']=check(two,'layers')
# --- diamond: A atoms bond along +T, B along -T, T = tetra yellow dirs incl +N
T=[np.array(v)/3**.5 for v in ([1,1,1],[1,-1,-1],[-1,1,-1],[-1,-1,1])]
for t in T: assert isdir(t,YEL)
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
# unit stages for p16: center, + down strut (the 'up' hand flipped to point down = -?):
unit=[]
m=Model(); m.ball(O); unit.append(m.copy())
order_t=[T[0]]+T[1:]
for t in order_t: m.strut(O,t*Y1,'yellow'); unit.append(m.copy())
out['unit']=[s.dump() for s in unit]; report['unit']=[check(s,'unit') for s in unit]
dn=[diamond(1),diamond(2),diamond(3)]
out['diamond']=[s.dump() for s in dn]; report['diamond']=[check(s,'dia') for s in dn]
# chair ring through O in diamond(3)
D=dn[2]; adj={i:set() for i in range(len(D.balls))}
for a,b,k in D.struts: adj[a].add(b); adj[b].add(a)
def find6():
  o=D.idx[key3(O)]
  for path in itertools.permutations(adj[o],2):
    pass
  # dfs
  res=[]
  def dfs(pth):
    if len(pth)==6:
      if o in adj[pth[-1]]: res.append(list(pth))
      return
    for n in adj[pth[-1]]:
      if n not in pth: dfs(pth+[n])
      if res: return
  dfs([o]); return res[0]
chair=find6(); out['chair']=chair
# out of plane deviation of chair
pts6=np.array([D.balls[i] for i in chair]); c=pts6.mean(0); u,s,vt=np.linalg.svd(pts6-c); print('chair pucker',np.abs((pts6-c)@vt[2]).round(3))
json.dump(out,open('/home/claude/build/carbon-models.json','w'))
json.dump(report,open('/home/claude/build/model-report.json','w'),ensure_ascii=False,indent=1)
print(json.dumps(report,ensure_ascii=False)[:2500])

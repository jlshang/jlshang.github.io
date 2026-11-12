# 金刚石“三角锥”块：来自用户 vZome 文件 E21.vZome 的最终造型（30 球、40 黄短棍），
# 按 (1,1,-1) 方向分层，从上往下一层层长（5 步）。坐标单位：整数格点 × φ²（黄短棍 = (±1,±1,±1)·φ²）。
import json, itertools, numpy as np
p=(1+5**.5)/2; K=p*p
PTS=[(-6,-4,-2),(-6,-2,0),(-6,0,2),(-6,2,4),(-5,-3,-1),(-5,-1,1),(-5,1,3),(-4,-4,0),(-4,-2,-2),(-4,-2,2),(-4,0,0),(-4,0,4),(-4,2,2),(-3,-3,1),(-3,-1,-1),(-3,-1,3),(-3,1,1),(-2,-4,2),(-2,-2,0),(-2,-2,4),(-2,0,-2),(-2,0,2),(-2,2,0),(-1,-3,3),(-1,-1,1),(-1,1,-1),(0,-4,4),(0,-2,2),(0,0,0),(0,2,-2)]
UP=(1,1,-1)
lev=lambda q:sum(a*b for a,b in zip(q,UP))
# 从上到下排序（同一层内按方位角排，动画更整齐）
PTS.sort(key=lambda q:(-lev(q),q))
E=[(i,j) for i,j in itertools.combinations(range(len(PTS)),2) if all(abs(PTS[i][k]-PTS[j][k])==1 for k in range(3))]
assert len(PTS)==30 and len(E)==40
# 每个球最多 4 根，且只沿四面体方向
deg=[0]*30
for i,j in E: deg[i]+=1; deg[j]+=1
assert max(deg)<=4
levels=sorted({lev(q) for q in PTS},reverse=True); print('levels',levels,[sum(lev(q)==L for q in PTS) for L in levels])
cut=[0,-3,-4,-7,-8]   # 每一步长到的最低一层
steps=[]
for c in cut:
  keep=[i for i,q in enumerate(PTS) if lev(q)>=c]; m={i:n for n,i in enumerate(keep)}
  steps.append({'b':[[round(float(x*K),6) for x in PTS[i]] for i in keep],'s':[[m[i],m[j],'yellow'] for i,j in E if i in m and j in m]})
  print('step',len(steps),len(keep),'balls',len(steps[-1]['s']),'struts')
# 椅子形六元环：离整体中心最近的一圈
adj={i:set() for i in range(30)}
for i,j in E: adj[i].add(j); adj[j].add(i)
rings=set()
def dfs(path):
  if len(path)==6:
    if path[0] in adj[path[-1]]: rings.add(tuple(path))
    return
  for n in adj[path[-1]]:
    if n not in path and n>path[0]: dfs(path+[n])
for i in range(30): dfs([i])
cen=np.mean(PTS,0)
best=min(rings,key=lambda r:(np.linalg.norm(np.mean([PTS[i] for i in r],0)-cen),r))
print('rings',len(rings)//2,'chair',best,[lev(PTS[i]) for i in best])
out={'dtet':steps,'dchair':list(best),'dtetUp':[round(x/3**.5,6) for x in UP]}
open('carbon-tetra.js','w').write('Object.assign(window.CARBON,'+json.dumps(out,separators=(',',':'))+');\n')
# 课后挑战：再往下长两层（竖棍一层 + 斜棍一层）
big=set(PTS)
def grow(pts):
  low=min(lev(q) for q in pts); bottom=[q for q in pts if lev(q)==low]; add=set()
  for q in bottom:
    v=tuple(q[k]-UP[k] for k in range(3)); add.add(v)   # 竖着往下（level -3）
  new=set()
  for q in add:
    for d in itertools.product((1,-1),repeat=3):
      w=tuple(q[k]+d[k] for k in range(3))
      if lev(w)==lev(q)-1 and all(abs(w[k]-q[k])==1 for k in range(3)): new.add(w)
  return pts|add|new
big=grow(big); BP=sorted(big,key=lambda q:(-lev(q),q))
BE=[(i,j) for i,j in itertools.combinations(range(len(BP)),2) if all(abs(BP[i][k]-BP[j][k])==1 for k in range(3))]
# 只保留沿四面体方向且奇偶正确的键（相邻格点必然满足）
print('big',len(BP),len(BE))
out['dia4']={'b':[[round(float(x*K),6) for x in q] for q in BP],'s':[[i,j,'yellow'] for i,j in BE]}
open('carbon-tetra.js','w').write('Object.assign(window.CARBON,'+json.dumps(out,separators=(',',':'))+');\n')

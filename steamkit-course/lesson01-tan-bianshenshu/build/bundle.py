import re,base64,os,sys,subprocess
D=sys.argv[1];OUT=sys.argv[2]
rd=lambda p:open(os.path.join(D,p),encoding='utf-8').read()
MIME={'webp':'image/webp','png':'image/png','jpg':'image/jpeg','mp3':'audio/mpeg','ttf':'font/ttf','woff2':'font/woff2'}
def uri(p):
  b=open(os.path.join(D,p),'rb').read();return f"data:{MIME[p.rsplit('.',1)[1]]};base64,"+base64.b64encode(b).decode()
html=rd('index.html');css=rd('lesson.css');js=rd('lesson.js')
# font subset to used characters
text=re.sub(r'<[^>]+>','',html)+js
chars=''.join(sorted(set(text)))+'0123456789：，。？！'
font='fonts/ZCOOLKuaiLe-Regular.ttf'
try:
  open('/tmp/chars.txt','w').write(chars)
  subprocess.run(['pyftsubset',os.path.join(D,font),'--text-file=/tmp/chars.txt','--flavor=woff2','--output-file=/tmp/sub.woff2'],check=True)
  fdata="data:font/woff2;base64,"+base64.b64encode(open('/tmp/sub.woff2','rb').read()).decode();ffmt='woff2'
except Exception as e:
  print('subset failed',e);fdata=uri(font);ffmt='truetype'
css=css.replace("url('fonts/ZCOOLKuaiLe-Regular.ttf') format('truetype')",f"url({fdata}) format('{ffmt}')")
# sound map
sfx={k:uri(f'a/sfx/{k}.mp3') for k in ['page','select','correct','wrong','fly','tick']}
js=js.replace('new Audio("a/sfx/"+k+".mp3")','new Audio(window.__SFX[k])')
sfxjs='window.__SFX='+repr(sfx).replace("'",'"')+';'
def inline_assets(t):
  return re.sub(r'a/[A-Za-z0-9_\-]+\.(?:webp|png|jpg)',lambda m:uri(m.group(0)),t)
html=inline_assets(html);css=inline_assets(css);js=inline_assets(js)
scripts=[]
for m in re.finditer(r'<script src="([^"?]+)(?:\?[^"]*)?"></script>',html):
  p=m.group(1);src=rd(p)
  if p=='lesson.js': src=js
  else: src=inline_assets(src)
  scripts.append((m.group(0),src.replace('</script','<\\/script')))
for tag,src in scripts: html=html.replace(tag,'<script>'+src+'</script>',1)
html=re.sub(r'<link rel="stylesheet" href="lesson.css[^"]*">','<style>'+css+'</style>',html)
html=html.replace('<script>','<script>'+sfxjs+'</script><script>',1)
assert 'src="a/' not in html and "'a/" not in html.replace("'a/'","")
open(OUT,'w',encoding='utf-8').write(html);print(OUT,round(os.path.getsize(OUT)/1e6,2),'MB')

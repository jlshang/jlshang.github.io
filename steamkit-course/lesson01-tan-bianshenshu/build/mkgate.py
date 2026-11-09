import sys
PW=sys.argv[1]
def cyrb53(s,seed=0):
  h1=(0xdeadbeef^seed)&0xffffffff;h2=(0x41c6ce57^seed)&0xffffffff
  M=lambda a,b:(a*b)&0xffffffff
  for ch in s.encode('utf-16-le')[::2] if False else [ord(c) for c in s]:
    h1=M(h1^ch,2654435761);h2=M(h2^ch,1597334677)
  h1=M(h1^(h1>>16),2246822507)^M(h2^(h2>>13),3266489909)
  h2=M(h2^(h2>>16),2246822507)^M(h1^(h1>>13),3266489909)
  return 4294967296*(2097151&h2)+(h1>>0)
print(cyrb53(PW))

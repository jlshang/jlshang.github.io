/* Game registry: add a new game here and it appears on the Home screen. Text is {en, zh}. */
window.GAMES=[
 {cat:{en:'Focus',zh:'专注力'},key:'focus',items:[
  {id:'number-grid',icon:'grid',name:{en:'Number Grid',zh:'数字方格'},desc:{en:'Tap the numbers in order',zh:'按顺序点数字'},path:'games/focus/number-grid/index.html'},
  {id:'color-match',icon:'colors',name:{en:'Color Match',zh:'看颜色'},desc:{en:'Pick the ink color, not the word',zh:'选字的颜色，不看字的意思'},path:'games/focus/color-match/index.html'}]},
 {cat:{en:'Memory',zh:'记忆力'},key:'memory',items:[
  {id:'card-match',icon:'memory',name:{en:'Card Match',zh:'翻牌配对'},desc:{en:'Find the matching pairs',zh:'找出一样的两张牌'},path:'games/memory/card-match/index.html'},
  {id:'shopping-list',icon:'cart',name:{en:'Shopping List',zh:'购物清单'},desc:{en:'Remember what to buy',zh:'记住要买什么'},path:'games/memory/shopping-list/index.html'}]},
 {cat:{en:'Math',zh:'计算力'},key:'math',items:[
  {id:'make-change',icon:'cash',name:{en:'Make Change',zh:'买东西找零'},desc:{en:'How much change do you get?',zh:'应该找回多少钱？'},path:'games/math/make-change/index.html'},
  {id:'tip-calculator',icon:'receipt',name:{en:'Tip Time',zh:'打折算账'},desc:{en:'Work out the tip',zh:'算算打折后多少钱'},path:'games/math/tip-calculator/index.html'}]},
 {cat:{en:'Words',zh:'语言'},key:'words',items:[
  {id:'word-scramble',icon:'scroll',name:{en:'Word Scramble',zh:'成语排序'},desc:{en:'Unscramble the letters',zh:'把打乱的字排成成语'},path:'games/words/word-scramble/index.html'}]},
 {cat:{en:'Observation',zh:'观察力'},key:'observation',items:[
  {id:'odd-one-out',icon:'observation',name:{en:'Odd One Out',zh:'找不同'},desc:{en:'Spot the one that is different',zh:'找出不一样的那个'},path:'games/observation/odd-one-out/index.html'}]},
 {cat:{en:'Logic',zh:'逻辑力'},key:'logic',items:[
  {id:'number-patterns',icon:'sequence',name:{en:'Number Patterns',zh:'数字规律'},desc:{en:'What number comes next?',zh:'下一个数是几？'},path:'games/logic/number-patterns/index.html'}]}
];

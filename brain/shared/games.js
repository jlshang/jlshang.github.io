/* Game registry: add a new game here and it appears on the Home screen. Text is {en, zh}. */
window.GAMES=[
 {cat:{en:'Focus',zh:'专注力'},key:'focus',items:[
  {id:'number-grid',icon:'grid',name:{en:'Number Grid',zh:'数字方格'},desc:{en:'Tap the numbers in order',zh:'按顺序点数字'},path:'games/focus/number-grid/index.html'},
  {id:'color-match',icon:'colors',name:{en:'Color Match',zh:'看颜色'},desc:{en:'Pick the ink color, not the word',zh:'选字的颜色，不看字的意思'},path:'games/focus/color-match/index.html'},
  {id:'follow-arrow',icon:'arrows',name:{en:'Follow the Arrow',zh:'跟着箭头走'},desc:{en:'Tap the way the arrow points',zh:'按箭头方向点按钮'},path:'games/focus/follow-arrow/index.html'},
  {id:'find-target',icon:'eyeTarget',name:{en:'Find Them All',zh:'全部找出来'},desc:{en:'Find every matching shape',zh:'找出所有一样的图形'},path:'games/focus/find-target/index.html'},
  {id:'go-no-go',icon:'traffic',name:{en:'Green Means Go',zh:'绿灯行，红灯停'},desc:{en:'Tap on green, wait on red',zh:'绿灯点，红灯等'},path:'games/focus/go-no-go/index.html'}]},
 {cat:{en:'Memory',zh:'记忆力'},key:'memory',items:[
  {id:'card-match',icon:'memory',name:{en:'Card Match',zh:'翻牌配对'},desc:{en:'Find the matching pairs',zh:'找出一样的两张牌'},path:'games/memory/card-match/index.html'},
  {id:'shopping-list',icon:'cart',name:{en:'Shopping List',zh:'购物清单'},desc:{en:'Remember what to buy',zh:'记住要买什么'},path:'games/memory/shopping-list/index.html'},
  {id:'sequence-recall',icon:'pads',name:{en:'Light Sequence',zh:'记住亮灯顺序'},desc:{en:'Repeat the lights in order',zh:'按亮灯顺序点一遍'},path:'games/memory/sequence-recall/index.html'},
  {id:'where-was-it',icon:'pin',name:{en:'Where Was It?',zh:'东西放在哪'},desc:{en:'Remember where things are',zh:'记住东西的位置'},path:'games/memory/where-was-it/index.html'},
  {id:'what-changed',icon:'question',name:{en:'What Is Missing?',zh:'少了什么'},desc:{en:'Spot the picture that is gone',zh:'找出少掉的那一样'},path:'games/memory/what-changed/index.html'}]},
 {cat:{en:'Math',zh:'计算力'},key:'math',items:[
  {id:'quick-sums',icon:'plus',name:{en:'Easy Sums',zh:'口算练习'},desc:{en:'Simple sums in your head',zh:'简单的心算题'},path:'games/math/quick-sums/index.html'},
  {id:'make-change',icon:'cash',name:{en:'Make Change',zh:'买东西找零'},desc:{en:'How much change do you get?',zh:'应该找回多少钱？'},path:'games/math/make-change/index.html'},
  {id:'coin-count',icon:'coins',name:{en:'Count the Money',zh:'数一数钱'},desc:{en:'Add up coins and bills',zh:'把硬币和纸币加起来'},path:'games/math/coin-count/index.html'},
  {id:'tip-calculator',icon:'receipt',name:{en:'Tip Time',zh:'打折算账'},desc:{en:'Work out the tip',zh:'算算打折后多少钱'},path:'games/math/tip-calculator/index.html'},
  {id:'compare-prices',icon:'compare',name:{en:'Better Deal',zh:'哪个更划算'},desc:{en:'Pick the cheaper shop',zh:'比比哪家更便宜'},path:'games/math/compare-prices/index.html'}]},
 {cat:{en:'Words',zh:'语言'},key:'words',items:[
  {id:'word-scramble',icon:'scroll',name:{en:'Word Scramble',zh:'词语排序'},desc:{en:'Unscramble the letters',zh:'把打乱的字排成词语'},path:'games/words/word-scramble/index.html'},
  {id:'missing-letter',icon:'book',name:{en:'Fill the Gap',zh:'补全成语'},desc:{en:'Find the missing letter',zh:'补上缺的那个字'},path:'games/words/missing-letter/index.html'},
  {id:'word-category',icon:'tagWords',name:{en:'Word Groups',zh:'词语归类'},desc:{en:'Which word fits the group?',zh:'哪个词属于这一类？'},path:'games/words/word-category/index.html'},
  {id:'opposites',icon:'swap',name:{en:'Opposites',zh:'反义词'},desc:{en:'Find the opposite word',zh:'找出意思相反的词'},path:'games/words/opposites/index.html'},
  {id:'sayings',icon:'quote',name:{en:'Finish the Saying',zh:'俗语接龙'},desc:{en:'Complete a well-known saying',zh:'补全熟悉的俗语'},path:'games/words/sayings/index.html'}]},
 {cat:{en:'Observation',zh:'观察力'},key:'observation',items:[
  {id:'odd-one-out',icon:'observation',name:{en:'Odd One Out',zh:'找不同'},desc:{en:'Spot the one that is different',zh:'找出不一样的那个'},path:'games/observation/odd-one-out/index.html'},
  {id:'spot-difference',icon:'twin',name:{en:'Spot the Change',zh:'对比找变化'},desc:{en:'Compare two pictures',zh:'对比两张图找变化'},path:'games/observation/spot-difference/index.html'},
  {id:'shadow-match',icon:'shadow',name:{en:'Match the Shadow',zh:'影子配对'},desc:{en:'Which shadow fits the picture?',zh:'哪个影子和图片一样？'},path:'games/observation/shadow-match/index.html'},
  {id:'same-pair',icon:'layers',name:{en:'Find the Twins',zh:'找双胞胎'},desc:{en:'Find the two that are the same',zh:'找出一模一样的两个'},path:'games/observation/same-pair/index.html'},
  {id:'count-items',icon:'dots',name:{en:'How Many?',zh:'数一数'},desc:{en:'Count one kind of picture',zh:'数出某一种东西的数量'},path:'games/observation/count-items/index.html'}]},
 {cat:{en:'Logic',zh:'逻辑力'},key:'logic',items:[
  {id:'number-patterns',icon:'sequence',name:{en:'Number Patterns',zh:'数字规律'},desc:{en:'What number comes next?',zh:'下一个数是几？'},path:'games/logic/number-patterns/index.html'},
  {id:'shape-patterns',icon:'shapesSeq',name:{en:'Shape Patterns',zh:'图形规律'},desc:{en:'What shape comes next?',zh:'下一个是什么图形？'},path:'games/logic/shape-patterns/index.html'},
  {id:'missing-tile',icon:'slide',name:{en:'Missing Tile',zh:'补上缺的格子'},desc:{en:'Complete the 3×3 grid',zh:'补全九宫格'},path:'games/logic/missing-tile/index.html'},
  {id:'balance-scale',icon:'scale',name:{en:'Balance Scale',zh:'天平称重'},desc:{en:'How many make it balance?',zh:'几个才能一样重？'},path:'games/logic/balance-scale/index.html'},
  {id:'sliding-puzzle',icon:'grid',name:{en:'Sliding Puzzle',zh:'数字华容道'},desc:{en:'Slide numbers into order',zh:'把数字滑回顺序'},path:'games/logic/sliding-puzzle/index.html'}]}
];

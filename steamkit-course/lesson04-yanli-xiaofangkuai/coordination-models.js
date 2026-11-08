import {MODELS} from './kit-model-data.js';

// Reuse the verified seven-ball, six-BLUE / twelve-GREEN teaching octahedron.
// Only the ion identity (black Na / white Cl) is exchanged on the right.
// GREEN edges outline the neighbour octahedron; they are not chemical bonds.
const source=MODELS['octa-3'];
export const COORDINATION_MODELS={
 'coordination-na':{...source,object:'coordination-na'},
 'coordination-cl':{...source,object:'coordination-cl',
  ballColors:source.ballColors.map(color=>color==='black'?'white':'black')}
};
export function coordinationStage(side,step){
 const left=side==='na',id=left?'coordination-na':'coordination-cl';
 const model=COORDINATION_MODELS[id];
 const neighbors=left?step>=1:step>=2;
 const outline=left?step>=1:step>=2;
 return {id,height:17,
  balls:neighbors?model.balls.map((_,i)=>i):[0],
  struts:neighbors?model.struts.flatMap((e,i)=>outline||e.color==='BLUE'?[i]:[]):[],
  highlight:(left?step<2:step>=2)?[0]:[]};
}

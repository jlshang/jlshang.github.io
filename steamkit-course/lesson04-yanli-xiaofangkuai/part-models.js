import {MODELS} from './kit-model-data.js';
const src=MODELS['octa-3'];
function rod(color){const e=src.struts.find(e=>e.color===color);return {version:1,object:'material-'+color,balls:[src.balls[e.a],src.balls[e.b]],ballColors:[src.ballColors[e.a],src.ballColors[e.b]],struts:[{...e,a:0,b:1}],scope:'Single standard part display; endpoint balls hidden in material tray.'};}
export const PART_MODELS={
 'material-blue':rod('BLUE'),'material-green':rod('GREEN'),
 'material-black':{balls:[[0,0,0]],ballColors:['black'],struts:[]},
 'material-white':{balls:[[0,0,0]],ballColors:['white'],struts:[]}
};

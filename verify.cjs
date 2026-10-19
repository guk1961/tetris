const fs=require('fs'), vm=require('vm'), assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/tetris.html','utf8');
assert(!html.includes('\\"'));assert(!html.includes('\\n'));
const js=html.match(/<script>([\s\S]*?)<\/script>/)[1];
new vm.Script(js);
const core=js.slice(js.indexOf('const SHAPES='),js.indexOf('const root='));
const box={};vm.createContext(box);vm.runInContext(core+';globalThis.Engine=Tetris;globalThis.shapes=SHAPES;',box);
const {Engine,shapes}=box;
const setPiece=(g,type,x,y)=>{g.active={type,m:shapes[type].map(r=>r.slice()),x,y};g.over=false;};
let g=new Engine();assert.equal(g.board.length,20);assert.equal(g.board[0].length,10);
g.bag=[];assert.equal(new Set(Array.from({length:7},()=>g.drawType())).size,7);
setPiece(g,'O',0,0);assert.equal(g.move(-1,0),false);assert.equal(g.move(1,0),true);
assert.equal(g.ghostY(),18);g.drop();assert.equal(g.score,36);assert.equal(g.board[19][1],'O');
g=new Engine();g.board[19]=Array(10).fill('J');g.board[18]=Array(10).fill('J');
g.board[19][4]=g.board[19][5]=g.board[18][4]=g.board[18][5]=null;
setPiece(g,'O',4,18);assert.equal(g.lock(),2);assert.equal(g.lines,2);assert.equal(g.score,300);assert(g.board.every(r=>r.every(v=>!v)));
g=new Engine();for(let y=16;y<20;y++){g.board[y]=Array(10).fill('J');g.board[y][4]=null;}
setPiece(g,'I',2,16);g.active.m=[[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]];
assert.equal(g.lock(),4);assert.equal(g.score,800);assert.equal(g.lines,4);
g=new Engine();g.lines=9;g.board[19]=Array(10).fill('J');g.board[19][4]=g.board[19][5]=null;setPiece(g,'O',4,18);assert.equal(g.lock(),1);assert.equal(g.level,2);assert(g.interval<800);
g=new Engine();setPiece(g,'T',0,18);assert.equal(g.rotate(),true);assert(g.fits(g.active.m,g.active.x,g.active.y));
g=new Engine();g.board[0]=Array(10).fill('Z');g.next='O';g.spawn();assert(g.over);assert.equal(g.move(1,0),false);
for(let trial=0;trial<30;trial++){g=new Engine();for(let turn=0;turn<150&&!g.over;turn++){for(let j=0;j<Math.floor(Math.random()*4);j++)g.rotate();for(let j=0;j<Math.floor(Math.random()*9);j++)g.move(Math.random()<.5?-1:1,0);assert(g.fits(g.active.m,g.active.x,g.active.y));g.drop();assert.equal(g.board.length,20);assert(g.board.every(r=>r.length===10));assert(Number.isFinite(g.score));}}
// Execute the full UI with minimal DOM objects, including focus and host state.
const listeners={},elements=new Map();let snapshot,rafId=0;const frames=new Map();
class Element {constructor(selector){this.selector=selector;this.children=[];this.handlers={};this.dataset={};this.disabled=false;this.parentElement=this;}setAttribute(k,v){this[k]=v;}appendChild(v){this.children.push(v);}replaceChildren(){this.children=[];}addEventListener(k,fn){this.handlers[k]=fn;}focus(){doc.activeElement=this;}}
const get=s=>{if(!elements.has(s))elements.set(s,new Element(s));return elements.get(s);};
const buttons=['left','rotate','right','down','drop'].map(a=>{const e=get('[data-action="'+a+'"]');e.dataset.action=a;return e;});
const root={querySelector:s=>{assert(html.includes(s.slice(1,-1)),'Missing element '+s);return get(s);},querySelectorAll:()=>buttons,contains:e=>[...elements.values()].includes(e)};
const doc={activeElement:null,hidden:false,getElementById:()=>root,createElementNS:()=>new Element(),addEventListener:(k,f)=>listeners[k]=f};
const win={openai:{widgetState:null,setWidgetState:s=>{snapshot=JSON.parse(JSON.stringify(s));return Promise.resolve();}},addEventListener:(k,f)=>listeners[k]=f};
const context={document:doc,window:win,requestAnimationFrame:f=>{frames.set(++rafId,f);return rafId;},cancelAnimationFrame:id=>frames.delete(id)};
vm.runInNewContext(js,context);assert.equal(get('[data-score]').textContent,'0');
get('[data-play]').handlers.click();assert.equal(snapshot.modelContent.status,'playing');assert.equal(frames.size,1);
listeners['openai:set_globals']({detail:{globals:{widgetState:snapshot}}});assert.equal(get('[data-status]').textContent,'В игре');assert.equal(frames.size,1);
listeners.keydown({key:' ',code:'Space',preventDefault(){}});assert(snapshot.modelContent.score>0);
get('[data-pause]').handlers.click();assert.equal(snapshot.modelContent.status,'paused');assert.equal(frames.size,0);
get('[data-pause]').handlers.click();assert.equal(snapshot.modelContent.status,'playing');assert.equal(frames.size,1);
get('[data-restart]').handlers.click();assert.equal(snapshot.modelContent.score,0);assert.equal(frames.size,1);
doc.hidden=true;listeners.visibilitychange();assert.equal(snapshot.modelContent.status,'paused');assert.equal(frames.size,0);
listeners['openai:set_globals']({detail:{globals:{widgetState:snapshot}}});assert.equal(get('[data-pause]').textContent,'Продолжить');
console.log('PASS: rules, seven-piece bag, collisions, ghost, drops, 1/2/4-line clears, scoring, levels, wall/floor rotation, game over, 30 random games, UI start/pause/restart, keyboard, state restoration.');

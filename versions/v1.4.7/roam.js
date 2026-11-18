/* Les Chroniques des Mers V1.0 — Fuchsia illustré, exploration isométrique, dessin original canvas. */
(() => {
'use strict';
const TAU = Math.PI * 2, TILE = 66, MW = 72, MH = 52;
const THEMES = {
  albe:    {sea:'#268aa9', deep:'#155e82',foam:'#b8e7d9',sand:'#eed6a0',sand2:'#dcb976',grass:'#7fbf70',grass2:'#60a86c',path:'#d9ba83',tree:'#32866b',leaf:'#67b77b',sky:'Côte verdoyante'},
  epaves:  {sea:'#277e9c', deep:'#15556e',foam:'#d5ebd8',sand:'#edd2a0',sand2:'#d1aa71',grass:'#78ad68',grass2:'#5b8f5d',path:'#d5b781',tree:'#3b8066',leaf:'#7fb882',sky:'Crique oubliée'},
  corail:  {sea:'#38aeb7', deep:'#167b90',foam:'#f4e7c6',sand:'#f6d6b7',sand2:'#e4ae9d',grass:'#8ecf91',grass2:'#62ad83',path:'#ecd0a0',tree:'#27948b',leaf:'#80d8ad',sky:'Lagon turquoise'},
  brume:   {sea:'#567c91', deep:'#34536b',foam:'#cddcdb',sand:'#c9c0a2',sand2:'#a99f8b',grass:'#8b9b83',grass2:'#6e887c',path:'#b8ae94',tree:'#467b7a',leaf:'#87aaa0',sky:'Brume ancienne'},
  forge:   {sea:'#457888', deep:'#254c61',foam:'#e6cfb1',sand:'#d6b390',sand2:'#b58c72',grass:'#92a080',grass2:'#6e856a',path:'#b3a08c',tree:'#687967',leaf:'#aaa885',sky:'Archipel ardent'},
  tempete: {sea:'#3d7292', deep:'#1d4c71',foam:'#cfd5db',sand:'#c5c2ab',sand2:'#a3a58d',grass:'#8ca79a',grass2:'#688c85',path:'#a5b1a1',tree:'#406e73',leaf:'#8ba8a3',sky:'Cap des vents'}
};
let session = null;
// Conservation de la caméra lors des interactions qui reconstruisent l’interface.
let lastView = null;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const dist=(a,b,c,d)=>Math.hypot(a-c,b-d);
const noise=(x,y,s=1)=>{
  let n = ((Math.imul((x|0)+13,374761393) ^ Math.imul((y|0)+31,668265263) ^ Math.imul(s+7919,1442695041)) >>> 0);
  n = Math.imul(n^(n>>>13),1274126177); return ((n^(n>>>16))>>>0)/4294967296;
};
const roundRect=(c,x,y,w,h,r,fill,stroke=null,lw=1)=>{c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.lineWidth=lw;c.strokeStyle=stroke;c.stroke();}};
const ellipse=(c,x,y,rx,ry,fill,stroke=null,lw=1)=>{c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.lineWidth=lw;c.strokeStyle=stroke;c.stroke();}};
const path=(c,coords,fill,stroke='#253c43',lw=2)=>{c.beginPath();coords.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.lineJoin='round';c.stroke();}};
// L'île principale s'étend désormais à l'est et au sud du vieux port.
// Les anciennes positions de sauvegarde autour du village restent valides.
function isLand(x,y){
  if(x<2||y<2||x>=MW-2||y>=MH-2)return false;
  const wobble=Math.sin((x+2)*.49)*.044+Math.cos(y*.6)*.035+Math.sin((x+y)*.37)*.026;
  const harbor=((x-22.6)/21.5)**2+((y-16)/15.8)**2 < 1+wobble;
  const east=((x-46.8)/22.2)**2+((y-28)/19.4)**2 < 1+wobble;
  const south=((x-34.3)/17.5)**2+((y-38)/11.6)**2 < 1+wobble;
  return harbor||east||south;
}
function zoneAt(x,y){
  if(x>=50 && y<24) return {id:'falaises',name:'Falaises du Levant'};
  if(x>=48 && y>=34) return {id:'ruines',name:'Ruines de Veillebrume'};
  if(x>=37 && y>=24) return {id:'bois',name:'Bois des Lucioles'};
  if(y>=31) return {id:'lagon',name:'Lagon des Perles'};
  if(x>=34) return {id:'dunes',name:'Dunes de l’Est'};
  return {id:'port',name:'Quais de Fuchsia'};
}
function tileKind(x,y){
  if(!isLand(x,y))return 0;
  const edge=[[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>!isLand(x+a,y+b));
  if(edge||!isLand(x+2,y)||!isLand(x-2,y)||!isLand(x,y+2)||!isLand(x,y-2))return 1;
  // Les cinq pistes principales relient tous les points d'intérêt de la grande île.
  // Stone plaza in the heart of the harbor, connected to the old pathways.
  const plaza=((x-22.8)/6.8)**2+((y-19.4)/4.4)**2<1;
  if(plaza) return 7;
  const harborRoad=Math.abs(x-22)<1.4&&y>10&&y<30||Math.abs(y-19)<1.4&&x>10&&x<36;
  const eastRoad=Math.abs(y-(19+(x-22)*.17))<1.15&&x>22&&x<60;
  const northernRoad=Math.abs(y-(23-(x-43)*.32))<1.0&&x>43&&x<60;
  const forestRoad=Math.abs(y-(23+(x-43)*.70))<1.0&&x>43&&x<63;
  const lagoonRoad=Math.abs(x-(22+(y-27)*.77))<1.05&&y>25&&y<47;
  const ruinsRoad=Math.abs(y-(37+(x-51)*.24))<1.05&&x>44&&x<64;
  if(harborRoad||eastRoad||northernRoad||forestRoad||lagoonRoad||ruinsRoad)return 2;
  if(x>49&&y>34)return 4; // vieilles pierres et pavés
  if(x>34&&y<23)return 5; // dunes et hautes herbes
  if(x>35&&y>=35&&x<48)return 6; // clairière aux fleurs
  return 3;
}
function propsFor(island){
  const seed=island.charCodeAt(0)*83,objects=[];
  // Exclusions autour du port, des bâtiments, des PNJ, des principaux axes et des lieux de découverte.
  const clearings=[[22,20,7],[22,27,4],[14,13,2.4],[33,16,2.8],[34,21,2.5],[39,23,3.8],
    [45,27,3],[54,38,4.2],[58,16,3.5],[34,40,3.5],[31,24,2.3],[52,28,1.6]];
  for(let y=4;y<MH-3;y++)for(let x=3;x<MW-3;x++){
    const kind=tileKind(x,y);if(![3,4,5,6].includes(kind))continue;
    if(clearings.some(([cx,cy,r])=>dist(x,y,cx,cy)<r))continue;
    const n=noise(x,y,seed),u=noise(x+313,y-172,seed);
    if(kind===3&&n>.915)objects.push({id:`tree-${x}-${y}`,type:zoneAt(x,y).id==='bois'?'oak':'palm',x:x+.5,y:y+.5,r:.49,solid:true});
    else if(kind===3&&n<.027)objects.push({id:`rock-${x}-${y}`,type:'rock',x:x+.5,y:y+.5,r:.43,solid:true});
    else if(kind===3&&n>.86&&n<.90)objects.push({id:`bush-${x}-${y}`,type:'bush',x:x+.5,y:y+.5,r:.28,solid:false});
    if(kind===5&&n>.96)objects.push({id:`cactus-${x}-${y}`,type:'cactus',x:x+.5,y:y+.5,r:.28,solid:true});
    if(kind===4&&n>.93)objects.push({id:`column-${x}-${y}`,type:'column',x:x+.5,y:y+.5,r:.35,solid:true});
    if(kind===6&&u>.79)objects.push({id:`flowers-${x}-${y}`,type:'flowers',x:x+.5,y:y+.5,r:0,solid:false});
  }
  return objects;
}
function makeWorld(id){
  const theme=THEMES[id]||THEMES.albe;
  const objects=propsFor(id);
  const fixed=[
    {id:'maison',type:'house',x:18.1,y:16.4,r:1.15,solid:true,label:'Maison de pêcheur'},
    {id:'taverne',type:'tavern',x:26.2,y:17.5,r:1.12,solid:true,label:'La Taverne des Embruns'},
    {id:'statue',type:'statue',x:13.1,y:18.8,r:.60,solid:true,label:'Vieille stèle'},
    {id:'capitaine',type:'npc',x:22.8,y:18.5,r:.33,solid:true,label:'Mira, capitaine',color:'#ecb457'},
    {id:'marchand',type:'npc',x:27.8,y:20.5,r:.33,solid:true,label:'Nilo, marchand',color:'#55b0ac'},
    {id:'guerisseuse',type:'npc',x:17.4,y:20.6,r:.33,solid:true,label:'Sora, soigneuse',color:'#d887a5'},
    {id:'dock',type:'dock',x:22.6,y:27.1,r:.62,solid:false,label:'Embarcadère'},
    {id:'barque',type:'boat',x:24.3,y:31.2,r:1.0,solid:false},
    {id:'chest-west',type:'chest',x:14.6,y:12.8,r:.43,solid:true,label:'Coffre oublié'},
    {id:'chest-east',type:'chest',x:33.1,y:16.1,r:.43,solid:true,label:'Coffre mystérieux'},
    {id:'foe-1',type:'enemy',x:29.3,y:12.9,r:.42,solid:true,label:'Bandit de plage'},
    {id:'foe-2',type:'enemy',x:13.5,y:22.4,r:.42,solid:true,label:'Pilleur solitaire'},
    {id:'foe-3',type:'enemy',x:34.0,y:21.1,r:.42,solid:true,label:'Rôdeur des mers'},
    {id:'house-east',type:'house',x:34.4,y:18.7,r:1.05,solid:true,label:'Maison des navigateurs'},
    // Set dressing - original props. Most props are decorative, so imported saves/pathfinding stay valid.
    {id:'sea-galleon',type:'galleon',x:23.9,y:33.2,r:1.2,solid:false,label:'Le Vent d’Ambre'},
    {id:'harbor-warehouse',type:'warehouse',x:19.5,y:26.0,r:.98,solid:true,label:'Entrepôt du vieux port'},
    {id:'harbor-market-red',type:'stall',x:27.2,y:14.0,r:.5,solid:false},
    {id:'harbor-market-blue',type:'stall',x:18.2,y:22.7,r:.5,solid:false},
    {id:'harbor-market-green',type:'stall',x:30.4,y:20.7,r:.5,solid:false},
    {id:'harbor-fountain',type:'fountain',x:21.7,y:15.2,r:.5,solid:false,label:'Fontaine des navigateurs'},
    {id:'harbor-signpost',type:'signpost',x:24.5,y:23.3,r:.15,solid:false},
    {id:'harbor-baskets',type:'barrels',x:24.1,y:26.2,r:.1,solid:false},
    {id:'harbor-fish',type:'fishstand',x:21.5,y:25.0,r:.1,solid:false},
    {id:'harbor-flag-one',type:'banner',x:16.4,y:18.9,r:.1,solid:false},
    {id:'harbor-flag-two',type:'banner',x:27.0,y:22.3,r:.1,solid:false},
    {id:'harbor-lamp-one',type:'lamppost',x:20.0,y:19.2,r:.1,solid:false},
    {id:'harbor-lamp-two',type:'lamppost',x:25.0,y:20.1,r:.1,solid:false},
    {id:'harbor-flowerbed-one',type:'flowerbed',x:18.4,y:19.9,r:.1,solid:false},
    {id:'harbor-flowerbed-two',type:'flowerbed',x:29.2,y:17.7,r:.1,solid:false},
    {id:'outpost',type:'tavern',x:41.2,y:25.0,r:1.05,solid:true,label:'Avant-poste du Levant'},
    {id:'windmill',type:'windmill',x:48.2,y:18.3,r:1.0,solid:true,label:'Moulin des vents'},
    {id:'lighthouse',type:'lighthouse',x:60.4,y:16.0,r:1.0,solid:true,label:'Phare du Levant'},
    {id:'sanctuary',type:'shrine',x:54.6,y:39.0,r:1.0,solid:true,label:'Sanctuaire effondré'},
    {id:'lagoon-spring',type:'spring',x:34.7,y:42.6,r:.75,solid:false,label:'Source des Perles'},
    {id:'guide',type:'npc',x:31.5,y:22.3,r:.3,solid:true,label:'Iris, éclaireuse',color:'#e3a05f'},
    {id:'herboriste',type:'npc',x:44.0,y:29.8,r:.3,solid:true,label:'Lys, herboriste',color:'#8dc49a'},
    {id:'vigie',type:'npc',x:57.1,y:17.9,r:.3,solid:true,label:'Eden, vigie',color:'#afbbef'},
    {id:'archiviste',type:'npc',x:57.2,y:37.4,r:.3,solid:true,label:'Oren, archiviste',color:'#e2bb86'},
    {id:'pecheur',type:'npc',x:34.6,y:39.6,r:.3,solid:true,label:'Tao, pêcheur',color:'#78c4da'},
    {id:'vista-east',type:'landmark',x:59.0,y:18.8,r:.35,solid:false,label:'Belvédère du Levant',description:'De ce promontoire, la mer s’étend jusqu’aux étoiles. Un ancien journal indique des routes oubliées.'},
    {id:'ruins-tablet',type:'landmark',x:56.0,y:41.1,r:.35,solid:false,label:'Tablette des ruines',description:'Des symboles marins sont gravés dans cette tablette. Ils décrivent une civilisation disparue.'},
    {id:'pearl-basin',type:'landmark',x:36.0,y:43.7,r:.35,solid:false,label:'Bassin des perles',description:'Au fond des eaux calmes, des perles bleutées brillent comme de petites lunes.'},
    {id:'chest-cliff',type:'chest',x:65.0,y:23.0,r:.42,solid:true,label:'Trésor des falaises',coins:65,potions:2},
    {id:'chest-ruins',type:'chest',x:61.0,y:41.4,r:.42,solid:true,label:'Coffre des anciens',coins:85,potions:2},
    {id:'chest-forest',type:'chest',x:46.0,y:33.2,r:.42,solid:true,label:'Cache des lucioles',coins:32,potions:3},
    {id:'chest-lagoon',type:'chest',x:30.0,y:45.0,r:.42,solid:true,label:'Trésor du lagon',coins:55,potions:1},
    {id:'foe-4',type:'enemy',x:43.0,y:21.2,r:.42,solid:true,label:'Crabe des dunes',enemyKey:'crab'},
    {id:'foe-5',type:'enemy',x:50.3,y:30.3,r:.42,solid:true,label:'Pilleur des bois',enemyKey:'raider'},
    {id:'foe-6',type:'enemy',x:63.0,y:31.4,r:.42,solid:true,label:'Rôdeur des hauteurs',enemyKey:'mousse'},
    {id:'foe-7',type:'enemy',x:52.7,y:44.5,r:.42,solid:true,label:'Gardien des ruines',enemyKey:'crab'},
  ];
  if(id==='brume')fixed.push({id:'guardian',type:'boss',x:34,y:10.4,r:.66,solid:true,label:'Gardien du Phare'});
  const all=id==='albe'?fixed:fixed.filter(o=>!o.id.match(/^(harbor-|sea-galleon|house-east|outpost|windmill|lighthouse|sanctuary|lagoon-spring|guide|herboriste|vigie|archiviste|pecheur|vista-east|ruins-tablet|pearl-basin|chest-cliff|chest-ruins|chest-forest|chest-lagoon|foe-[4-7]|barque)$/));
  return {id,theme,objects:[...objects,...all],seed:id.split('').reduce((v,c)=>v+c.charCodeAt(0),0)};
}
function entityAvailable(s,o){
  const id=`${s.world.id}:${o.id}`;
  if(o.type==='chest')return !s.game.sceneLoot?.[id];
  if(o.type==='enemy'||o.type==='boss'){const done=s.game.sceneDefeated?.[id];return !done||(typeof done==='number'&&Date.now()-done>120000);}
  return true;
}
function nearObject(s,range=2.12){
  return s.world.objects.filter(o=>['npc','chest','enemy','boss','dock','statue','landmark'].includes(o.type) && entityAvailable(s,o))
    .map(o=>({o,d:dist(s.x,s.y,o.x,o.y)})).filter(o=>o.d<range).sort((a,b)=>a.d-b.d)[0]?.o||null;
}
function scenePosition(game){
  const p=game.scenePositions?.[game.island];
  return p&&Number.isFinite(p.x)&&Number.isFinite(p.y)?{x:clamp(p.x,2,MW-3),y:clamp(p.y,3,MH-3)}:{x:22.3,y:20.4};
}
function canWalk(s,x,y){
  if(x<1||y<1||x>MW-2||y>MH-2)return false;
  const rr=.22;
  for(const [dx,dy] of [[-rr,-rr],[rr,-rr],[-rr,rr],[rr,rr]]){
    if(!isLand(Math.floor(x+dx),Math.floor(y+dy)))return false;
  }
  return !s.world.objects.some(o=>o.solid && entityAvailable(s,o) && dist(x,y,o.x,o.y)<o.r+.34);
}
function savePosition(s){
  if(!s.game.scenePositions)s.game.scenePositions={};
  s.game.scenePositions[s.world.id]={x:Math.round(s.x*100)/100,y:Math.round(s.y*100)/100};
  s.hooks.persist();
}
function move(s,vx,vy,dt){
  if(!vx&&!vy)return;
  const mag=Math.hypot(vx,vy)||1,speed=3.15;
  vx=vx/mag*speed*dt;vy=vy/mag*speed*dt;
  if(canWalk(s,s.x+vx,s.y))s.x+=vx;
  if(canWalk(s,s.x,s.y+vy))s.y+=vy;
  s.direction=Math.abs(vx)>Math.abs(vy)?(vx>0?'right':'left'):(vy>0?'down':'up');
  s.walking=true;
}
function drawGround(c,s,view){
  const theme=s.world.theme, time=s.clock;
  const stX=Math.max(0,Math.floor(view.x/TILE)-1),endX=Math.min(MW,Math.ceil((view.x+view.w)/TILE)+1);
  const stY=Math.max(0,Math.floor(view.y/TILE)-1),endY=Math.min(MH,Math.ceil((view.y+view.h)/TILE)+1);
  c.fillStyle=theme.deep;c.fillRect(view.x,view.y,view.w,view.h);
  for(let y=stY;y<endY;y++)for(let x=stX;x<endX;x++){
    const px=x*TILE,py=y*TILE,k=tileKind(x,y),n=noise(x,y,s.world.seed);
    if(k===0){
      c.fillStyle=n>.53?theme.sea:theme.deep;c.fillRect(px,py,TILE+1,TILE+1);
      c.globalAlpha=.23;
      c.strokeStyle=theme.foam;c.lineWidth=2.3;c.beginPath();
      const shift=Math.sin(time*1.1+x*2+y)*8;
      c.moveTo(px+10+shift,py+22);c.quadraticCurveTo(px+26+shift,py+17,px+38+shift,py+23);c.stroke();c.globalAlpha=1;
      if(n>.86){ellipse(c,px+51,py+43,2,1.5,'#ffffff82');}
    }else{
      const sand=k===1||k===2;
      c.fillStyle=sand?((n>.45)?theme.sand:theme.sand2):((n>.48)?theme.grass:theme.grass2);
      c.fillRect(px,py,TILE+1,TILE+1);
      if(k===1){
        c.strokeStyle=theme.foam;c.globalAlpha=.85;c.lineWidth=2.3;
        if(!isLand(x-1,y)){c.beginPath();c.moveTo(px+2,py);c.lineTo(px+2,py+TILE);c.stroke();}
        if(!isLand(x+1,y)){c.beginPath();c.moveTo(px+TILE-2,py);c.lineTo(px+TILE-2,py+TILE);c.stroke();}
        if(!isLand(x,y-1)){c.beginPath();c.moveTo(px,py+2);c.lineTo(px+TILE,py+2);c.stroke();}
        if(!isLand(x,y+1)){c.beginPath();c.moveTo(px,py+TILE-2);c.lineTo(px+TILE,py+TILE-2);c.stroke();}
        c.globalAlpha=1;
      }
      c.globalAlpha=.21;c.fillStyle=sand?'#fff4d2':'#d4e6a0';
      ellipse(c,px+12+n*15,py+12+(n*24),14,5,c.fillStyle);c.globalAlpha=1;
      const detail=noise(x+21,y-7,s.world.seed);
      if(!sand){
        c.strokeStyle=detail>.5?'#e0e2aa99':'#397e5988';c.lineWidth=1.4;
        for(let j=0;j<3;j++){
          const xx=px+8+noise(x*3+j,y,s.world.seed)*50,yy=py+8+noise(x,y*3+j,s.world.seed)*47;
          c.beginPath();c.moveTo(xx,yy+5);c.quadraticCurveTo(xx-4,yy-1,xx-1,yy-5);c.moveTo(xx,yy+5);c.quadraticCurveTo(xx+4,yy,xx+2,yy-4);c.stroke();
        }
        if(n>.88){ellipse(c,px+36,py+27,2.8,2.7,'#ffefb0');ellipse(c,px+40,py+22,2.3,2.3,'#fff6dc');}
      }else{
        c.fillStyle='#7c675050';
        ellipse(c,px+18+n*22,py+15,1.6,1.6,c.fillStyle);
        ellipse(c,px+52-n*20,py+43,1.7,1.4,c.fillStyle);
      }
    }
  }
}
function drawPalm(c,o,t){
  const x=o.x*TILE,y=o.y*TILE;
  ellipse(c,x+10,y+10,30,14,'#164d4070');
  c.strokeStyle='#594b36';c.lineWidth=13;c.lineCap='round';c.beginPath();c.moveTo(x,y+5);c.quadraticCurveTo(x+7,y-22,x+3,y-43);c.stroke();
  c.strokeStyle='#c0a079';c.lineWidth=7;c.beginPath();c.moveTo(x-2,y+5);c.quadraticCurveTo(x+2,y-19,x,y-42);c.stroke();
  const leaves=6;
  for(let i=0;i<leaves;i++){
    const a=TAU*i/leaves+Math.sin(t*.8)*.02;
    const sx=x+2,sy=y-44,ex=sx+Math.cos(a)*42,ey=sy+Math.sin(a)*24;
    c.beginPath();c.moveTo(sx,sy);c.quadraticCurveTo(ex+Math.sin(a)*13,ey-14,ex,ey);c.quadraticCurveTo(sx+Math.cos(a)*24,sy+Math.sin(a)*16,sx,sy);
    c.fillStyle=i%2?'#32896c':'#4eab78';c.fill();c.strokeStyle='#225e59';c.lineWidth=1.7;c.stroke();
    c.strokeStyle='#9bd39488';c.lineWidth=1;c.beginPath();c.moveTo(sx,sy);c.lineTo(ex,ey);c.stroke();
  }
  ellipse(c,x+1,y-44,6.5,6.5,'#9c743d','#4f5c49',1.5);
}
function drawRock(c,o){
  const x=o.x*TILE,y=o.y*TILE;
  ellipse(c,x+3,y+11,24,9,'#243d3b50');
  path(c,[[x-24,y+4],[x-15,y-16],[x+8,y-23],[x+22,y-5],[x+15,y+7],[x-7,y+11]],'#839d96','#425e65',2.6);
  path(c,[[x-15,y-16],[x+8,y-23],[x-3,y-5],[x-18,y+2]],'#c7c8b0',null);
}
function drawBush(c,o){
  const x=o.x*TILE,y=o.y*TILE;
  ellipse(c,x,y+6,26,11,'#24493970');
  ellipse(c,x-10,y-3,16,13,'#388869','#2a615e',2);
  ellipse(c,x+7,y-7,18,16,'#54a57a','#28675e',2);
  ellipse(c,x+13,y,11,9,'#77bd7d',null);
}
function drawOak(c,o,t){
  const x=o.x*TILE,y=o.y*TILE;
  ellipse(c,x+10,y+12,34,12,'#1c42415d');
  path(c,[[x-10,y+6],[x-5,y-45],[x+11,y-61],[x+14,y+6]],'#8c6546','#405454',3);
  for(const [dx,dy,r,col] of [[-26,-70,26,'#2f846b'],[8,-89,29,'#3f9974'],[33,-68,24,'#4aa584'],[-5,-57,24,'#62ad81']]){
    ellipse(c,x+dx+Math.sin(t*.4+o.y)*1.6,y+dy,r,r*.73,col,'#29665c',2);
  }
  ellipse(c,x-5,y-95,9,5,'#aedcaf60');
}
function drawCactus(c,o){
  const x=o.x*TILE,y=o.y*TILE;
  ellipse(c,x,y+10,18,6,'#264d4370');
  c.strokeStyle='#285c50';c.lineWidth=13;c.lineCap='round';c.beginPath();c.moveTo(x,y+7);c.lineTo(x,y-33);c.moveTo(x,y-13);c.lineTo(x-15,y-18);c.lineTo(x-15,y-28);c.moveTo(x,y-18);c.lineTo(x+14,y-17);c.lineTo(x+14,y-29);c.stroke();
  c.strokeStyle='#7ac399';c.lineWidth=6;c.beginPath();c.moveTo(x+3,y+5);c.lineTo(x+3,y-31);c.stroke();
}
function drawColumn(c,o){
  const x=o.x*TILE,y=o.y*TILE;
  ellipse(c,x+5,y+11,25,9,'#3249567a');
  roundRect(c,x-15,y-25,30,39,2,'#a7aba3','#55626b',2);
  roundRect(c,x-21,y-28,42,8,3,'#d2cbb9','#637078',2);
  roundRect(c,x-19,y+8,38,10,2,'#9ea8a6','#4e616d',2);
  c.strokeStyle='#5e6c6c';c.lineWidth=2;c.beginPath();c.moveTo(x-5,y-16);c.lineTo(x+3,y+1);c.lineTo(x-2,y+8);c.stroke();
}
function drawFlowers(c,o,t){
  const x=o.x*TILE,y=o.y*TILE;
  for(let i=0;i<7;i++){
    const dx=Math.sin(i*2.1+o.x)*22,dy=Math.cos(i*4.9+o.y)*9;
    c.strokeStyle='#387e67';c.lineWidth=1.7;c.beginPath();c.moveTo(x+dx,y+dy+6);c.lineTo(x+dx,y+dy-4);c.stroke();
    ellipse(c,x+dx,y+dy-4,3,3,i%2?'#ffb8d6':'#fff0b4');
    ellipse(c,x+dx,y+dy-4,1.3,1.3,'#fff7c5');
  }
}
function drawBoat(c,o,t){
  const x=o.x*TILE,y=o.y*TILE;
  ellipse(c,x,y+12,57,18,'#1b557373');
  path(c,[[x-48,y],[x-25,y+22],[x+28,y+22],[x+49,y]],'#9b6b49','#493b3e',3);
  path(c,[[x-40,y],[x-21,y+13],[x+24,y+13],[x+40,y]],'#c79664','#725447',2);
  c.strokeStyle='#604937';c.lineWidth=5;c.beginPath();c.moveTo(x+2,y);c.lineTo(x+2,y-80);c.stroke();
  path(c,[[x+5,y-75],[x+5,y-21],[x+44,y-18]],'#ead7aa','#966e58',2);
  path(c,[[x-2,y-61],[x-36,y-14],[x-2,y-16]],'#e5ae8d','#9a654f',2);
  c.strokeStyle='#d9be83';c.lineWidth=2;c.beginPath();c.moveTo(x+2,y-80);c.lineTo(x+44,y-14);c.stroke();
}
function drawWindmill(c,o,t){
  const x=o.x*TILE,y=o.y*TILE;
  ellipse(c,x,y+12,65,21,'#30474a70');
  path(c,[[x-29,y+7],[x-20,y-97],[x+25,y-97],[x+34,y+7]],'#ead3aa','#485560',3);
  path(c,[[x-34,y-92],[x,y-129],[x+39,y-92]],'#a65b51','#4b4b58',3);
  roundRect(c,x-11,y-27,22,35,4,'#7a574c','#42525c',2);
  const cx=x+3,cy=y-92;
  c.save();c.translate(cx,cy);c.rotate(t*.5);
  for(let k=0;k<4;k++){
    c.rotate(Math.PI/2);
    path(c,[[-8,-5],[-15,-62],[12,-62],[9,-8]],'#f6ebd5','#6d7676',2);
    c.strokeStyle='#b7a48f';c.lineWidth=2;c.beginPath();c.moveTo(-11,-45);c.lineTo(10,-45);c.moveTo(-9,-30);c.lineTo(9,-30);c.stroke();
  }
  c.restore();ellipse(c,cx,cy,8,8,'#d6ac6b','#5c6060',2);
}
function drawLighthouse(c,o,t){
  const x=o.x*TILE,y=o.y*TILE;
  ellipse(c,x,y+18,63,24,'#234c586e');
  path(c,[[x-26,y+14],[x-18,y-105],[x+20,y-105],[x+29,y+14]],'#f4e1bd','#536374',3);
  for(let j=0;j<3;j++)roundRect(c,x-23+j,y-2-j*38,44-j*2,13,2,'#c97c69','#745766',1);
  roundRect(c,x-29,y-118,58,19,4,'#427e96','#405361',3);
  path(c,[[x-36,y-117],[x,y-145],[x+37,y-117]],'#a95b57','#415463',3);
  const a=.7+.3*Math.sin(t*3);
  ellipse(c,x,y-114,14,12,`rgba(255,222,128,${a})`,'#6c6564',2);
  c.fillStyle='#fff3bc77';c.beginPath();c.moveTo(x,y-115);c.lineTo(x+86,y-166);c.lineTo(x+90,y-100);c.closePath();c.fill();
}
function drawShrine(c,o){
  const x=o.x*TILE,y=o.y*TILE;
  ellipse(c,x,y+13,83,20,'#263f5077');
  for(let j=-1;j<=1;j++)drawColumn(c,{x:o.x+j*.54,y:o.y+.08});
  path(c,[[x-62,y-33],[x-12,y-84],[x+63,y-31]],'#a8a7b1','#505e6a',4);
  c.strokeStyle='#e9d59d';c.lineWidth=5;c.beginPath();c.moveTo(x-19,y-24);c.arc(x,y-24,19,Math.PI,0);c.stroke();
  ellipse(c,x,y-24,7,9,'#a7e1cd','#477a79',2);
}
function drawSpring(c,o,t){
  const x=o.x*TILE,y=o.y*TILE;
  ellipse(c,x,y+5,53,22,'#487e87','#d9ccab',5);
  ellipse(c,x,y+3,39,15,'#80d5c9','#5eabb5',3);
  for(let k=0;k<4;k++)ellipse(c,x+Math.sin(k*2+t*.8)*28,y+Math.cos(k*3+t*.4)*10,2.8,2.8,'#fff6d1');
}
function drawLandmark(c,o,t){
  const p=project(o.x,o.y),pulse=.65+.30*Math.sin(t*2.5);
  ellipse(c,p.x,p.y,13+2*pulse,7+2*pulse,`rgba(249,222,138,${pulse*.40})`,'#e9cf94',2);
  c.font='bold 25px system-ui';c.textAlign='center';c.fillStyle='#fff2b7';c.fillText('✦',p.x,p.y-11-3*Math.sin(t*2));
}
function drawBuilding(c,o,t){
  const x=o.x*TILE,y=o.y*TILE,tavern=o.type==='tavern';
  c.save();
  // dark contact shadow and stone foundation
  ellipse(c,x+8,y+19,86,29,'#132a3570');
  roundRect(c,x-62,y-46,126,68,6,'#cfb48e','#3f4750',4);
  roundRect(c,x-59,y-43,120,60,4,'#f6e2b9','#996f56',2);
  // Stucco stripes, timber framing and a row of rough foundation stones.
  c.strokeStyle='#9a704b';c.lineWidth=4;
  for(const dx of [-51,-19,18,51]){c.beginPath();c.moveTo(x+dx,y-45);c.lineTo(x+dx,y+14);c.stroke();}
  c.strokeStyle='#fbf0d2';c.lineWidth=1.5;
  for(let i=0;i<7;i++){const bx=x-55+i*17;roundRect(c,bx,y+13,15,6,2,i%2?'#aaa29a':'#b9b5a5','#6e746e',.8);}
  for(const dx of [-36,35]){
    roundRect(c,x+dx-12,y-32,25,30,3,'#734c43','#614a40',2);
    roundRect(c,x+dx-8,y-28,17,20,2,'#f6bf66','#6f5141',1);
    c.fillStyle='#ffeeb0a0';c.fillRect(x+dx-6,y-25,13,11);
    c.strokeStyle='#8e5942';c.lineWidth=3;c.beginPath();c.moveTo(x+dx,y-29);c.lineTo(x+dx,y-8);c.moveTo(x+dx-9,y-19);c.lineTo(x+dx+9,y-19);c.stroke();
    // Wooden flower boxes below the windows
    roundRect(c,x+dx-14,y-8,30,9,3,'#866044','#4d4441',1.5);
    for(let j=0;j<4;j++){ellipse(c,x+dx-10+j*7,y-13-(j%2)*2,4.5,5.5,j%2?'#57a45d':'#32794e');ellipse(c,x+dx-9+j*7,y-16-(j%2)*2,2,2,j%2?'#eaa2ac':'#f4dd85');}
  }
  // Central carved entrance
  roundRect(c,x-15,y-27,30,49,8,'#443d40','#ad8459',3);
  roundRect(c,x-10,y-21,21,40,7,'#996341','#3b3540',2.5);
  ellipse(c,x+7,y+2,2.8,2.8,'#efcb86');
  // Isometric roof: weathered ceramic tiles, layered fascia, wooden rafters.
  const roof=tavern?'#9c4b4e':'#286c91',roofLight=tavern?'#d78073':'#4e9fbd';
  path(c,[[x-77,y-43],[x-50,y-97],[x+46,y-97],[x+77,y-43],[x+54,y-35],[x-55,y-35]],roof,'#263c4e',5);
  path(c,[[x-66,y-50],[x-44,y-91],[x+40,y-91],[x+64,y-50]],roofLight,null);
  // Roof rows and tile joints give an identifiable manga-isometric silhouette
  c.save();c.beginPath();c.moveTo(x-66,y-50);c.lineTo(x-44,y-91);c.lineTo(x+40,y-91);c.lineTo(x+64,y-50);c.closePath();c.clip();
  c.strokeStyle=tavern?'#803f47a8':'#235675ae';c.lineWidth=2.5;
  for(let j=0;j<5;j++){const yy=y-87+j*9;c.beginPath();c.moveTo(x-78,yy);c.lineTo(x+78,yy);c.stroke();}
  for(let i=-7;i<8;i++)for(let j=0;j<5;j++){const xx=x+i*16+(j%2)*8,yy=y-88+j*9;c.beginPath();c.moveTo(xx,yy);c.lineTo(xx-3,yy+7);c.stroke();}
  c.restore();
  path(c,[[x-78,y-43],[x-53,y-37],[x+54,y-37],[x+77,y-43],[x+72,y-32],[x-72,y-32]],'#684b3f','#4c3d42',2.7);
  // Chimney and roof dormer
  roundRect(c,x+29,y-115,15,25,2,'#9c8c7e','#584c50',2);
  roundRect(c,x+27,y-116,19,6,2,'#b38c77','#594d50',1);
  path(c,[[x-17,y-69],[x-9,y-85],[x+5,y-85],[x+13,y-69]],'#d2aa77','#533c40',2);
  roundRect(c,x-9,y-70,14,12,2,'#fbcf7e','#4d4b4f',2);
  // Hanging lamp and sparse ivy help each house feel inhabited
  c.strokeStyle='#70503b';c.lineWidth=2;c.beginPath();c.moveTo(x-56,y-46);c.lineTo(x-56,y-19);c.stroke();
  ellipse(c,x-56,y-12,6,9,'#ffce70','#866a50',2);
  c.fillStyle='#fff2b644';c.beginPath();c.arc(x-56,y-12,14,0,TAU);c.fill();
  ellipse(c,x+52,y-32,8,5,'#387759');ellipse(c,x+57,y-27,9,7,'#397e57');
  if(tavern){
    roundRect(c,x-48,y-103,96,16,3,'#382f39','#d2ae6c',2);
    c.fillStyle='#fff0c8';c.font='bold 11px Georgia,serif';c.textAlign='center';c.fillText('LA TAVERNE',x,y-92);
  }
  c.restore();
}
// V1.0 original hand-drawn isometric harbor set: angled timber buildings and living port details.
function isoPoly(c,pts,fill,stroke='#503f3b',width=2){path(c,pts,fill,stroke,width);}
function harborWindow(c,x,y,side='left'){
  const dx=side==='left'?-1:1;
  isoPoly(c,[[x-12*dx,y-9],[x+9*dx,y-19],[x+9*dx,y+3],[x-12*dx,y+13]],'#6a514b','#3f3b3a',2);
  isoPoly(c,[[x-9*dx,y-7],[x+6*dx,y-14],[x+6*dx,y+1],[x-9*dx,y+8]],'#ffd48c','#815942',1.2);
  c.strokeStyle='#a65f45';c.lineWidth=2;c.beginPath();c.moveTo(x,y-11);c.lineTo(x,y+8);c.moveTo(x-9*dx,y+1);c.lineTo(x+6*dx,y-7);c.stroke();
  c.fillStyle='#fff4b34d';ellipse(c,x,y-4,12,10,c.fillStyle);
}
function drawIsometricHouse(c,o,t){
  const x=o.x*TILE,y=o.y*TILE,tavern=o.type==='tavern',warehouse=o.type==='warehouse';
  const wallLeft=warehouse?'#b59b7d':tavern?'#dfc5a6':'#f0dbb7';
  const wallRight=warehouse?'#9e866e':tavern?'#ad9278':'#bea586';
  const blue=!tavern&&!warehouse;
  const tileColor=warehouse?'#806f73':blue?'#26638b':'#a44950';
  const tileLight=warehouse?'#ad9b8e':blue?'#4a9abb':'#d47f6e';
  const roofEdge=blue?'#244962':tavern?'#71464b':'#56515c';
  c.save();
  ellipse(c,x+8,y+18,110,33,'#0a263459');
  // Stone plinth, jointed, raised above the ground.
  isoPoly(c,[[x,y-7],[x+90,y-56],[x+90,y-17],[x,y+32],[x-90,y-17],[x-90,y-56]],'#8d8b7d','#40515b',2);
  for(let i=0;i<6;i++){const sx=x-84+i*28;roundRect(c,sx,y-1-i%2*2,24,6,1,'#b9ad94','#7b776e',.8);}
  // Two visible walls with believable lighting and timber ribs.
  isoPoly(c,[[x-88,y-107],[x,y-62],[x,y+24],[x-88,y-22]],wallLeft,'#675444',2.5);
  isoPoly(c,[[x,y-62],[x+88,y-107],[x+88,y-22],[x,y+24]],wallRight,'#65544a',2.5);
  c.strokeStyle='#8b6b4f';c.lineWidth=5;c.beginPath();c.moveTo(x-83,y-99);c.lineTo(x-83,y-23);c.moveTo(x-44,y-84);c.lineTo(x-44,y-2);c.moveTo(x+44,y-84);c.lineTo(x+44,y-3);c.moveTo(x+83,y-105);c.lineTo(x+83,y-22);c.stroke();
  c.strokeStyle='#eed3aa';c.lineWidth=2;c.beginPath();c.moveTo(x-84,y-23);c.lineTo(x,y+22);c.lineTo(x+84,y-23);c.stroke();
  // Windows and shutters on both faces.
  harborWindow(c,x-52,y-49,'left');
  harborWindow(c,x+53,y-49,'right');
  if(!warehouse)harborWindow(c,x-29,y-9,'left');
  // Main front door set into a right-hand wall.
  isoPoly(c,[[x+11,y-29],[x+36,y-42],[x+36,y+5],[x+11,y+20]],'#573f37','#3b3439',2);
  isoPoly(c,[[x+14,y-26],[x+32,y-36],[x+32,y+3],[x+14,y+15]],'#995f43','#d5a26b',1.5);
  ellipse(c,x+26,y+1,2.5,2.5,'#ffd17a');
  // The roof is a true isometric hip roof, not a front-facing rectangle.
  isoPoly(c,[[x,y-178],[x-99,y-127],[x,y-72]],tileLight,roofEdge,4);
  isoPoly(c,[[x,y-178],[x,y-72],[x+99,y-127]],tileColor,roofEdge,4);
  c.save();c.beginPath();c.moveTo(x,y-178);c.lineTo(x+99,y-127);c.lineTo(x,y-72);c.lineTo(x-99,y-127);c.closePath();c.clip();
  // Roof shingle lines: curved rows and staggered joints for a pixel-art-like rhythm.
  c.lineWidth=1.45;c.strokeStyle=blue?'#163f6aaa':'#53383cab';
  for(let row=0;row<7;row++){
    const yy=y-171+row*14;
    c.beginPath();c.moveTo(x-104,yy);c.lineTo(x+104,yy);c.stroke();
    for(let j=-9;j<=9;j++){
      const bx=x+j*16+(row%2)*8;
      c.beginPath();c.moveTo(bx,yy);c.lineTo(bx-3,yy+7);c.stroke();
    }
  }
  c.restore();
  c.strokeStyle='#f4d7ae76';c.lineWidth=3;c.beginPath();c.moveTo(x,y-176);c.lineTo(x+95,y-128);c.stroke();
  c.strokeStyle='#544e49';c.lineWidth=6;c.beginPath();c.moveTo(x-97,y-126);c.lineTo(x,y-71);c.lineTo(x+98,y-126);c.stroke();
  // Chimney and attic: makes the silhouette identifiable from far away.
  isoPoly(c,[[x+39,y-169],[x+56,y-178],[x+56,y-135],[x+39,y-126]],'#a99688','#6d5e59',2);
  isoPoly(c,[[x+34,y-171],[x+50,y-179],[x+63,y-173],[x+47,y-164]],'#bc6f5b','#544950',2);
  // Stacked crates, nautical barrels and a hanging wall lamp.
  drawBarrels(c,{x:o.x-.95,y:o.y+.14},t,.62);
  ellipse(c,x+91,y-59,8,7,'#ffca75','#7e5f45',2);
  c.fillStyle='#fff3a42a';ellipse(c,x+91,y-60,19,17,c.fillStyle);
  for(const [bx,by] of [[x-38,y-3],[x+62,y-23]]){
    ellipse(c,bx,by,11,7,'#46764f','#2b5548',1.3);
    for(let j=0;j<4;j++){
      ellipse(c,bx+(j-1.5)*5,by-4-j%2*4,3,3,j%2?'#eaa2a1':'#f7dd96');
    }
  }
  if(tavern){
    isoPoly(c,[[x-68,y-132],[x-11,y-161],[x+16,y-145],[x-42,y-116]],'#6d343a','#e4ad76',2);
    c.save();c.translate(x-35,y-137);c.rotate(-.18);
    c.fillStyle='#fff1c9';c.font='bold 13px Georgia,serif';c.textAlign='center';c.fillText('TAVERNE',0,0);c.restore();
  }
  if(warehouse){
    // Hoisting wheel and canvas cargo rolled beside the warehouse.
    c.strokeStyle='#9c794f';c.lineWidth=4;c.beginPath();c.arc(x-86,y-45,12,0,TAU);c.moveTo(x-86,y-57);c.lineTo(x-86,y-33);c.moveTo(x-98,y-45);c.lineTo(x-74,y-45);c.stroke();
    roundRect(c,x-93,y+5,33,15,3,'#d9b58b','#78604e',2);
  }
  c.restore();
}
function drawBarrels(c,o,t,scale=1){
  const x=o.x*TILE,y=o.y*TILE;c.save();c.translate(x,y);c.scale(scale,scale);
  ellipse(c,1,11,41,12,'#172d3570');
  for(const [bx,by,s] of [[-18,-2,1],[8,1,.83],[25,-1,.64]]){
    c.save();c.translate(bx,by);c.scale(s,s);
    roundRect(c,-14,-24,29,34,6,'#936746','#443b3d',2.4);
    ellipse(c,0,-22,14,6,'#b68b57','#5d4c44',2);
    c.strokeStyle='#d5b07a';c.lineWidth=2;c.beginPath();c.moveTo(-13,-15);c.lineTo(14,-15);c.moveTo(-12,3);c.lineTo(13,3);c.stroke();
    ellipse(c,0,-24,9,2.5,'#554738');c.restore();
  }
  c.restore();
}
function drawMarketStall(c,o,t){
  const x=o.x*TILE,y=o.y*TILE,choice=o.id.includes('red')?0:o.id.includes('green')?2:1;
  const stripes=[['#c25655','#f3cda0'],['#4b88b0','#e1d9c2'],['#569b81','#f9dab0']][choice];
  ellipse(c,x+7,y+8,70,22,'#19394155');
  isoPoly(c,[[x-67,y-22],[x,y+14],[x+67,y-22],[x,y-57]],'#c09561','#69503e',3);
  for(const xx of [-55,55]){c.strokeStyle='#795438';c.lineWidth=5;c.beginPath();c.moveTo(x+xx,y-30);c.lineTo(x+xx,y+20);c.stroke();}
  // Gabled cloth awning with alternating strips, pretty even when zoomed out.
  isoPoly(c,[[x-70,y-57],[x,y-102],[x+70,y-57],[x,y-19]],stripes[0],'#514048',2.5);
  c.save();c.beginPath();c.moveTo(x-70,y-57);c.lineTo(x,y-102);c.lineTo(x+70,y-57);c.lineTo(x,y-19);c.closePath();c.clip();
  for(let i=-6;i<8;i++){
    c.lineWidth=10;c.strokeStyle=i%2?stripes[1]:stripes[0];
    c.beginPath();c.moveTo(x+i*21-80,y-106);c.lineTo(x+i*21+90,y-13);c.stroke();
  }
  c.restore();
  for(let j=-2;j<=2;j++){
    ellipse(c,x+j*17,y-6+j%2*2,7,5,j%2?'#eeac5d':'#82b973','#815c40',1);
  }
  roundRect(c,x-49,y+1,98,8,2,'#9a633f','#604c3a',1.5);
}
function drawFountain(c,o,t){
  const x=o.x*TILE,y=o.y*TILE;
  ellipse(c,x+7,y+11,64,21,'#23415b5e');
  ellipse(c,x,y+3,59,27,'#b8b5a4','#626f72',3);
  ellipse(c,x,y+1,47,19,'#2d95aa','#d5c4a3',2);
  for(let j=0;j<5;j++){const a=j*TAU/5+t*.22;ellipse(c,x+Math.cos(a)*34,y+Math.sin(a)*13,2.8,1.8,'#f8fae6b9');}
  path(c,[[x-14,y-5],[x-10,y-41],[x+8,y-41],[x+13,y-5]],'#c4b9a2','#6b7877',2);
  ellipse(c,x,y-42,13,5,'#e4cfab','#768483',2);
  c.strokeStyle='#93e8f3c0';c.lineWidth=2;c.beginPath();c.moveTo(x,y-38);c.quadraticCurveTo(x-26,y-41,x-38,y-2);c.moveTo(x,y-38);c.quadraticCurveTo(x+26,y-41,x+38,y-2);c.stroke();
}
function drawSignpost(c,o,t){
  const x=o.x*TILE,y=o.y*TILE;
  ellipse(c,x,y+9,23,7,'#254a4766');
  c.strokeStyle='#725344';c.lineWidth=8;c.beginPath();c.moveTo(x,y+7);c.lineTo(x,y-74);c.stroke();
  path(c,[[x-34,y-60],[x+31,y-60],[x+43,y-49],[x+31,y-39],[x-34,y-39]],'#b77d4e','#59433a',2);
  c.save();c.translate(x,y-46);c.textAlign='center';c.font='bold 11px Georgia';c.fillStyle='#fff0ca';c.fillText('PORT',0,0);c.restore();
}
function drawLamppost(c,o,t){
  const x=o.x*TILE,y=o.y*TILE;ellipse(c,x+4,y+9,23,9,'#30414566');
  c.strokeStyle='#594b43';c.lineWidth=6;c.beginPath();c.moveTo(x,y+5);c.lineTo(x,y-96);c.stroke();
  path(c,[[x-12,y-93],[x+12,y-93],[x+16,y-70],[x-16,y-70]],'#e6b777','#755748',2);
  roundRect(c,x-9,y-92,18,18,2,'#ffdc8e','#664d43',2);
  c.fillStyle='#fff0a342';ellipse(c,x,y-82,31,27,c.fillStyle);
  c.strokeStyle='#d2b780';c.lineWidth=3;c.beginPath();c.moveTo(x-16,y-96);c.lineTo(x,y-106);c.lineTo(x+16,y-96);c.stroke();
}
function drawBanner(c,o,t){
  const x=o.x*TILE,y=o.y*TILE;c.strokeStyle='#5f4941';c.lineWidth=6;
  c.beginPath();c.moveTo(x,y+9);c.lineTo(x,y-123);c.stroke();
  ellipse(c,x,y-127,6,6,'#edcf8d','#7f5f4d',1);
  const w=50+Math.sin(t*1.3+o.x)*5;
  path(c,[[x+2,y-115],[x+w,y-112],[x+w-8,y-83],[x+w-26,y-89],[x+3,y-84]],'#244d71','#d5ab6d',2);
  c.strokeStyle='#e3c684';c.lineWidth=2;c.beginPath();c.arc(x+27,y-101,9,.4,5.3);c.stroke();
}
function drawFishstand(c,o,t){
  const x=o.x*TILE,y=o.y*TILE;
  ellipse(c,x,y+10,44,12,'#183a4269');
  roundRect(c,x-40,y-14,80,22,3,'#966947','#624d3c',2);
  for(let i=0;i<5;i++){
    const px=x-29+i*15;ellipse(c,px,y-12+(i%2)*2,10,5,'#8ab7bd','#436c78',1.2);
    path(c,[[px+9,y-12],[px+18,y-17],[px+18,y-7]],'#76a0a5','#436c78',1);
    ellipse(c,px-4,y-13,1.3,1.3,'#273f4b');
  }
  drawBarrels(c,{x:o.x+.54,y:o.y+.3},t,.45);
}
function drawFlowerbed(c,o,t){
  const x=o.x*TILE,y=o.y*TILE;
  ellipse(c,x,y+10,42,15,'#3752426b');
  ellipse(c,x,y+5,35,12,'#75583e','#c2a278',3);
  for(let i=0;i<15;i++){
    const nx=noise(i,o.x*100|0,3),ny=noise(i,o.y*100|0,9);
    const px=x+(nx-.5)*55,py=y+(ny-.5)*17;
    ellipse(c,px,py,5,4,i%3===0?'#3d8c62':'#6bb477');
    if(i%2===0)ellipse(c,px,py-3,3,3,i%3===0?'#f5e4a1':'#f5a2a6');
  }
}
function drawGalleon(c,o,t){
  const x=o.x*TILE,y=o.y*TILE,rock=Math.sin(t*.7)*2.7;
  c.save();c.translate(x,y+rock);
  ellipse(c,x*0,y*0+14,104,26,'#0e4d7199');
  isoPoly(c,[[-109,-14],[-82,22],[69,27],[111,-7],[81,20],[-72,38]],'#694332','#322f3b',4);
  isoPoly(c,[[-94,-7],[-77,12],[67,17],[95,-6]],'#bb8053','#523f35',2.5);
  c.strokeStyle='#d8af6d';c.lineWidth=3;
  for(let i=-2;i<=2;i++){c.beginPath();c.moveTo(i*31,-6);c.lineTo(i*31,17);c.stroke();}
  c.strokeStyle='#674734';c.lineWidth=6;c.beginPath();c.moveTo(-13,-8);c.lineTo(-13,-128);c.moveTo(56,-7);c.lineTo(56,-88);c.stroke();
  isoPoly(c,[[-18,-124],[-18,-24],[-78,-27]],'#f1ddaf','#725e51',2);
  isoPoly(c,[[58,-86],[58,-25],[97,-28]],'#f6e4bf','#725e51',2);
  c.strokeStyle='#7e5b4e';c.lineWidth=2;c.beginPath();c.moveTo(-13,-130);c.lineTo(100,-8);c.moveTo(56,-90);c.lineTo(-82,-8);c.stroke();
  c.fillStyle='#edc36d';roundRect(c,-80,-18,130,7,2,c.fillStyle);
  c.restore();
}
function drawDock(c,o,t){
  const x=o.x*TILE,y=o.y*TILE;
  ellipse(c,x,y+18,42,15,'#214b4f77');
  for(let j=0;j<5;j++){
    roundRect(c,x-38,y-24+j*12,78,11,1,j%2?'#b78958':'#d0a56b','#71553e',1.7);
    c.strokeStyle='#e8c99a99';c.beginPath();c.moveTo(x-27,y-22+j*12);c.lineTo(x+25,y-22+j*12);c.stroke();
  }
  c.fillStyle='#664a38';c.fillRect(x-38,y-38,8,68);c.fillRect(x+28,y-38,8,68);
  ellipse(c,x-34,y-38,6,4,'#e6d0a0');ellipse(c,x+32,y-38,6,4,'#e6d0a0');
  ellipse(c,x,y-47,8+Math.sin(t*3)*2,4,'#f8e4a6bb');
}
function drawChest(c,o,opened=false,t=0){
  const x=o.x*TILE,y=o.y*TILE;
  ellipse(c,x+1,y+13,25,10,'#473f2b88');
  roundRect(c,x-22,y-13,44,26,5,opened?'#6d6f65':'#87552e','#403b3b',3);
  path(c,[[x-23,y-14],[x-16,y-27],[x+17,y-27],[x+23,y-14]],opened?'#624b3b':'#b17d3c','#483d35',3);
  c.strokeStyle='#edbd71';c.lineWidth=3;c.strokeRect(x-18,y-14,36,20);
  roundRect(c,x-5,y-14,10,12,3,'#fff1ae','#685a3f',2);
  if(!opened){const a=.45+.4*Math.sin(t*3);ellipse(c,x,y-31,5,5,`rgba(255,232,140,${a})`);}
}
function drawStatue(c,o){
  const x=o.x*TILE,y=o.y*TILE;
  ellipse(c,x,y+18,40,14,'#384e5066');
  roundRect(c,x-30,y+2,60,17,4,'#a7aa9e','#49565a',3);
  path(c,[[x-19,y+2],[x-18,y-35],[x-4,y-53],[x+15,y-43],[x+19,y+2]],'#c6c2a9','#4e5d65',3);
  c.strokeStyle='#52798b';c.lineWidth=4;c.beginPath();c.arc(x,y-20,9,.4,4.1);c.stroke();
}
function drawPerson(c,x,y,opts={}){
  const {name='hero',walking=false,clock=0,dir='down',scale=1,color='#3e89a3',hair='#323047',hat=false}=opts;
  c.save();c.translate(x,y);c.scale(scale,scale);
  const motion=walking?Math.sin(clock*13)*5:Math.sin(clock*2)*1.2;
  ellipse(c,3,14,18,6,'#1c3f3b71');
  // manteau et jambes cel-shading, tout est dessiné plutôt qu'utilisé comme emoji
  const step=walking?Math.sin(clock*14)*6:0;
  roundRect(c,-11,1+step,9,19,3,'#343a56','#263144',2);
  roundRect(c,2,1-step,9,19,3,'#343a56','#263144',2);
  roundRect(c,-13,16+step,12,7,3,'#5d3e35','#293341',2);
  roundRect(c,2,16-step,12,7,3,'#5d3e35','#293341',2);
  path(c,[[-17,-29],[-10,-38],[10,-38],[17,-29],[16,6],[-15,6]],color,'#263744',3);
  path(c,[[-6,-33],[1,-16],[4,3],[-8,5]],'#dbe7da',null);
  path(c,[[6,-33],[14,-30],[14,3],[5,3]],'#234f78',null);
  // Contrasting scarf, brass buckle and fabric seam, designed to read at mobile scale.
  path(c,[[-15,-29],[-6,-34],[8,-32],[15,-27],[1,-21]],'#e8c895','#33414c',1.5);
  roundRect(c,-13,-3,27,5,2,'#694936','#312f3d',1.1);
  roundRect(c,-3,-5,7,9,2,'#e7b96d','#604c44',1.3);
  c.strokeStyle='#f9e7c766';c.lineWidth=1.5;c.beginPath();c.moveTo(-11,-24);c.lineTo(-11,-9);c.stroke();
  // swinging arms
  roundRect(c,-23,-26+motion,8,25,4,'#dba579','#4e3a42',2);
  roundRect(c,15,-26-motion,8,25,4,'#dba579','#4e3a42',2);
  // face and hair
  ellipse(c,0,-47,19,21,'#e9b990','#363444',3);
  ellipse(c,-18,-46,5,7,'#e1a77c','#373442',2);
  ellipse(c,18,-46,5,7,'#e1a77c','#373442',2);
  path(c,[[-20,-54],[-17,-67],[-6,-72],[7,-68],[18,-73],[23,-55],[12,-59],[3,-58],[-4,-63],[-10,-57]],hair,'#272d40',2.3);
  if(hat){ellipse(c,0,-62,30,9,'#b7884d','#4d3a3e',2);ellipse(c,0,-71,18,15,'#d3a36a','#4d3a3e',2);roundRect(c,-18,-68,36,5,2,'#b85357');}
  if(dir==='up'){
    path(c,[[-17,-53],[-6,-66],[6,-65],[19,-52],[14,-37],[-16,-37]],hair,'#2b2b3e',2);
  } else {
    ellipse(c,-7,-46,2.5,3.7,'#2e3b42');ellipse(c,7,-46,2.5,3.7,'#2e3b42');
    c.strokeStyle='#ab5e58';c.lineWidth=1.4;c.beginPath();c.arc(0,-42,5,.1,Math.PI-.1);c.stroke();
    c.strokeStyle='#293846';c.beginPath();c.moveTo(-12,-55);c.lineTo(-5,-56);c.moveTo(4,-56);c.lineTo(12,-55);c.stroke();
  }
  if(name==='enemy'){
    roundRect(c,-19,-38,38,9,3,'#b54f56','#28313d',2);
    path(c,[[-14,-29],[14,-29],[19,-15],[11,8],[-12,8],[-18,-15]],'#8d4147','#293443',2);
  }
  c.restore();
}
function drawEnemy(c,o,t,boss=false){
  const x=o.x*TILE,y=o.y*TILE;
  ellipse(c,x,y+5,boss?34:27,boss?12:9,'#c3484a44');
  drawPerson(c,x,y+5-Math.sin(t*2+o.x)*2,{name:'enemy',clock:t,dir:'down',scale:boss?1.32:.80,color:'#9c5663',hair:'#40344a'});
  if(boss){c.font='bold 28px system-ui';c.textAlign='center';c.fillStyle='#ffe6af';c.fillText('♛',x,y-85);}
}
function drawLabel(c,x,y,content,primary=false){
  c.save();c.font='bold 13px system-ui';const w=Math.min(240,c.measureText(content).width+28);
  roundRect(c,x-w/2,y-21,w,26,13,primary?'#fcdf9c':'#132d3de8',primary?'#fff1bc':'#92c2c7',1.5);
  c.fillStyle=primary?'#243541':'#f3e9d0';c.textAlign='center';c.fillText(content,x,y-4);c.restore();
}
function drawMiniMap(c,s){
  const W=130,H=109,x=s.w-W-11,y=13;
  const scale=Math.min((W-16)/MW,(H-25)/MH),left=(W-MW*scale)/2,top=5;
  if(!s.miniMapCanvas){
    const bg=document.createElement('canvas');bg.width=W;bg.height=H;
    const m=bg.getContext('2d');
    roundRect(m,0,0,W,H,11,'#0d2437e8','#d5c28a',1.5);
    for(let gy=0;gy<MH;gy++)for(let gx=0;gx<MW;gx++){
      const k=tileKind(gx,gy);
      m.fillStyle=!k?'#316c88':k===1?'#e1c392':k===2?'#728b92':k===4?'#8d9599':k===5?'#dab87c':k===7?'#c0a784':'#77a98a';
      m.fillRect(left+gx*scale,top+gy*scale,Math.ceil(scale+.2),Math.ceil(scale+.2));
    }
    if(s.world.id==='albe'){
      for(const o of s.world.objects.filter(o=>['landmark','lighthouse','windmill','dock'].includes(o.type))){
        ellipse(m,left+o.x*scale,top+o.y*scale,2.5,2.5,o.type==='landmark'?'#ffec9c':'#f1f4ed');
      }
    }
    m.fillStyle='#f4e4c0';m.font='bold 10px system-ui';m.textAlign='center';m.fillText('CARTE DE L’ÎLE',W/2,H-5);
    s.miniMapCanvas=bg;
  }
  c.drawImage(s.miniMapCanvas,x,y);
  ellipse(c,x+left+s.x*scale,y+top+s.y*scale,4,4,'#fdf0a5','#172b36',1);
}
/* V0.3 – projection 2.5D isométrique du monde. Même géographie et sauvegardes V2. */
const ISO_X=47,ISO_Y=24,ISO_ORIGIN_X=MH*ISO_X+110,ISO_ORIGIN_Y=125;
const ISO_FULL_WIDTH=(MW+MH)*ISO_X+280,ISO_FULL_HEIGHT=(MW+MH)*ISO_Y+280;
function project(x,y){return {x:ISO_ORIGIN_X+(x-y)*ISO_X,y:ISO_ORIGIN_Y+(x+y)*ISO_Y};}
function isoDiamond(c,p,color,edge='#1a5364',alpha=1){
  c.save();c.globalAlpha=alpha;
  path(c,[[p.x,p.y-ISO_Y],[p.x+ISO_X,p.y],[p.x,p.y+ISO_Y],[p.x-ISO_X,p.y]],color,edge,1);
  c.restore();
}
function drawIsoGround(c,s,clip=null){
  const theme=s.world.theme;
  c.fillStyle=theme.deep;c.fillRect(0,0,ISO_FULL_WIDTH,ISO_FULL_HEIGHT);
  for(let sum=0;sum<MW+MH;sum++)for(let y=0;y<MH;y++){
    const x=sum-y;if(x<0||x>=MW)continue;
    const p=project(x+.5,y+.5);
    if(clip && (p.x<clip.x-ISO_X-6||p.x>clip.x+clip.w+ISO_X+6||p.y<clip.y-ISO_Y-8||p.y>clip.y+clip.h+ISO_Y+8))continue;
    const type=tileKind(x,y),n=noise(x,y,s.world.seed);
    if(type===0){
      isoDiamond(c,p,n>.45?theme.deep:theme.sea,theme.deep);
      if(n>.65){c.strokeStyle=n>.91?'#d7fff6b6':'#b6e8e39d';c.lineWidth=n>.9?1.9:1.2;c.beginPath();c.moveTo(p.x-17,p.y+1);c.quadraticCurveTo(p.x,p.y-5,p.x+15,p.y+1);c.stroke();}
      if(n>.94){ellipse(c,p.x+11,p.y-3,3.3,1.2,'#f1fff5b4');}
      continue;
    }
    const fill=type===1?(n>.5?theme.sand:theme.sand2):
      type===2?(n>.5?'#86939b':'#778b99'):
      type===4?(n>.5?'#9a999d':'#7d8c97'):
      type===5?(n>.5?'#e7c88f':'#dac294'):
      type===6?(n>.5?'#87c3a2':'#75bba4'):(n>.5?theme.grass:theme.grass2);
    const border=type===2?'#7a8381':type===4?'#697c81':type===7?'#ac997e':'#557f71';
    if(type===7){
      // Harbor cobbles: a warm, varied laid-stone surface with worn edges and seams.
      isoDiamond(c,p,n>.54?'#d8b98d':n>.28?'#c3a987':'#baa384',border);
      c.save();c.beginPath();c.moveTo(p.x,p.y-ISO_Y+1);c.lineTo(p.x+ISO_X-1,p.y);c.lineTo(p.x,p.y+ISO_Y-1);c.lineTo(p.x-ISO_X+1,p.y);c.closePath();c.clip();
      c.strokeStyle='#8e857788';c.lineWidth=1.05;
      const off=(x+y)%2*11;
      for(let j=-2;j<=2;j++){
        const yy=p.y+j*10;c.beginPath();c.moveTo(p.x-51,yy);c.lineTo(p.x+51,yy);c.stroke();
        for(let i=-3;i<=3;i++){
          const xx=p.x+i*21+(j%2)*9+off;
          c.beginPath();c.moveTo(xx,yy);c.lineTo(xx+(n-.5)*2,yy+10);c.stroke();
        }
      }
      c.globalAlpha=.2;c.fillStyle='#fff8e3';ellipse(c,p.x-13,p.y-8,22,6,c.fillStyle);c.restore();
    } else isoDiamond(c,p,fill,border);
    if(type===1){
      const left=tileKind(x-1,y)===0,right=tileKind(x+1,y)===0,top=tileKind(x,y-1)===0,bottom=tileKind(x,y+1)===0;
      c.strokeStyle='#d1f2e6';c.lineWidth=2;
      if(left||top||right||bottom){c.beginPath();c.moveTo(p.x-ISO_X*.60,p.y);c.quadraticCurveTo(p.x,p.y-6,p.x+ISO_X*.60,p.y);c.stroke();}
    }
    if(type===3||type===6){
      const gx=p.x+(n-.5)*45,gy=p.y+(noise(y,x,s.world.seed)-.5)*11;
      c.strokeStyle=n>.6?'#d5e6acb8':'#2a79586a';c.lineWidth=1;
      c.beginPath();c.moveTo(gx-2,gy+2);c.lineTo(gx,gy-4);c.lineTo(gx+3,gy+2);c.stroke();
      if(n>.91){ellipse(c,gx+9,gy-3,2.5,2.5,'#ffe2a6');ellipse(c,gx+13,gy+3,1.8,1.8,'#f8e5c4');}
      if(n>.80&&n<.875){
        // Ferns and little broad-leaf plants give grass a natural, hand-painted texture.
        c.strokeStyle='#296a52';c.lineWidth=1.3;c.beginPath();c.moveTo(gx,gy+7);c.lineTo(gx,gy-7);c.stroke();
        for(let j=0;j<3;j++){
          const oy=gy-6+j*5;c.fillStyle=j%2?'#58a875':'#326e58';
          ellipse(c,gx-5,oy,6,2.3,c.fillStyle);ellipse(c,gx+5,oy+2,6,2.3,c.fillStyle);
        }
      }
      if(type===6){ellipse(c,gx-6,gy+2,2,2,n>.5?'#e9b2d4':'#ffe6a0');ellipse(c,gx+4,gy+3,2,2,'#dfdbff');}
    } else if(type===2){
      c.strokeStyle='#d8d7bd85';c.lineWidth=1;
      for(let i=0;i<3;i++){const xx=p.x-26+i*19,yy=p.y+(i%2?5:-3);c.beginPath();c.moveTo(xx-5,yy);c.lineTo(xx+6,yy+2);c.stroke();}
      if(n>.72){ellipse(c,p.x+15,p.y-5,4,1.5,'#ecdab5a6');}

    } else if(type===4){
      c.strokeStyle='#d3c7b0aa';c.lineWidth=1;c.beginPath();c.moveTo(p.x-16,p.y);c.lineTo(p.x+12,p.y);c.moveTo(p.x+2,p.y-10);c.lineTo(p.x+7,p.y+10);c.stroke();
    } else if(type===5){
      c.strokeStyle='#d1a76d';c.lineWidth=1.2;c.beginPath();c.moveTo(p.x-6,p.y+5);c.lineTo(p.x-10,p.y-2);c.moveTo(p.x+6,p.y-3);c.lineTo(p.x+9,p.y+3);c.stroke();
    }
  }
}
function drawProjectedObject(c,o,s){
  const p=project(o.x,o.y);
  c.save();c.translate(p.x-o.x*TILE,p.y-o.y*TILE);
  switch(o.type){
    case 'palm':drawPalm(c,o,s.clock);break;
    case 'oak':drawOak(c,o,s.clock);break;
    case 'cactus':drawCactus(c,o);break;
    case 'column':drawColumn(c,o);break;
    case 'flowers':drawFlowers(c,o,s.clock);break;
    case 'boat':drawBoat(c,o,s.clock);break;
    case 'windmill':drawWindmill(c,o,s.clock);break;
    case 'lighthouse':drawLighthouse(c,o,s.clock);break;
    case 'shrine':drawShrine(c,o);break;
    case 'spring':drawSpring(c,o,s.clock);break;
    case 'landmark':break;
    case 'bush':drawBush(c,o);break;
    case 'rock':drawRock(c,o);break;
    case 'house':case 'tavern':case 'warehouse':drawIsometricHouse(c,o,s.clock);break;
    case 'stall':drawMarketStall(c,o,s.clock);break;
    case 'barrels':drawBarrels(c,o,s.clock);break;
    case 'fountain':drawFountain(c,o,s.clock);break;
    case 'signpost':drawSignpost(c,o,s.clock);break;
    case 'fishstand':drawFishstand(c,o,s.clock);break;
    case 'banner':drawBanner(c,o,s.clock);break;
    case 'flowerbed':drawFlowerbed(c,o,s.clock);break;
    case 'lamppost':drawLamppost(c,o,s.clock);break;
    case 'galleon':drawGalleon(c,o,s.clock);break;
    case 'dock':drawDock(c,o,s.clock);break;
    case 'statue':drawStatue(c,o);break;
    case 'npc':drawPerson(c,o.x*TILE,o.y*TILE,{name:'npc',color:o.color,clock:s.clock,hair:o.id==='guerisseuse'?'#563f70':'#2d4555',hat:o.id==='marchand',scale:.74});break;
    case 'chest':drawChest(c,o,false,s.clock);break;
    case 'enemy':drawEnemy(c,o,s.clock,false);break;
    case 'boss':drawEnemy(c,o,s.clock,true);break;
    case 'player':{
      const looks={azur:{hair:'#214c8b',coat:'#2c768c'},flamme:{hair:'#c35c36',coat:'#a45046'},brume:{hair:'#7652a4',coat:'#665b8e'}};
      const look=looks[s.game.appearance]||looks.azur;
      const coat=s.game.job==='gardien'?'#416b93':s.game.job==='eclaireur'?'#368b79':look.coat;
      drawPerson(c,o.x*TILE,o.y*TILE,{name:'hero',walking:s.walking,clock:s.clock,dir:s.direction,color:coat,hair:look.hair,hat:true,scale:.88});break;
    }
  }
  c.restore();
}
function cameraBounds(s){return {maxX:Math.max(0,ISO_FULL_WIDTH-s.w/s.zoom),maxY:Math.max(0,ISO_FULL_HEIGHT-s.h/s.zoom)};}
function sceneCamera(s){
  const bounds=cameraBounds(s);
  if(s.cameraFollow){
    const p=project(s.x,s.y);
    s.cameraX=clamp(p.x-s.w/(2*s.zoom),0,bounds.maxX);
    s.cameraY=clamp(p.y-s.h/(2*s.zoom),0,bounds.maxY);
  }else{
    s.cameraX=clamp(s.cameraX,0,bounds.maxX);
    s.cameraY=clamp(s.cameraY,0,bounds.maxY);
  }
  return {x:s.cameraX,y:s.cameraY,w:s.w/s.zoom,h:s.h/s.zoom};
}
function panCamera(s,dx,dy){
  const view=sceneCamera(s);s.cameraFollow=false;
  const bounds=cameraBounds(s);
  s.cameraX=clamp(view.x-dx/s.zoom,0,bounds.maxX);
  s.cameraY=clamp(view.y-dy/s.zoom,0,bounds.maxY);
}
function setZoom(s,next,anchorX=s.w/2,anchorY=s.h/2){
  const before=sceneCamera(s),worldX=before.x+anchorX/s.zoom,worldY=before.y+anchorY/s.zoom;
  s.zoom=clamp(next,.42,1.9);
  s.cameraFollow=false;
  const bounds=cameraBounds(s);
  s.cameraX=clamp(worldX-anchorX/s.zoom,0,bounds.maxX);
  s.cameraY=clamp(worldY-anchorY/s.zoom,0,bounds.maxY);
  updateZoomLabel(s);
}
function updateZoomLabel(s){
  const label=s.el.querySelector('#scene-zoom-label');if(label)label.textContent=`${Math.round(s.zoom*100)} %`;
}
function screenToWorld(s,px,py){
  const v=sceneCamera(s),a=(v.x+px/s.zoom-ISO_ORIGIN_X)/ISO_X,b=(v.y+py/s.zoom-ISO_ORIGIN_Y)/ISO_Y;
  return {x:(a+b)/2,y:(b-a)/2};
}
// Cache LRU : seules les portions visibles sont dessinées en mémoire.
// On évite un énorme canvas de plus de 90 Mo sur les téléphones.
const CHUNK=768,MAX_CHUNKS=14;
function drawGroundChunks(c,s,view){
  const col0=Math.max(0,Math.floor(view.x/CHUNK)),row0=Math.max(0,Math.floor(view.y/CHUNK));
  const col1=Math.min(Math.ceil(ISO_FULL_WIDTH/CHUNK)-1,Math.floor((view.x+view.w)/CHUNK));
  const row1=Math.min(Math.ceil(ISO_FULL_HEIGHT/CHUNK)-1,Math.floor((view.y+view.h)/CHUNK));
  for(let row=row0;row<=row1;row++)for(let col=col0;col<=col1;col++){
    const key=`${col}:${row}`,atX=col*CHUNK,atY=row*CHUNK;
    let chunk=s.chunkCache.get(key);
    if(!chunk){
      chunk=document.createElement('canvas');chunk.width=Math.min(CHUNK,ISO_FULL_WIDTH-atX);chunk.height=Math.min(CHUNK,ISO_FULL_HEIGHT-atY);
      const ctx=chunk.getContext('2d',{alpha:false});ctx.translate(-atX,-atY);
      drawIsoGround(ctx,s,{x:atX,y:atY,w:chunk.width,h:chunk.height});
    } else s.chunkCache.delete(key);
    s.chunkCache.set(key,chunk);
    c.drawImage(chunk,atX,atY);
  }
  while(s.chunkCache.size>MAX_CHUNKS)s.chunkCache.delete(s.chunkCache.keys().next().value);
}
function renderScene(s,scenic=false){
  const c=s.ctx;c.setTransform(s.dpr,0,0,s.dpr,0,0);c.clearRect(0,0,s.w,s.h);
  const view=sceneCamera(s),camX=view.x,camY=view.y;
  c.save();c.scale(s.zoom,s.zoom);c.translate(-camX,-camY);
  drawGroundChunks(c,s,view);
  const objects=s.world.objects.filter(o=>entityAvailable(s,o)&&(!scenic || !['enemy','boss','npc'].includes(o.type)))
    .concat(scenic?[]:[{id:'hero',type:'player',x:s.x,y:s.y}]);
  const visible=objects.filter(o=>{const p=project(o.x,o.y);return p.x>=camX-150&&p.x<camX+view.w+150&&p.y>=camY-170&&p.y<camY+view.h+145;});
  visible.sort((a,b)=>(a.x+a.y)-(b.x+b.y));
  for(const o of visible)drawProjectedObject(c,o,s);
  for(const o of visible.filter(o=>o.type==='landmark' && entityAvailable(s,o)))drawLandmark(c,o,s.clock);
  if(!scenic&&s.destination){const p=project(s.destination.x,s.destination.y);const pulse=7+Math.sin(s.clock*6)*3;
    c.strokeStyle='#fce3a8';c.lineWidth=3;c.beginPath();c.ellipse(p.x,p.y,pulse+12,(pulse+12)*.52,0,0,TAU);c.stroke();
    ellipse(c,p.x,p.y,5,3,'#fff1b5');
  }
  // Soft windblown seabirds; purely visual, no interaction or collision.
  if(s.world.id==='albe'){
    c.save();c.strokeStyle='#f5efe0b6';c.lineWidth=2.0;c.lineCap='round';
    for(let i=0;i<8;i++){
      const x=13+i*2.1+Math.sin(s.clock*.3+i)*.5,y=31+(i%3)*1.7;
      const p=project(x,y),wing=3+Math.sin(s.clock*3+i*2)*3;
      if(p.x<camX-50||p.x>camX+view.w+50||p.y<camY-50||p.y>camY+view.h+50)continue;
      c.beginPath();c.moveTo(p.x-8,p.y-3);c.quadraticCurveTo(p.x-3,p.y-5-wing,p.x,p.y-2);
      c.quadraticCurveTo(p.x+3,p.y-5-wing,p.x+8,p.y-3);c.stroke();
    }
    c.restore();
  }
  const near=nearObject(s);
  if(!scenic&&near){const p=project(near.x,near.y);
    c.strokeStyle='#ffe5a0';c.lineWidth=2.8;c.setLineDash([6,5]);c.beginPath();c.ellipse(p.x,p.y+5,27,12,0,0,TAU);c.stroke();c.setLineDash([]);
    drawLabel(c,p.x,p.y-(near.type==='npc'?80:near.type==='boss'?112:55),near.label||'Interagir',true);
  }
  c.restore();
  // L'interface est désormais un HUD HTML. Pas de mini-carte ni de double HUD dans le canvas.
}


function updateHudMiniMap(s){
  const out=s.el.querySelector('#hud-minimap');if(!out)return;
  const w=144,h=112;
  if(!s.hudMiniBase){
    const bg=document.createElement('canvas');bg.width=w;bg.height=h;
    const c=bg.getContext('2d',{alpha:false});
    c.fillStyle='#0c4661';c.fillRect(0,0,w,h);
    const sx=w/MW,sy=h/MH,t=s.world.theme;
    for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){
      const k=tileKind(x,y);c.fillStyle=k===0?t.deep:k===1?t.foam:k===2?'#c1a572':k===4?'#848e91':k===5?t.sand:k===7?'#c6af8a':t.grass;
      c.fillRect(x*sx,y*sy,Math.ceil(sx+.2),Math.ceil(sy+.2));
    }
    c.strokeStyle='#dcbd7e';c.lineWidth=1.6;c.strokeRect(.8,.8,w-1.6,h-1.6);
    s.hudMiniBase=bg;
  }
  const c=out.getContext('2d');if(!c)return;
  c.clearRect(0,0,w,h);c.drawImage(s.hudMiniBase,0,0);
  const px=s.x*w/MW,py=s.y*h/MH;
  c.beginPath();c.arc(px,py,7,0,Math.PI*2);c.fillStyle='#081f2d';c.fill();
  c.beginPath();c.arc(px,py,4.5,0,Math.PI*2);c.fillStyle='#ffe5a0';c.fill();
  c.lineWidth=1.8;c.strokeStyle='#ffffff';c.stroke();
}

function updateHud(s){
  const near=nearObject(s), prompt=s.el.querySelector('#scene-prompt');
  if(prompt){
    prompt.textContent=near?`${near.label} · ${near.type==='enemy'||near.type==='boss'?'Combattre':'Interagir'}`:'Explore le port, les ruelles et les marchés';
  }
  updateHudMiniMap(s);
  const action=s.el.querySelector('#scene-interact');
  if(action)action.innerHTML=near?(near.type==='enemy'||near.type==='boss'?'⚔️<span>Défier</span>':'✨<span>Parler</span>'):'✨<span>Action</span>';
}
function openDialog(s,title,body,choices=[]){
  s.dialog=true;
  const box=s.el.querySelector('#scene-dialog');if(!box)return;
  box.hidden=false;
  const htmlSafe=v=>String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  box.innerHTML=`<div class="dialog-panel"><div class="dialog-icon">✦</div><h3>${htmlSafe(title)}</h3><p>${htmlSafe(body)}</p><div class="dialog-buttons"></div></div>`;
  const options=box.querySelector('.dialog-buttons');
  for(const [label,fn] of choices){
    const b=document.createElement('button');b.type='button';b.className='btn secondary';b.textContent=label;
    b.addEventListener('click',()=>{closeDialog(s);fn();});options.appendChild(b);
  }
  const close=document.createElement('button');close.type='button';close.className='btn ghost';close.textContent='Fermer';close.addEventListener('click',()=>closeDialog(s));options.appendChild(close);
}
function closeDialog(s){s.dialog=false;const el=s.el.querySelector('#scene-dialog');if(el){el.hidden=true;el.innerHTML='';}}
function interact(s){
  if(s.dialog){closeDialog(s);return;}
  const o=nearObject(s);
  if(!o){s.hooks.toast('Approche-toi d’un personnage, d’un coffre ou du ponton.');return;}
  const h=s.hooks,g=s.game;
  if(o.type==='enemy'||o.type==='boss'){fightNear(s,o);return;}
  if(o.type==='chest'){
    const key=`${s.world.id}:${o.id}`;if(!g.sceneLoot)g.sceneLoot={};if(g.sceneLoot[key])return;
    g.sceneLoot[key]=true;
    const coins=o.coins??(o.id==='chest-east'?42:25);const potion=o.potions??(o.id==='chest-east'?2:1);
    g.gold+=coins;g.items.potion=(g.items.potion||0)+potion;
    h.commit(`Coffre découvert sur ${h.islandName()} : +${coins} pièces et ${potion} potion${potion>1?'s':''} !`);return;
  }
  if(o.type==='landmark'){
    if(!g.sceneDiscovered)g.sceneDiscovered={};
    const key=`${s.world.id}:${o.id}`;
    if(!g.sceneDiscovered[key]){
      g.sceneDiscovered[key]=true;
      g.gold+=10;
      g.journal=g.journal||[];
      g.journal.unshift({message:`Lieu découvert : ${o.label} (+10 pièces).`,time:new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})});
      g.journal=g.journal.slice(0,16);
      h.persist();h.toast(`✦ ${o.label} découvert ! +10 pièces`);
    }
    openDialog(s,`✦ ${o.label}`,o.description||'Un nouveau lieu se dévoile.');return;
  }
  if(o.type==='dock'){
    openDialog(s,'⚓ L’embarcadère','La mer s’étend devant toi. Tu peux naviguer vers les autres îles depuis la carte des mers.',[['Ouvrir la carte',h.openMap]]);return;
  }
  if(o.type==='statue'){
    openDialog(s,'🗿 La vieille stèle','« Les plus grandes légendes commencent par un premier pas. » Des traces anciennes marquent la pierre.');return;
  }
  if(o.id==='capitaine'){
    const count=g.kills?.[h.enemyKey()]||0;
    const quests=h.availableQuests();
    openDialog(s,'⚓ Mira, capitaine',`Bienvenue, ${g.name} ! Le village compte sur les explorateurs. Tu as remporté ${count} affrontement${count>1?'s':''} ici. Consulte le journal pour récupérer les récompenses de mission.`,[['Voir les quêtes',h.openQuests],['Observer les environs',()=>h.toast('Les coffres brillent dans les bois. Les ennemis rôdent loin des habitations.')]]);return;
  }
  if(o.id==='marchand'){
    openDialog(s,'🪙 Nilo, marchand','Besoin d’équipement ? Ouvre le comptoir pour acheter potions, toniques et sabre à Fuchsia.',[['Voir le comptoir',h.openStore]]);return;
  }
  if(o.id==='guide'){
    openDialog(s,'🧭 Iris, éclaireuse','Le vieux port est seulement le début ! La route traverse les dunes, puis rejoint le Bois des Lucioles. Au nord se dressent les falaises ; au sud, une source oubliée. Les symboles dorés signalent les sites à étudier.',[['Consulter les missions',h.openQuests]]);return;
  }
  if(o.id==='herboriste'){
    openDialog(s,'🌿 Lys, herboriste','Les racines de ce bois renferment des souvenirs. Continue vers le sud et trouve le sanctuaire aux pierres bleues. Mais prends garde aux pilleurs près des sentiers.',[['Voir mon journal',h.openQuests]]);return;
  }
  if(o.id==='vigie'){
    openDialog(s,'🔭 Eden, vigie','Le phare veille sur la pointe du Levant. Approche du belvédère et découvre la vue sur les routes maritimes. Une cache se trouve au-delà des falaises.');return;
  }
  if(o.id==='archiviste'){
    openDialog(s,'📜 Oren, archiviste','Les ruines de Veillebrume datent d’avant les premiers voyageurs. La tablette au sud du sanctuaire pourrait révéler ce que les anciens protégeaient.');return;
  }
  if(o.id==='pecheur'){
    openDialog(s,'🐟 Tao, pêcheur','Les eaux de la source des perles sont calmes. Certains prétendent qu’elles contiennent une trace de l’ancienne mer. Regarde les trois pierres près du bassin.');return;
  }
  if(o.id==='guerisseuse'){
    openDialog(s,'🌸 Sora, soigneuse','Les voyages fatiguent. Je peux te soigner et te rendre ton énergie. Le repos est gratuit à Fuchsia, et coûte 12 pièces ailleurs.',[['Me reposer',h.rest]]);return;
  }
}
function fightNear(s,o=null){
  if(s.dialog)return;
  const target=o||nearObject(s,2.5);
  if(!target||!['enemy','boss'].includes(target.type)){s.hooks.toast('Approche-toi d’un adversaire pour le défier.');return;}
  if(target.type==='boss'){
    if(s.game.level<3){s.hooks.toast('Niveau 3 nécessaire pour affronter le gardien.');return;}
    s.game.sceneOpponent=`${s.world.id}:${target.id}`;
    s.hooks.boss();return;
  }
  s.game.sceneOpponent=`${s.world.id}:${target.id}`;
  s.hooks.startFight(target.enemyKey||null);
}
// L'itinéraire tient compte de l'eau et des obstacles. Un appui déplace réellement le héros.
function pathTo(s,endX,endY){
  const tx=Math.floor(endX),ty=Math.floor(endY),sx=Math.floor(s.x),sy=Math.floor(s.y);
  if(!canWalk(s,tx+.5,ty+.5))return null;
  const key=(x,y)=>`${x},${y}`;
  const nodes=[{x:sx,y:sy,g:0,f:Math.hypot(tx-sx,ty-sy)}],scores=new Map([[key(sx,sy),0]]),came=new Map(),closed=new Set();
  const dirs=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
  let iterations=0;
  while(nodes.length&&iterations++<MW*MH*4){
    nodes.sort((a,b)=>a.f-b.f);const node=nodes.shift(),id=key(node.x,node.y);
    if(closed.has(id))continue;
    if(node.x===tx&&node.y===ty){
      const path=[{x:tx+.5,y:ty+.5}];let prev=id;
      while(came.has(prev)){prev=came.get(prev);const [x,y]=prev.split(',').map(Number);path.unshift({x:x+.5,y:y+.5});}
      path.shift();return path;
    }
    closed.add(id);
    for(const [dx,dy] of dirs){
      const x=node.x+dx,y=node.y+dy,k=key(x,y);
      if(x<0||x>=MW||y<0||y>=MH||closed.has(k)||!canWalk(s,x+.5,y+.5))continue;
      if(dx&&dy&&(!canWalk(s,node.x+dx+.5,node.y+.5)||!canWalk(s,node.x+.5,node.y+dy+.5)))continue;
      const cost=node.g+(dx&&dy?Math.SQRT2:1);
      if(cost<(scores.get(k)??Infinity)){
        scores.set(k,cost);came.set(k,id);
        nodes.push({x,y,g:cost,f:cost+Math.hypot(tx-x,ty-y)});
      }
    }
  }
  return null;
}
function goToScreenPoint(s,x,y){
  const p=screenToWorld(s,x,y),route=pathTo(s,p.x,p.y);
  if(!route){s.hooks.toast('Impossible de rejoindre cet endroit : essaie un chemin accessible.');return;}
  s.route=route;s.destination=route.at(-1)||null;
  s.cameraFollow=true;
  if(route.length===0)s.destination=null;
}
function followRoute(s,dt){
  if(!s.route.length)return;
  const next=s.route[0],dx=next.x-s.x,dy=next.y-s.y,remaining=Math.hypot(dx,dy);
  if(remaining<.13){s.x=next.x;s.y=next.y;s.route.shift();if(!s.route.length)s.destination=null;return;}
  const step=Math.min(remaining,3.15*dt),nx=dx/remaining*step,ny=dy/remaining*step;
  const oldX=s.x,oldY=s.y;
  if(canWalk(s,s.x+nx,s.y))s.x+=nx;
  if(canWalk(s,s.x,s.y+ny))s.y+=ny;
  if(Math.hypot(s.x-oldX,s.y-oldY)<.001){s.route=[];s.destination=null;return;}
  s.direction=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');
  s.walking=true;
}
function viewportResize(s){
  const rect=s.canvas.getBoundingClientRect(), dpr=Math.min(window.devicePixelRatio||1,2);
  s.w=Math.max(260,rect.width);s.h=Math.max(250,rect.height);s.dpr=dpr;
  s.canvas.width=Math.round(s.w*dpr);s.canvas.height=Math.round(s.h*dpr);
  if(!s.zoomInitialized){s.zoom=s.w<530?.78:s.w<760?.94:1.07;s.zoomInitialized=true;}
  sceneCamera(s);updateZoomLabel(s);
}
function onKeys(e,s,pressed){
  const key=e.key.toLowerCase();
  if(['arrowup','arrowdown','arrowleft','arrowright',' ','w','a','s','d','z','q','e','f','escape'].includes(key)){
    if(document.activeElement?.tagName==='INPUT'||document.activeElement?.tagName==='TEXTAREA')return;
    e.preventDefault();
  }
  if(pressed){
    if(key==='e'&&!e.repeat){interact(s);return;}
    if((key==='f'||key===' ')&&!e.repeat){fightNear(s);return;}
    if(key==='escape'&&!e.repeat){closeDialog(s);return;}
    s.keys.add(key);
  }else s.keys.delete(key);
}
function setupControls(s){
  const stick=s.el.querySelector('#scene-stick'), knob=s.el.querySelector('#scene-knob');
  const moveStick=(e)=>{
    if(s.touchId!==e.pointerId)return;
    const r=stick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
    let dx=(e.clientX-cx)/(r.width*.33),dy=(e.clientY-cy)/(r.height*.33);
    const mag=Math.max(1,Math.hypot(dx,dy));dx/=mag;dy/=mag;
    s.stick={x:dx,y:dy};knob.style.transform=`translate(${dx*35}px,${dy*35}px)`;
  };
  s.listen(stick,'pointerdown',e=>{e.preventDefault();s.touchId=e.pointerId;stick.setPointerCapture(e.pointerId);moveStick(e);});
  s.listen(stick,'pointermove',e=>{e.preventDefault();moveStick(e);});
  const stop=e=>{if(s.touchId!==e.pointerId)return;s.touchId=null;s.stick={x:0,y:0};knob.style.transform='translate(0px,0px)';};
  s.listen(stick,'pointerup',stop);s.listen(stick,'pointercancel',stop);s.listen(stick,'lostpointercapture',stop);
  s.listen(s.el.querySelector('#scene-interact'),'click',()=>interact(s));
  s.listen(s.el.querySelector('#scene-attack'),'click',()=>fightNear(s));
  s.listen(s.el.querySelector('#scene-map'),'click',s.hooks.openMap);
  s.listen(s.el.querySelector('#scene-quests'),'click',s.hooks.openQuests);
  s.listen(s.el.querySelector('#scene-bag'),'click',s.hooks.openBag);
  s.listen(s.el.querySelector('#scene-fullscreen'),'click',()=>{
    s.hooks.fullScreen?.();
  });
  s.listen(s.el.querySelector('#scene-regions'),'click',()=>{
    const discovered=Object.keys(s.game.sceneDiscovered||{}).filter(k=>k.startsWith('albe:')).length;
    openDialog(s,'🗺️ Les régions de Fuchsia',`Explore le Quais de Fuchsia, les Dunes de l’Est, les Falaises du Levant, le Bois des Lucioles, le Lagon des Perles et les Ruines de Veillebrume. Trois sites secrets permettent de terminer des quêtes. Découvertes : ${discovered}/3.`,[['Voir les quêtes',s.hooks.openQuests]]);
  });
  const local=e=>{const r=s.canvas.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};};
  // Tap = march, drag = move the camera; two fingers = pinch zoom and camera translation.
  s.listen(s.canvas,'pointerdown',e=>{
    if(e.button!==0&&e.pointerType==='mouse')return;
    e.preventDefault();const p=local(e);
    s.canvas.setPointerCapture(e.pointerId);
    s.pointers.set(e.pointerId,{...p,startX:p.x,startY:p.y,startTime:performance.now(),moved:false});
    if(s.pointers.size>1){s.multiGesture=true;s.pointers.forEach(pt=>pt.moved=true);}
  });
  s.listen(s.canvas,'pointermove',e=>{
    const pt=s.pointers.get(e.pointerId);if(!pt)return;e.preventDefault();
    const p=local(e),oldX=pt.x,oldY=pt.y;
    if(Math.hypot(p.x-pt.startX,p.y-pt.startY)>9)pt.moved=true;
    if(s.pointers.size===1){
      if(pt.moved)panCamera(s,p.x-oldX,p.y-oldY);
      pt.x=p.x;pt.y=p.y;return;
    }
    const others=[...s.pointers.entries()].filter(([id])=>id!==e.pointerId);
    if(others.length){
      const other=others[0][1];
      const oldMid={x:(pt.x+other.x)/2,y:(pt.y+other.y)/2};
      const newMid={x:(p.x+other.x)/2,y:(p.y+other.y)/2};
      const d0=Math.hypot(pt.x-other.x,pt.y-other.y),d1=Math.hypot(p.x-other.x,p.y-other.y);
      if(d0>8&&d1>8)setZoom(s,s.zoom*d1/d0,newMid.x,newMid.y);
      panCamera(s,newMid.x-oldMid.x,newMid.y-oldMid.y);
    }
    pt.x=p.x;pt.y=p.y;
  });
  const release=e=>{
    const pt=s.pointers.get(e.pointerId);if(!pt)return;
    if(e.type!=='pointercancel'&&!pt.moved&&!s.multiGesture&&!s.dialog&&performance.now()-pt.startTime<600){
      goToScreenPoint(s,pt.x,pt.y);
    }
    s.pointers.delete(e.pointerId);
    if(s.pointers.size===0)s.multiGesture=false;
  };
  s.listen(s.canvas,'pointerup',release);s.listen(s.canvas,'pointercancel',release);
  s.listen(s.canvas,'wheel',e=>{
    e.preventDefault();const p=local(e);
    setZoom(s,s.zoom*(e.deltaY>0?.89:1.12),p.x,p.y);
  });
  s.listen(s.el.querySelector('#scene-recenter'),'click',()=>{s.cameraFollow=true;s.route=[];s.destination=null;});
  s.listen(s.el.querySelector('#scene-zoom-in'),'click',()=>setZoom(s,s.zoom*1.22));
  s.listen(s.el.querySelector('#scene-zoom-out'),'click',()=>setZoom(s,s.zoom/1.22));
  s.listen(document,'keydown',e=>onKeys(e,s,true));s.listen(document,'keyup',e=>onKeys(e,s,false));
  s.listen(window,'blur',()=>{s.keys.clear();s.stick={x:0,y:0};});
  s.listen(window,'pagehide',()=>savePosition(s));
  s.listen(window,'resize',()=>viewportResize(s));
}
function mount(config){
  unmount();
  const el=document.getElementById('scene-root'),canvas=document.getElementById('scene-canvas');
  if(!el||!canvas)return;
  const pos=scenePosition(config.state);
  const view=lastView?.island===config.state.island?lastView:null;
  const s={el,canvas,ctx:canvas.getContext('2d',{alpha:false}),world:makeWorld(config.state.island),game:config.state,hooks:config,
    x:pos.x,y:pos.y,clock:0,last:0,lastDraw:0,lastSave:0,lastHud:0,walking:false,direction:'down',zoom:view?.zoom||1,w:0,h:0,dpr:1,
    touchId:null,stick:{x:0,y:0},keys:new Set(),dialog:false,cleanup:[],raf:0,
    cameraX:view?.cameraX||0,cameraY:view?.cameraY||0,cameraFollow:view?.cameraFollow??true,zoomInitialized:!!view,pointers:new Map(),multiGesture:false,route:[],destination:null,chunkCache:new Map(),lastZoneId:null};
  s.listen=(node,event,fn)=>{node?.addEventListener(event,fn,{passive:false});s.cleanup.push(()=>node?.removeEventListener(event,fn));};
  session=s;
  viewportResize(s);setupControls(s);
  // Le sol sera construit en tuiles visibles à la demande pour limiter la mémoire mobile.
  updateHud(s);
  const tick=(ts)=>{
    if(session!==s)return;
    if(s.lastDraw && ts-s.lastDraw<32){s.raf=requestAnimationFrame(tick);return;}
    s.lastDraw=ts;
    const dt=s.last?clamp((ts-s.last)/1000,0,.05):.016;s.last=ts;s.clock+=dt;
    s.walking=false;
    if(!s.dialog){
      const k=s.keys;
      const vx=(k.has('d')||k.has('arrowright')?1:0)-(k.has('a')||k.has('q')||k.has('arrowleft')?1:0)+s.stick.x;
      const vy=(k.has('s')||k.has('arrowdown')?1:0)-(k.has('w')||k.has('z')||k.has('arrowup')?1:0)+s.stick.y;
      if(Math.hypot(vx,vy)>.08){
        s.route=[];s.destination=null;s.cameraFollow=true;
        move(s,vx+vy*ISO_X/ISO_Y,-vx+vy*ISO_X/ISO_Y,dt);
      }else followRoute(s,dt);
    }
    if(s.world.id==='albe'){
      const z=zoneAt(s.x,s.y);
      if(s.lastZoneId!==z.id){
        if(s.lastZoneId && !s.game.sceneZones?.[z.id])s.hooks.toast(`📍 ${z.name} — nouvelle région !`);
        s.lastZoneId=z.id;
        if(!s.game.sceneZones)s.game.sceneZones={};
        if(!s.game.sceneZones[z.id]){s.game.sceneZones[z.id]=true;savePosition(s);}
      }
    }
    renderScene(s);
    if(s.clock-s.lastHud>.25){updateHud(s);s.lastHud=s.clock;}
    if(s.clock-s.lastSave>2){savePosition(s);s.lastSave=s.clock;}
    s.raf=requestAnimationFrame(tick);
  };
  s.raf=requestAnimationFrame(tick);
}
function unmount(){
  const s=session;if(!s)return;
  session=null;
  cancelAnimationFrame(s.raf);
  lastView={island:s.world.id,zoom:s.zoom,cameraX:s.cameraX,cameraY:s.cameraY,cameraFollow:s.cameraFollow};
  savePosition(s);
  // Le mode immersif appartient à l'interface globale, pas à cette instance de la carte.
  s.cleanup.forEach(fn=>fn());
}
window.Roam={mount,unmount,resize:()=>{if(session)viewportResize(session);},
  capture:()=>{try{if(!session)return null;renderScene(session,true);const shot=session.canvas.toDataURL('image/jpeg',.78);renderScene(session,false);return shot;}catch{return null;}}};
})();

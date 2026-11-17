/* Chroniques des Mers V0.4.1 – combat tactique original sur grille isométrique. */
(()=>{
'use strict';
const GW=9,GH=7, OBSTACLES=new Set(['4,3','5,3','3,2','6,5']);
const fruitInfo=s=>window.ChroniquesFruits?.fruits?.find(f=>f.id===s.state.fruitId);
const masteryRank=s=>1+[3,8,15,25].filter(n=>(s.state.fruitUses||0)>=n).length;
const fruitSkill=(s,key)=>{const index=/^fruit([1-5])$/.exec(key)?.[1];return index?fruitInfo(s)?.techniques?.[Number(index)-1]:null;};
const isFruitKey=key=>/^fruit[1-5]$/.test(key);
const BUTTONS={ready:'Commencer le combat',move:'Déplacement libre',attack:'Coup simple',ressac:'Lame de ressac',impact:'Onde explosive',guard:'Se protéger',potion:'Boire une potion',pass:'Fin du tour',flee:'Fuir'};
let scene=null;
const xy=(x,y)=>`${x},${y}`;
const taxicab=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
// Combat camera: screen-space translation + zoom about the viewport center.
// The camera only changes the view: it never consumes tactical movement/actions.
const cameraAnchor=s=>({x:s.w/2,y:s.h/2});
function fromScreen(s,x,y){
  const a=cameraAnchor(s);
  return {x:a.x+(x-a.x-s.camera.x)/s.camera.zoom,y:a.y+(y-a.y-s.camera.y)/s.camera.zoom};
}
function setZoom(s,z,x=s.w/2,y=s.h/2){
  const a=cameraAnchor(s),before=fromScreen(s,x,y);
  s.camera.zoom=clamp(z,.65,3.8);
  // Keep the world point under the gesture at the same screen coordinate.
  s.camera.x=x-a.x-(before.x-a.x)*s.camera.zoom;
  s.camera.y=y-a.y-(before.y-a.y)*s.camera.zoom;
  updateCameraHUD(s);
}
function centerHero(s){
  const a=cameraAnchor(s),p=iso(s,s.grid.player.x,s.grid.player.y);
  s.camera.x=s.w/2-a.x-(p.x-a.x)*s.camera.zoom;
  s.camera.y=s.h*.48-a.y-(p.y-a.y)*s.camera.zoom;
  updateCameraHUD(s);
}
function updateCameraHUD(s){
  const out=s.root.querySelector('#tactic-zoom');
  if(out)out.textContent=`${Math.round(s.camera.zoom*100)} %`;
}

const r=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
function ensure(b,s){
  if(!b.grid||!Array.isArray(b.grid.foes)){
    const enemy=b.enemy,boss=!!enemy.boss;
    b.grid={round:1,phase:'preparation',player:{x:1,y:5},selection:'place',guard:false,cooldowns:{ressac:0,impact:0},
      foes:[{id:'foe1',x:7,y:2,hp:enemy.hp,maxHp:enemy.maxHp,atk:enemy.atk,def:enemy.def,name:enemy.name},
      ...(!boss?[{id:'foe2',x:7,y:4,hp:Math.max(10,Math.round(enemy.maxHp*.55)),maxHp:Math.max(10,Math.round(enemy.maxHp*.55)),atk:Math.max(3,Math.round(enemy.atk*.65)),def:Math.max(1,enemy.def-1),name:'Éclaireur ennemi'}]:[])],
      message:'Place ton héros sur une case bleue puis appuie sur Espace ou Prêt.',effect:null,walls:[],hazards:[],clouds:[],buffs:{},room:null};
  }
  const g=b.grid,limits=caps({state:s});
  g.walls ||= [];g.hazards ||= [];g.clouds ||= [];g.buffs ||= {};g.cooldowns ||= {ressac:0,impact:0};
  if(!g.phase)g.phase='combat';
  // Migration des anciennes rencontres en cours : aucune suppression de sauvegarde.
  if(!Number.isFinite(g.pa))g.pa=g.acted?0:limits.pa;
  if(!Number.isFinite(g.pm))g.pm=g.moved?0:limits.pm;
  g.pa=clamp(g.pa,0,limits.pa);g.pm=clamp(g.pm,0,limits.pm);
  if(!Number.isFinite(g.turnRemaining))g.turnRemaining=60; // 60 s d'essai ; durée à équilibrer.
  if(!['place','move','attack','ressac','impact',...Array.from({length:5},(_,i)=>`fruit${i+1}`)].includes(g.selection))g.selection='move';
  if(g.phase==='preparation')g.selection='place';
  return g;
}
function log(s,txt){const g=s.grid;g.message=txt;s.battle.history.unshift(txt);s.battle.history=s.battle.history.slice(0,7);s.config.persist();syncHUD(s);}
const live=s=>s.grid.foes.filter(f=>f.hp>0);
const occupied=(s,x,y)=>live(s).some(f=>f.x===x&&f.y===y);
const valid=(x,y,s=null)=>x>=0&&y>=0&&x<GW&&y<GH&&!OBSTACLES.has(xy(x,y))&&!(s?.grid.walls||[]).some(w=>w.x===x&&w.y===y);
function inArea(a,b,radius){return taxicab(a,b)<=radius;}
function viablePosition(s,x,y){return valid(x,y,s)&&!occupied(s,x,y)&&!(s.grid.player.x===x&&s.grid.player.y===y);}
function reachable(s){
  const start=s.grid.player,seen=new Map([[xy(start.x,start.y),0]]),front=[{...start,d:0}];
  for(let i=0;i<front.length;i++){
    const a=front[i];if(a.d>=s.grid.pm)continue;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const x=a.x+dx,y=a.y+dy,k=xy(x,y);
      if(!valid(x,y,s)||seen.has(k)||occupied(s,x,y))continue;
      seen.set(k,a.d+1);front.push({x,y,d:a.d+1});
    }
  }
  return seen;
}
const energyCost={ressac:9,impact:14};
const paCost={attack:2,ressac:3,impact:4,guard:2,potion:2};
const fruitPA=skill=>skill?Math.min(6,Math.max(2,skill.pa??([0,2,3,4,4,5][skill.rank]||3))):Infinity;
const actionPA=(s,key)=>isFruitKey(key)?fruitPA(fruitSkill(s,key)):(paCost[key]||0);
const BASE_PA=6,BASE_PM=3,MAX_PA=12,MAX_PM=6;
function caps(s){
  // Future equipment/race/class systems feed these optional aggregated modifiers.
  const mods=s.state.combatModifiers||{};
  return {pa:clamp(BASE_PA+(Number(mods.pa)||0),1,MAX_PA),pm:clamp(BASE_PM+(Number(mods.pm)||0),0,MAX_PM)};
}
function refreshSelection(s){
  const key=s.grid.selection;
  if(key!=='move'&&key!=='place'&&!canChoose(s,key)){s.grid.selection='move';s.preview=null;s.infoKey=null;s.infoFull=false;}
}

const range={attack:1,ressac:3,impact:4};
function prepAllowed(s,x,y){return x>=0&&x<=2&&y>=3&&y<=6&&valid(x,y,s)&&!occupied(s,x,y);}
function canChoose(s,key){
  const g=s.grid;
  if(g.phase==='preparation')return key==='ready'||key==='flee';
  if(key==='ready')return false;
  if(key==='pass'||key==='flee')return true;
  if(key==='move')return g.pm>0;
  if(g.pa<actionPA(s,key))return false;
  if(isFruitKey(key)){
    const skill=fruitSkill(s,key);
    if(!skill||masteryRank(s)<skill.rank)return false;
    if((g.cooldowns[key]||0)>0||s.state.energy<skill.energy)return false;
    if(fruitInfo(s)?.id==='F034'&&skill.rank>1&&skill.rank!==4&&(!g.room||g.room.turns<=0))return false;
    return true;
  }
  if(energyCost[key] && s.state.energy<energyCost[key])return false;
  if((g.cooldowns[key]||0)>0)return false;
  if(key==='guard'&&g.guard)return false;
  if(key==='potion'&&(!(s.state.items.potion>0)||s.state.hp>=s.state.hpMax))return false;
  return ['attack','ressac','impact','guard','potion'].includes(key);
}
function spendPA(s,key){s.grid.pa=Math.max(0,s.grid.pa-actionPA(s,key));}
function choose(s,key){
  if(key==='ready'){
    if(s.grid.phase==='preparation'){
      s.grid.phase='combat';s.grid.selection='move';s.grid.turnRemaining=60;
      log(s,'À toi ! Choisis une technique ou marche sur une case bleue.');
    }
    return;
  }
  if(s.grid.phase==='preparation'&&key!=='flee'){
    s.config.toast('Place ton héros puis appuie sur Prêt (Espace).');return;
  }
  if(key==='pass'){endTurn(s);return;}
  if((['attack','ressac','impact'].includes(key)||isFruitKey(key))&&s.grid.selection===key){
    s.grid.selection='move';s.preview=null;s.infoKey=null;s.infoFull=false;syncHUD(s);return;
  }
  if(key==='flee'){
    if(s.battle.enemy.boss){s.config.toast('Impossible de fuir ce gardien.');return;}
    if(Math.random()<.8){s.config.flee();return;}
    log(s,'La fuite échoue. Les adversaires avancent.');endTurn(s);return;
  }
  if(!canChoose(s,key)){s.config.toast('Action indisponible : PA, énergie, recharge ou maîtrise insuffisants.');return;}
  if(isFruitKey(key)){
    const skill=fruitSkill(s,key);
    if(skill.target==='self'){castFruit(s,key,s.grid.player,null);return;}
    s.grid.selection=key;s.preview=null;s.infoKey=null;s.infoFull=false;syncHUD(s);return;
  }
  if(key==='guard'){
    s.grid.guard=true;spendPA(s,key);s.state.energy=Math.min(s.state.energyMax,s.state.energy+5);
    refreshSelection(s);log(s,'Garde activée : dégâts réduits au prochain tour.');return;
  }
  if(key==='potion'){
    s.state.items.potion--;if(s.state.items.potion<=0)delete s.state.items.potion;
    const gain=Math.min(35,s.state.hpMax-s.state.hp);s.state.hp+=gain;spendPA(s,key);
    refreshSelection(s);log(s,`Potion utilisée : +${gain} PV.`);return;
  }
  s.grid.selection=key;s.preview=null;s.infoKey=null;s.infoFull=false;syncHUD(s);
}
function elementalHit(s,foe,mult=1,status=null,origin=null){
  if(!foe||foe.hp<=0)return 0;
  const attack=s.config.attack();const form=s.grid.buffs.form?.turns>0?s.grid.buffs.form.type:null;
  const boosted=form&&['leopard','bison','awakened','phoenix'].includes(form)?1.25:1;
  const dmg=Math.max(2,Math.round(attack*mult*boosted+r(-2,4)-foe.def*.55));
  foe.hp=Math.max(0,foe.hp-dmg);
  if(status){
    foe.status ||= {};
    if(['slow','root','blind','bleed','burn','expose','shock'].includes(status))foe.status[status]=Math.max(foe.status[status]||0,status==='burn'||status==='bleed'?3:2);
    if(status==='push'&&foe.hp>0){
      const from=origin||s.grid.player;const dx=Math.sign(foe.x-from.x),dy=Math.sign(foe.y-from.y);
      const nx=foe.x+(Math.abs(dx)>=Math.abs(dy)?dx:0),ny=foe.y+(Math.abs(dy)>Math.abs(dx)?dy:0);
      if((nx!==foe.x||ny!==foe.y)&&viablePosition(s,nx,ny)){foe.x=nx;foe.y=ny;}
    }
  }
  return dmg;
}
function castFruit(s,key,tile,foe){
  const g=s.grid,skill=fruitSkill(s,key),p=g.player;
  if(!skill||!canChoose(s,key)){s.config.toast('Pouvoir indisponible.');return;}
  const target=skill.target;
  if(target==='enemy'&&!foe){s.config.toast('Cette technique demande une cible ennemie.');return;}
  if(target==='tile'&&(!tile||!valid(tile.x,tile.y,s))){s.config.toast('Choisis une case libre et accessible.');return;}
  if(target!=='self'&&!tile){s.config.toast('Choisis une cible.');return;}
  let distance=target==='self'?0:taxicab(p,tile);
  if(distance>skill.range||(target!=='self'&&distance<1)){s.config.toast(`Portée : ${skill.range} case(s).`);return;}
  if(target==='tile'&&['move','wall','jumparea'].includes(skill.kind)&&!viablePosition(s,tile.x,tile.y)){
    s.config.toast('Cette case est occupée ou bloquée.');return;
  }
  if(fruitInfo(s)?.id==='F034'&&skill.rank>1&&skill.rank!==4&&distance>3){s.config.toast('La cible doit être dans ROOM.');return;}
  const kind=skill.kind, status=skill.status;let damage=0,extra='';
  const hit=f=>{damage+=elementalHit(s,f,skill.power||1,status,p);};
  const hitArea=(center,radius,scale=skill.power)=>{for(const f of live(s)){if(inArea(f,center,radius))damage+=elementalHit(s,f,scale,status,center);}};
  if(kind==='hit'){hit(foe);}
  else if(kind==='area'){hitArea(tile,skill.radius);}
  else if(kind==='line'){
    if(target==='enemy'&&p.x!==tile.x&&p.y!==tile.y){s.config.toast('Cette technique frappe en ligne droite.');return;}
    const dx=Math.sign(tile.x-p.x),dy=Math.sign(tile.y-p.y);
    for(let n=1;n<=skill.range;n++){
      const pos={x:p.x+dx*n,y:p.y+dy*n};if(!valid(pos.x,pos.y,s))break;
      for(const f of live(s))if(f.x===pos.x&&f.y===pos.y)hit(f);
    }
    if(target==='enemy'&&damage===0){s.config.toast('Ligne de tir bloquée.');return;}
  }
  else if(kind==='charge'){
    const spots=[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>({x:foe.x+dx,y:foe.y+dy})).filter(pos=>valid(pos.x,pos.y,s)&&!occupied(s,pos.x,pos.y));
    spots.sort((a,b)=>taxicab(a,p)-taxicab(b,p));
    if(!spots.length){s.config.toast('Aucune case libre près de la cible.');return;}
    g.player=spots[0];g.moved=true;hit(foe);
  }
  else if(kind==='move'){g.player={x:tile.x,y:tile.y};g.moved=true;extra='Déplacement spécial.';}
  else if(kind==='jumparea'){g.player={x:tile.x,y:tile.y};g.moved=true;hitArea(tile,skill.radius);}
  else if(kind==='wall'){
    let pos=[{x:tile.x,y:tile.y}];
    if(skill.radius)pos.push({x:tile.x+1,y:tile.y},{x:tile.x,y:tile.y+1});
    const added=pos.filter(v=>viablePosition(s,v.x,v.y));
    if(!added.length){s.config.toast('Impossible de placer la barrière ici.');return;}
    added.forEach(v=>{const prev=g.walls.find(w=>w.x===v.x&&w.y===v.y);if(prev)prev.turns=Math.max(prev.turns,skill.duration||2);else g.walls.push({...v,turns:skill.duration||2});});
    extra=`${added.length} obstacle(s) créé(s).`;
  }
  else if(kind==='hazard'||kind==='mine'){
    g.hazards.push({x:tile.x,y:tile.y,radius:skill.radius||0,turns:kind==='mine'?1:skill.duration||2,damage:Math.max(3,Math.round(s.config.attack()*(skill.power||1))),status:status||null,mine:kind==='mine'});
    extra=kind==='mine'?'Charge posée : explosion au prochain tour.':'Zone dangereuse posée.';
  }
  else if(kind==='cloud'){
    g.clouds.push({x:tile.x,y:tile.y,radius:skill.radius||1,turns:skill.duration||2});
    for(const f of live(s))if(inArea(f,tile,skill.radius||1)){f.status||={};f.status.blind=Math.max(f.status.blind||0,2);}
    extra='Nuage tactique : ennemis gênés.';
  }
  else if(kind==='swap'){
    // Single-player demo: Shambles exchanges the hero with one opponent inside ROOM.
    g.player={x:foe.x,y:foe.y};foe.x=p.x;foe.y=p.y;g.moved=true;extra='Échange de positions !';
  }
  else if(kind==='room'){g.room={turns:skill.duration||3};extra='ROOM activée : autres techniques disponibles.';}
  else if(kind==='form'){g.buffs.form={type:status,turns:skill.duration||3};extra='Transformation active !';}
  else if(kind==='shield'){
    const shield=status==='fortress'?3:skill.duration||2;
    g.buffs.armor=Math.max(g.buffs.armor||0,shield);
    if(['reflect','counter'].includes(status))g.buffs.reflect=Math.max(g.buffs.reflect||0,shield);
    if(status==='smoke')g.buffs.smoke=Math.max(g.buffs.smoke||0,shield);
    extra='Protection activée.';
  }
  else if(kind==='heal'){
    const healed=Math.min(s.state.hpMax-s.state.hp,skill.rank===5?40:22);
    s.state.hp+=healed;
    g.buffs.regen=Math.max(g.buffs.regen||0,skill.duration||0);
    extra=`+${healed} PV${g.buffs.regen?' et régénération':''}.`;
  }
  else {s.config.toast('Technique pas encore disponible.');return;}
  s.state.energy-=skill.energy;
  spendPA(s,key);g.cooldowns[key]=skill.cooldown;
  refreshSelection(s);g.effect={x:tile?.x??p.x,y:tile?.y??p.y,at:performance.now(),type:'fruit'};
  if(status==='fatigue')s.state.energy=Math.max(0,s.state.energy-4);
  s.state.will=Math.min(100,(s.state.will||0)+7);
  s.battle.enemy.hp=g.foes[0]?.hp||0;
  const leveled=s.config.masteryGain?.(1);
  const rankMsg=leveled?` ✨ Maîtrise rang ${leveled} débloquée !`:'';
  log(s,`🍎 ${skill.name}${damage?` : ${damage} dégâts`:''}${extra?' · '+extra:''}${rankMsg}`);
  if(live(s).length===0){s.config.win();return;}
}
function hitEnemy(s,foe,key){
  const g=s.grid,p=g.player;
  if(!foe||foe.hp<=0)return;
  if(taxicab(p,foe)>range[key]){s.config.toast('Cible trop éloignée : approche-toi ou change de technique.');return;}
  if(!canChoose(s,key)){s.config.toast('Technique indisponible.');return;}
  let total=0,hits=0,bonus=key==='impact'?1.35:key==='ressac'?1.65:1;
  const attack=s.config.attack();
  const targets=key==='impact'?live(s).filter(t=>taxicab(t,foe)<=1):[foe];
  targets.forEach(t=>{
    const damage=Math.max(2,Math.round(attack*bonus+r(-3,5)-t.def*.65));t.hp=Math.max(0,t.hp-damage);
    total+=damage;hits++;
  });
  if(energyCost[key])s.state.energy-=energyCost[key];
  spendPA(s,key);
  if(key==='ressac')g.cooldowns.ressac=2;
  if(key==='impact')g.cooldowns.impact=3;
  // Enchaînement immédiat tant que la technique reste lançable.
  refreshSelection(s);g.effect={x:foe.x,y:foe.y,at:performance.now(),type:key};
  s.state.will=Math.min(100,(s.state.will||0)+12);
  s.battle.enemy.hp=g.foes[0]?.hp||0;
  log(s,`${BUTTONS[key]} : ${total} dégâts${hits>1?' au total':''}${hits>1?` sur ${hits} ennemis`:''} · ${g.pa} PA / ${g.pm} PM restants.`);
  if(live(s).length===0){s.config.win();return;}
}
function handleTile(s,x,y){
  const g=s.grid;if(!valid(x,y))return;
  if(g.phase==='preparation'){
    if(!prepAllowed(s,x,y)){s.config.toast('Place ton personnage sur une case bleue de départ.');return;}
    g.player={x,y};
    log(s,'Placement confirmé. Tu peux le modifier ou appuyer sur Prêt.');
    return;
  }
  const target=live(s).find(f=>f.x===x&&f.y===y);
  if(g.selection==='move'){
    const cost=reachable(s).get(xy(x,y));
    if(target || (g.player.x===x&&g.player.y===y)||cost===undefined||cost<=0){
      s.config.toast('Choisis une case bleue accessible avec tes PM restants.');return;
    }
    g.player={x,y};g.pm-=cost;
    log(s,`Déplacement : −${cost} PM. ${g.pm} PM restant${g.pm>1?'s':''}.`);return;
  }

  if(isFruitKey(g.selection)){castFruit(s,g.selection,{x,y},target);return;}
  if(target)hitEnemy(s,target,g.selection);
  else s.config.toast('Touche une case occupée par un adversaire.');
}
function endTurn(s){
  const g=s.grid;
  if(g.phase==='preparation')return;
  const p=g.player;
  for(const f of live(s)){
    f.status ||= {};
    if((f.status.burn||0)>0||(f.status.bleed||0)>0){const n=(f.status.burn||0)>0?5:3;f.hp=Math.max(0,f.hp-n);}
    for(const [name,value] of Object.entries(f.status)){if(value>0)f.status[name]=value-1;}
  }
  for(const h of g.hazards){
    for(const f of live(s))if(inArea(f,h,h.radius)){f.hp=Math.max(0,f.hp-h.damage);if(h.status){f.status||={};f.status[h.status]=Math.max(2,f.status[h.status]||0);}}
    h.turns--;
  }
  g.hazards=g.hazards.filter(h=>h.turns>0);
  if(!live(s).length){s.config.win();return;}
  const foes=live(s);
  for(const f of foes){
    if(taxicab(p,f)>1&&!(f.status?.root>0||f.status?.slow>0)){
      const opts=[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>({x:f.x+dx,y:f.y+dy}));
      opts.sort((a,b)=>taxicab(a,p)-taxicab(b,p));
      const next=opts.find(o=>valid(o.x,o.y,s)&&!(o.x===p.x&&o.y===p.y)&&!live(s).some(other=>other!==f&&other.x===o.x&&other.y===o.y));
      if(next){f.x=next.x;f.y=next.y;}
    }
    if(taxicab(p,f)<=1){
      let dmg=Math.max(1,f.atk+r(-2,2)-Math.floor(s.config.defense()*.72));
      if(f.status?.blind>0||g.buffs.smoke>0||g.clouds.some(cl=>inArea(f,cl,cl.radius)))dmg=Math.max(1,Math.floor(dmg*.65));
      if((g.buffs.armor||0)>0)dmg=Math.max(1,Math.floor(dmg*.52));
      if(g.buffs.form?.turns>0&&['bison','awakened','phoenix'].includes(g.buffs.form.type))dmg=Math.max(1,Math.floor(dmg*.82));
      if(g.guard)dmg=Math.max(1,Math.floor(dmg*.35));
      s.state.hp=Math.max(0,s.state.hp-dmg);
      if(g.buffs.reflect>0){f.hp=Math.max(0,f.hp-Math.max(2,Math.floor(dmg*.6)));}
      if(s.state.hp===0){log(s,`${f.name} t'a vaincu.`);s.config.lose();return;}
      g.message=`${f.name} t'inflige ${dmg} dégâts. À toi de jouer !`;
    }else if(foes.length>0)g.message='Les adversaires avancent. À toi de jouer !';
  }
  if(!live(s).length){s.config.win();return;}
  if(g.buffs.regen>0||g.buffs.form?.turns>0&&['phoenix','axolotl'].includes(g.buffs.form.type))s.state.hp=Math.min(s.state.hpMax,s.state.hp+Math.max(3,Math.round(s.state.hpMax*.055)));
  g.walls.forEach(w=>w.turns--);g.walls=g.walls.filter(w=>w.turns>0);
  g.clouds.forEach(w=>w.turns--);g.clouds=g.clouds.filter(w=>w.turns>0);
  if(g.room?.turns>0)g.room.turns--;
  for(const [key,val] of Object.entries(g.buffs)){if(key==='form'){if(val?.turns>0)val.turns--;if(!val?.turns)delete g.buffs.form;}else if(Number.isInteger(val)&&val>0)g.buffs[key]--;}
  const limits=caps(s);g.round++;g.pa=limits.pa;g.pm=limits.pm;g.guard=false;g.selection='move';g.turnRemaining=60;s.preview=null;
  for(const key of Object.keys(g.cooldowns))if(g.cooldowns[key]>0)g.cooldowns[key]--;
  s.state.energy=Math.min(s.state.energyMax,s.state.energy+12);
  log(s,g.message);
}
function iso(s,x,y){return {x:s.w/2+(x-y)*s.hw,y:s.top+(x+y)*s.hh};}
function polygon(c,points,fill,stroke=null,lw=1){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke();}}
function ellipse(c,x,y,rx,ry,color){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=color;c.fill();}
function diamond(c,s,x,y,fill,stroke='#25465b',alpha=1){const p=iso(s,x,y);c.save();c.globalAlpha=alpha;polygon(c,[[p.x,p.y-s.hh],[p.x+s.hw,p.y],[p.x,p.y+s.hh],[p.x-s.hw,p.y]],fill,stroke,1.25);c.restore();}
function drawBackdrop(c,s,t){
  const w=s.w,h=s.h;
  const bg=c.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#0b203d');bg.addColorStop(.53,'#163855');bg.addColorStop(1,'#0e2237');c.fillStyle=bg;c.fillRect(0,0,w,h);
  // distant storm clouds and sea; decorative buildings are not interactive obstacles
  for(let i=0;i<6;i++){
    c.fillStyle=i%2?'#45647a36':'#93b8bc1a';
    ellipse(c,(i*153+43)%w,50+(i%3)*27,85,25,c.fillStyle);
  }
  const sea=c.createLinearGradient(0,90,0,290);sea.addColorStop(0,'#22658a');sea.addColorStop(1,'#0f345a');
  c.fillStyle=sea;c.fillRect(0,96,w,155);
  c.strokeStyle='#83bad68c';c.lineWidth=1.3;
  for(let j=0;j<16;j++){const y=108+j*9;const x=(j*83+Math.sin(t*.7+j)*12)%w;c.beginPath();c.moveTo(x,y);c.lineTo(x+20+(j%3)*7,y);c.stroke();}
  // harbor warehouse on the right, tall cliff on the left
  c.fillStyle='#172c40';polygon(c,[[w-106,146],[w-106,62],[w-17,62],[w-17,150]],'#273b4e');
  polygon(c,[[w-118,62],[w-75,15],[w+5,50],[w-17,75]],'#a05c53','#27384a',3);
  polygon(c,[[w-117,62],[w-77,24],[w-77,93]],'#b66c5d');
  for(let i=0;i<2;i++){c.fillStyle='#edb671';c.fillRect(w-86+i*35,83,17,25);c.fillStyle='#5c4042';c.fillRect(w-84+i*35,86,13,19);}
  polygon(c,[[0,158],[37,115],[65,139],[90,110],[124,148],[130,221],[0,229]],'#254c56');
  c.fillStyle='#d8be88';c.font='bold 12px Georgia, serif';c.fillText('⚓  LE PORT DES BRUMES',16,25);
}
function drawPerson(c,p,color,scale=1,enemy=false,t=0){
  c.save();c.translate(p.x,p.y);c.scale(scale,scale);
  ellipse(c,3,8,15,6,'#0616299a');
  c.fillStyle='#263344';c.strokeStyle='#152033';c.lineWidth=2;
  c.fillRect(-10,-6,8,20);c.fillRect(3,-6,8,20);
  c.fillStyle='#483b3f';c.fillRect(-12,11,11,6);c.fillRect(3,11,11,6);
  polygon(c,[[-17,-33],[16,-33],[17,4],[-17,4]],color,'#162339',2.5);
  polygon(c,[[-6,-30],[5,-30],[1,4],[-5,3]],enemy?'#e7ad8b':'#f4d2a1');
  c.fillStyle='#e6ae88';c.fillRect(-22,-28,8,21);c.fillRect(15,-28,8,21);
  ellipse(c,0,-43,18,19,enemy?'#ad8974':'#f0c5a2');
  polygon(c,[[-19,-51],[-12,-66],[2,-62],[16,-67],[21,-53],[10,-57],[-6,-55]],enemy?'#31313d':'#534251','#26303c',2);
  if(!enemy){ellipse(c,0,-63,28,6,'#dbb36b');ellipse(c,0,-70,15,11,'#c79654');c.fillStyle='#c64855';c.fillRect(-15,-65,30,4);}
  ellipse(c,-7,-44,2.2,3,'#203246');ellipse(c,7,-44,2.2,3,'#203246');
  c.restore();
}
function drawUnit(c,s,f,enemy,t){
  const p=iso(s,f.x,f.y);const breathe=Math.sin(t*3+f.x)*1.5;
  ellipse(c,p.x,p.y+3,s.hw*.58,s.hh*.4,enemy?'#ba465260':'#75bbd360');
  drawPerson(c,{x:p.x,y:p.y-4+breathe},enemy?'#923e4c':'#4ca5a1',Math.min(1,0.66+s.hw/75),enemy,t);
  const current=enemy?f.hp:s.state.hp,max=enemy?f.maxHp:s.state.hpMax;
  const bw=Math.max(33,s.hw*1.7),bx=p.x-bw/2,by=p.y-62;
  c.fillStyle='#10212e';c.fillRect(bx-1,by-1,bw+2,7);
  c.fillStyle=enemy?'#c96b64':'#6dc7a5';c.fillRect(bx,by,bw*clamp(current/max,0,1),5);
  c.font=`bold ${s.hw<23?10:12}px system-ui`;c.textAlign='center';c.fillStyle='#fff6da';c.shadowColor='#101b29';c.shadowBlur=5;c.fillText(enemy?(f.name.includes('Éclaireur')?'Éclaireur':s.battle.enemy.name):s.state.name,p.x,by-8);c.shadowBlur=0;
}
function paint(s,ts){
  const c=s.ctx,t=ts/1000;c.setTransform(s.dpr,0,0,s.dpr,0,0);c.clearRect(0,0,s.w,s.h);
  // Draw both the encounter backdrop and the tactical board in the same camera.
  // The base ocean tint fills exposed areas if zoomed out or panned far.
  c.fillStyle='#102d43';c.fillRect(0,0,s.w,s.h);
  const a=cameraAnchor(s);
  c.save();c.translate(a.x+s.camera.x,a.y+s.camera.y);
  c.scale(s.camera.zoom,s.camera.zoom);c.translate(-a.x,-a.y);
  if(s.backdrop?.complete&&s.backdrop.naturalWidth){
    const im=s.backdrop,scale=Math.max(s.w/im.naturalWidth,s.h/im.naturalHeight),dw=im.naturalWidth*scale,dh=im.naturalHeight*scale;
    c.drawImage(im,(s.w-dw)/2,(s.h-dh)/2,dw,dh);c.fillStyle='#061a2a7a';c.fillRect(0,0,s.w,s.h);
  }else drawBackdrop(c,s,t);
  const g=s.grid;
  // Combat HUD will be drawn after restoring the fixed screen transform.
  const preparing=g.phase==='preparation';
  const paths=!preparing&&g.selection==='move'&&g.pm>0?reachable(s):null;
  for(let layer=0;layer<GH+GW;layer++){
    for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){
      if(x+y!==layer)continue;
      const n=(x*17+y*11)%7;
      const barrier=g.walls?.some(w=>w.x===x&&w.y===y);
      const block=OBSTACLES.has(xy(x,y))||barrier;
      let base=block?'#496476':n%3===0?'#496d86':n%3===1?'#42627a':'#3b5970';
      let ring='#42647b',overlay=1;
      const distance=taxicab(g.player,{x,y});
      if(preparing&&prepAllowed(s,x,y)){base='#316b83';ring='#b3e8ff';}
      if(!preparing&&g.selection==='move'&&g.pm>0&&!block&&distance>0&&paths.has(xy(x,y))){base='#35799c';ring='#8bd2ef';}
      if(!preparing&&(['attack','ressac','impact'].includes(g.selection)||isFruitKey(g.selection))&&distance<=(isFruitKey(g.selection)?fruitSkill(s,g.selection)?.range??0:range[g.selection])){base='#944951';ring='#ffac9f';}
      const skill=isFruitKey(g.selection)?fruitSkill(s,g.selection):null;
      if(s.preview&&skill){
        const loc=s.preview,within=taxicab(loc,{x,y})<=(skill.radius||0);
        const wall=(skill.kind==='wall')&&(x===loc.x&&y===loc.y||skill.radius&&(x===loc.x+1&&y===loc.y||x===loc.x&&y===loc.y+1));
        if(wall){base='#79bcd7';ring='#e5f9ff';}
        else if(within&&['area','hazard','cloud','mine','jumparea'].includes(skill.kind)){base='#af6848';ring='#ffd4a1';}
      }
      const foe=live(s).find(f=>f.x===x&&f.y===y);
      if(foe){ring='#ffc386';base='#a36256';}
      diamond(c,s,x,y,base,ring,(s.backdrop && s.backdrop.complete && s.backdrop.naturalWidth) ? .74 : overlay);
      const p=iso(s,x,y);
      if(block){
        if(barrier){ellipse(c,p.x,p.y-s.hh*.2,s.hw*.42,s.hh*.72,'#e6f1fa99');}
        polygon(c,[[p.x-s.hw*.36,p.y-s.hh*.13],[p.x,p.y-s.hh*.55],[p.x+s.hw*.4,p.y-s.hh*.14],[p.x+s.hw*.36,p.y+s.hh*.16],[p.x,p.y+s.hh*.59],[p.x-s.hw*.38,p.y+s.hh*.15]],'#748d91','#233c51',1.5);
        ellipse(c,p.x,p.y-s.hh*.4,3,2,'#a2afb0');
      }else if((x+y)%6===0){ellipse(c,p.x,p.y,s.hw*.08,s.hh*.18,'#9ab6b43b');}
    }
  }
  for(const h of g.hazards){const q=iso(s,h.x,h.y);ellipse(c,q.x,q.y,Math.max(9,s.hw*.65),Math.max(5,s.hh*.7),'#e68d4b88');}
  for(const cl of g.clouds){const q=iso(s,cl.x,cl.y);ellipse(c,q.x,q.y,Math.max(15,s.hw*(cl.radius+1)),Math.max(12,s.hh*(cl.radius+1)),'#c6e4f044');}
  if(g.room?.turns>0){const q=iso(s,g.player.x,g.player.y);c.strokeStyle='#78daf4aa';c.lineWidth=2;c.beginPath();c.ellipse(q.x,q.y,90,52,0,0,Math.PI*2);c.stroke();}
  const all=[{x:g.player.x,y:g.player.y,isHero:true},...live(s).map(f=>({...f,isHero:false}))].sort((a,b)=>(a.x+a.y)-(b.x+b.y));
  for(const f of all)drawUnit(c,s,f,f.isHero?false:true,t);
  if(g.effect&&ts-g.effect.at<650){
    const p=iso(s,g.effect.x,g.effect.y),progress=(ts-g.effect.at)/650;
    c.save();c.globalAlpha=1-progress;c.strokeStyle=g.effect.type==='impact'?'#ffc77c':g.effect.type==='fruit'?'#c6aaff':'#8ff0f6';c.lineWidth=5-progress*3;
    c.beginPath();c.ellipse(p.x,p.y,13+35*progress,7+19*progress,0,0,Math.PI*2);c.stroke();c.restore();
  }
  c.restore();
  // La carte reste visible : aucune bannière centrale permanente.

}
const actions=['attack','ressac','impact','fruit1','fruit2','fruit3','fruit4','fruit5','guard','potion'];
const COST_DETAILS={attack:'Attaque au corps à corps.',ressac:'Frappe à distance sur un ennemi.',impact:'Attaque de zone : touche les ennemis autour de la cible.',guard:'Protège contre les prochaines attaques ennemies, +5 énergie.',potion:'Restaure jusqu’à 35 PV.'};
function description(s,key,full=false){
  const skill=fruitSkill(s,key),name=skill?.name||BUTTONS[key]||key;
  const cost=actionPA(s,key),energy=skill?.energy??energyCost[key]??0;
  const rng=skill?.target==='self'?'Soi':(skill?.range??range[key]??0);
  const cd=skill?.cooldown??(key==='ressac'?2:key==='impact'?3:0);
  const radius=skill?.radius||0;
  const info=skill?.design||COST_DETAILS[key]||'Technique de combat.';
  const damaging=skill&&['hit','area','line','charge','jumparea','hazard','mine'].includes(skill.kind)||['attack','ressac','impact'].includes(key);
  const mult=skill?.power??(key==='ressac'?1.65:key==='impact'?1.35:1);
  const foes=live(s);const defense=foes.length?foes[0].def:0;
  const low=Math.max(2,Math.round(s.config.attack()*mult-defense*.65-3));
  const high=Math.max(low,Math.round(s.config.attack()*mult-defense*.55+5));
  const damageText=damaging?`${low}–${high} estimés${skill?.kind==='hazard'||skill?.kind==='mine'?' / activation':''}`:'Aucun dégât direct';
  const stat=`<span><b>⚡ ${cost} PA</b></span><span>💧 ${energy} EN</span><span>🎯 ${rng} case${rng===1?'':'s'}</span>${cd?`<span>⌛ ${cd} tour(s)</span>`:''}`;
  const effects=skill?`${skill.kind==='wall'?'<p class="tactic-warning">⚠ Ce mur peut bloquer tes déplacements.</p>':''}<p class="tactic-effect">${info.replaceAll('&','&amp;').replaceAll('<','&lt;')}</p>${radius?`<p>Zone : rayon ${radius}</p>`:''}${skill.duration?`<p>Durée : ${skill.duration} tour(s)</p>`:''}`:`<p class="tactic-effect">${info}</p>`;
  const status=skill?.status?`<p>Effet supplémentaire : ${skill.status}</p>`:'';
  return `<div class="tactic-info-top"><strong>${name}</strong><span>${full?'FICHE DÉTAILLÉE':'APERÇU'}</span><button type="button" data-tactic-info-close aria-label="Fermer la fiche">×</button></div><div class="tactic-info-stats">${stat}</div><p>Dégâts : <b>${damageText}</b></p>${effects}${full?status:''}`;
}
function updateDetails(s){
  const panel=s.root.querySelector('#tactic-info');if(!panel)return;
  const key=s.infoKey||((['attack','ressac','impact'].includes(s.grid.selection)||isFruitKey(s.grid.selection))?s.grid.selection:null);
  const shown=!!key&&s.grid.phase==='combat';
  panel.hidden=!shown;
  if(shown){const html=description(s,key,!!s.infoFull);if(panel.innerHTML!==html)panel.innerHTML=html;panel.classList.toggle('expanded',!!s.infoFull);}
  s.root.classList.toggle('has-info',shown);
}
function syncHUD(s){
  if(scene!==s)return;const g=s.grid,q=s.root.querySelector.bind(s.root),limits=caps(s);
  refreshSelection(s);
  const status=q('#tactic-msg');if(status)status.textContent=g.message||'';
  const phase=q('#tactic-phase');if(phase)phase.textContent=g.phase==='preparation'?'🛡️ Placement':'⚔️ Combat';
  const round=q('#tactic-round');if(round)round.textContent=g.phase==='preparation'?'Préparation':`Tour ${g.round}`;
  const timer=q('#tactic-timer');if(timer){timer.textContent=g.phase==='preparation'?'⏳ —':`⏳ ${Math.ceil(g.turnRemaining)} s`;timer.classList.toggle('urgent',g.turnRemaining<11&&g.phase==='combat');}
  const hp=q('#tactic-hp');if(hp)hp.textContent=`❤️ ${s.state.hp}/${s.state.hpMax}`;
  const energy=q('#tactic-energy');if(energy)energy.textContent=`💧 ${s.state.energy}/${s.state.energyMax}`;
  const ap=q('#tactic-pa');if(ap)ap.textContent=`⚡ ${g.pa}/${limits.pa} PA`;
  const mp=q('#tactic-pm');if(mp)mp.textContent=`👟 ${g.pm}/${limits.pm} PM`;
  const enemy=q('#tactic-foes');if(enemy)enemy.textContent=`${live(s).length} ennemis`;
  const initiative=q('#tactic-initiative');if(initiative){
    const fo=live(s);const key=`${g.phase}:${g.round}:${fo.map(f=>`${f.id}:${f.hp}`).join(',')}`;
    if(initiative.dataset.sig!==key){initiative.dataset.sig=key;
      initiative.innerHTML=`<span class="initiative-hero" title="${s.state.name}">⚔️ <b>${s.state.name.slice(0,15)}</b></span>${fo.map(f=>`<span class="initiative-foe" title="${f.name}">☠ ${f.name.slice(0,16)} <small>${f.hp} PV</small></span>`).join('')}`;
    }
  }
  const mode=q('#tactic-mode');if(mode)mode.textContent=g.phase==='preparation'?'Déplacement de placement':g.selection==='move'?'Déplacement libre':`Technique ${g.selection} sélectionnée`;
  s.root.classList.toggle('is-preparing',g.phase==='preparation');
  for(const button of s.root.querySelectorAll('[data-tactic]')){
    const key=button.dataset.tactic;
    button.disabled=g.phase==='preparation'?!['ready','flee'].includes(key):(key==='ready'||(!['pass','flee'].includes(key)&&!canChoose(s,key)));
    button.hidden=key==='ready'?g.phase!=='preparation':key==='pass'?g.phase==='preparation':false;
    button.classList.toggle('selected',g.selection===key);
    if(['attack','ressac','impact'].includes(key)||isFruitKey(key))button.setAttribute('aria-pressed',String(g.selection===key));
    const note=button.querySelector('small');if(!note)continue;
    if(g.cooldowns[key]>0)note.textContent=`⌛ ${g.cooldowns[key]} tour(s)`;
    else if(key==='potion')note.textContent=`${actionPA(s,key)} PA · ×${s.state.items.potion||0}`;
    else if(isFruitKey(key)){
      const skill=fruitSkill(s,key);
      note.textContent=skill?.rank>masteryRank(s)?`Rang ${skill.rank} requis`:skill?`${actionPA(s,key)} PA · ${skill.energy} EN`:'À débloquer';
    }else if(key==='attack'||key==='ressac'||key==='impact'||key==='guard')note.textContent=`${actionPA(s,key)} PA${energyCost[key]?` · ${energyCost[key]} EN`:''}`;
  }
  updateDetails(s);
}
function resize(s){const r=s.canvas.getBoundingClientRect();
  const oldW=s.w||r.width,oldH=s.h||r.height;
  s.w=Math.max(r.width,250);s.h=Math.max(r.height,280);s.dpr=Math.min(window.devicePixelRatio||1,2);s.canvas.width=Math.round(s.w*s.dpr);s.canvas.height=Math.round(s.h*s.dpr);
  // Retain camera displacement proportionally when rotating the phone.
  if(s.camera&&oldW&&oldH){s.camera.x*=s.w/oldW;s.camera.y*=s.h/oldH;}
  s.hw=clamp((s.w-20)/(GW+GH)*.99,16.0,34);s.hh=s.hw*.55;s.top=clamp(s.h*.32,125,345);}
function screenTile(s,px,py){
  ({x:px,y:py}=fromScreen(s,px,py));
  // Project pointer to nearby diamond centers: exact diamond hit test protects against picking empty gaps.
  const xx=(px-s.w/2)/s.hw, yy=(py-s.top)/s.hh;
  const x0=(xx+yy)/2,y0=(yy-xx)/2;
  const candidates=[];
  for(let y=Math.floor(y0)-1;y<=Math.ceil(y0)+1;y++)for(let x=Math.floor(x0)-1;x<=Math.ceil(x0)+1;x++){
    if(x<0||y<0||x>=GW||y>=GH)continue;
    const p=iso(s,x,y);const metric=Math.abs(px-p.x)/s.hw+Math.abs(py-p.y)/s.hh;
    if(metric<=1.20)candidates.push({x,y,metric});
  }
  candidates.sort((a,b)=>a.metric-b.metric);return candidates[0];
}
function mount(config){
  unmount();const root=document.getElementById('tactical-root'),canvas=document.getElementById('tactical-canvas');if(!root||!canvas)return;
  const s={root,canvas,ctx:canvas.getContext('2d',{alpha:false}),state:config.state,battle:config.state.combat,config,cleanup:[],raf:0,dpr:1,backdrop:null,
    camera:{x:0,y:0,zoom:1},gesture:{points:new Map(),dragged:false,multi:false,pinch:null}};
  if(config.backdrop){s.backdrop=new Image();s.backdrop.src=config.backdrop;}
  if(!s.battle)return;s.grid=ensure(s.battle,s.state);scene=s;
  s.listen=(el,ev,fn,opts)=>{el.addEventListener(ev,fn,opts);s.cleanup.push(()=>el.removeEventListener(ev,fn,opts));};
  resize(s);s.listen(window,'resize',()=>resize(s));
  const point=e=>{const b=canvas.getBoundingClientRect();return {x:(e.clientX-b.left)*s.w/b.width,y:(e.clientY-b.top)*s.h/b.height};};
  const startPinch=()=>{
    const pts=[...s.gesture.points.values()],a=pts[0],b=pts[1];
    const cx=(a.x+b.x)/2,cy=(a.y+b.y)/2;
    s.gesture.pinch={distance:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y)),zoom:s.camera.zoom,anchor:fromScreen(s,cx,cy)};
    s.gesture.multi=true;s.gesture.dragged=true;
  };
  s.listen(canvas,'pointerdown',e=>{
    if(e.pointerType==='mouse'&&e.button!==0)return;
    e.preventDefault();try{canvas.setPointerCapture(e.pointerId);}catch(_){}
    const p=point(e),g=s.gesture;
    if(isFruitKey(s.grid.selection)&&e.pointerType!=='mouse')s.preview=screenTile(s,p.x,p.y)||null;
    g.points.set(e.pointerId,{...p,startX:p.x,startY:p.y,lastX:p.x,lastY:p.y});
    if(g.points.size===1){g.dragged=false;g.multi=false;g.pinch=null;}
    else if(g.points.size>=2)startPinch();
  });
  s.listen(canvas,'pointermove',e=>{
    const g=s.gesture,p=g.points.get(e.pointerId);
    if(!p){if(e.pointerType==='mouse'){const c=point(e),tile=screenTile(s,c.x,c.y);s.preview=tile||null;}return;}
    const pos=point(e);p.x=pos.x;p.y=pos.y;
    if(g.points.size>=2){
      if(!g.pinch)startPinch();
      const [a,b]=[...g.points.values()],cx=(a.x+b.x)/2,cy=(a.y+b.y)/2;
      const dist=Math.max(1,Math.hypot(a.x-b.x,a.y-b.y));
      const z=clamp(g.pinch.zoom*dist/g.pinch.distance,.65,3.8),anch=cameraAnchor(s);
      s.camera.zoom=z;
      s.camera.x=cx-anch.x-(g.pinch.anchor.x-anch.x)*z;
      s.camera.y=cy-anch.y-(g.pinch.anchor.y-anch.y)*z;
      updateCameraHUD(s);g.dragged=true;
    }else{
      // Tiny finger movements count as taps, not camera drags.
      if(!g.dragged&&Math.hypot(p.x-p.startX,p.y-p.startY)>9)g.dragged=true;
      if(g.dragged&&!g.multi){s.camera.x+=p.x-p.lastX;s.camera.y+=p.y-p.lastY;}
    }
    p.lastX=p.x;p.lastY=p.y;
    if(e.cancelable)e.preventDefault();
  });
  function finishPointer(e,cancel=false){
    const g=s.gesture,old=g.points.get(e.pointerId);if(!old)return;
    const coords=point(e);g.points.delete(e.pointerId);
    const tap=!cancel&&!g.dragged&&!g.multi&&g.points.size===0;
    if(g.points.size===1){
      // Rebase the remaining pointer so lifting one finger cannot trigger a tile.
      const q=[...g.points.values()][0];q.lastX=q.x;q.lastY=q.y;q.startX=q.x;q.startY=q.y;g.pinch=null;g.multi=true;
    }
    if(g.points.size===0){g.pinch=null;g.multi=false;g.dragged=false;if(!tap)s.preview=null;}
    if(tap&&scene===s){s.infoKey=null;s.infoFull=false;
      const world=fromScreen(s,coords.x,coords.y);
      const foe=live(s).find(f=>{const p=iso(s,f.x,f.y);return Math.abs(world.x-p.x)<Math.max(22,s.hw*.73)&&world.y>=p.y-72&&world.y<=p.y+12;});
      const t=foe||screenTile(s,coords.x,coords.y);if(t)handleTile(s,t.x,t.y);
    }
  }
  s.listen(canvas,'pointerup',e=>{if(e.cancelable)e.preventDefault();finishPointer(e);});
  s.listen(canvas,'pointercancel',e=>finishPointer(e,true));
  s.listen(canvas,'wheel',e=>{
    e.preventDefault();const p=point(e);
    setZoom(s,s.camera.zoom*Math.exp(-e.deltaY*.0011),p.x,p.y);
  },{passive:false});
  let longPress=null,ignoreClick=false;
  s.listen(root,'pointerdown',e=>{
    const btn=e.target.closest('[data-tactic]');if(!btn||btn.disabled||['ready','pass','flee'].includes(btn.dataset.tactic))return;
    if(e.pointerType==='mouse')return;
    const key=btn.dataset.tactic;
    longPress=setTimeout(()=>{if(scene!==s)return;s.infoKey=key;s.infoFull=true;ignoreClick=true;updateDetails(s);},550);
  });
  for(const name of ['pointerup','pointercancel','pointerleave'])s.listen(root,name,()=>{if(longPress){clearTimeout(longPress);longPress=null;}});
  s.listen(root,'pointerover',e=>{
    const btn=e.target.closest('[data-tactic]');if(!btn||e.pointerType!=='mouse'||['ready','pass','flee'].includes(btn.dataset.tactic))return;
    s.infoKey=btn.dataset.tactic;s.infoFull=true;updateDetails(s);
  });
  s.listen(root,'pointerout',e=>{
    const btn=e.target.closest('[data-tactic]');if(!btn||e.pointerType!=='mouse'||btn.contains(e.relatedTarget))return;
    s.infoKey=null;s.infoFull=false;updateDetails(s);
  });
  s.listen(root,'click',e=>{
    if(e.target.closest('[data-tactic-info-close]')){s.infoKey=null;s.infoFull=false;s.grid.selection='move';updateDetails(s);syncHUD(s);return;}
    const cam=e.target.closest('[data-tactic-camera]');
    if(cam){const k=cam.dataset.tacticCamera;
      if(k==='zoom-in')setZoom(s,s.camera.zoom*1.25);
      else if(k==='zoom-out')setZoom(s,s.camera.zoom/1.25);
      else if(k==='center')centerHero(s);
      return;
    }
    const b=e.target.closest('[data-tactic]');if(ignoreClick){ignoreClick=false;return;}if(b&&!b.disabled)choose(s,b.dataset.tactic);
  });
  updateCameraHUD(s);
  s.listen(document,'keydown',e=>{
    if(e.repeat||e.ctrlKey||e.metaKey||e.altKey)return;
    const focus=e.target;
    if(focus?.isContentEditable||['INPUT','TEXTAREA','SELECT'].includes(focus?.tagName)||focus?.closest?.('[role="dialog"]'))return;
    if(e.code==='Space'||e.key===' '){
      e.preventDefault();choose(s,s.grid.phase==='preparation'?'ready':'pass');return;
    }
    if(e.key==='Escape'){
      if(s.grid.selection!=='move'){s.grid.selection='move';s.infoKey=null;s.infoFull=false;syncHUD(s);}
      return;
    }
    const key=e.code?.startsWith('Numpad')?e.code.slice(6):e.code?.startsWith('Digit')?e.code.slice(5):null;
    if(key&&/^\d$/.test(key)){
      e.preventDefault();const n=key==='0'?9:Number(key)-1;
      const action=actions[n];if(action&&s.grid.phase==='combat')choose(s,action);
    }
  });
  const loop=ts=>{
    if(scene!==s)return;
    if(s.lastTick&&s.grid.phase==='combat'&&!document.hidden){
      s.grid.turnRemaining=Math.max(0,s.grid.turnRemaining-Math.min(.25,(ts-s.lastTick)/1000));
      if(s.grid.turnRemaining<=0){s.grid.turnRemaining=60;endTurn(s);}
    }
    s.lastTick=ts;
    if(!s.lastFrame||ts-s.lastFrame>33){paint(s,ts);s.lastFrame=ts;}
    if(!s.lastHUD||ts-s.lastHUD>210){syncHUD(s);s.lastHUD=ts;}
    s.raf=requestAnimationFrame(loop);
  };
  syncHUD(s);s.raf=requestAnimationFrame(loop);
}
function unmount(){if(!scene)return;cancelAnimationFrame(scene.raf);scene.cleanup.forEach(f=>f());scene=null;}
window.Tactics={mount,unmount,ensure};
})();

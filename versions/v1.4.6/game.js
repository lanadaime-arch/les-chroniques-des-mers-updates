(() => {
'use strict';

const SAVE_KEY = 'chroniques_mers_solo_v1'; // Conservation des anciennes sauvegardes pour migration
const PROFILES_KEY = 'chroniques_mers_profiles_v1';
const MAX_PROFILES = 4;
const ISLANDS = [
  {id:'albe', name:"Village de Fuchsia", sea:"East Blue · Île de l’Aube", icon:'⚓', level:1, cost:0, x:13, y:69, desc:"Le village natal de Luffy, sur l’Île de l’Aube, en East Blue.", enemy:'mousse', item:'wood'},
  {id:'epaves', name:'Crique des Épaves', sea:"Mer de l'Aube", icon:'🏝️', level:1, cost:12, x:30, y:37, desc:'Des coques oubliées et des trésors rejetés par les vagues.', enemy:'crab', item:'wood'},
  {id:'corail', name:'Lagon de Corail', sea:"Mer de l'Aube", icon:'🪸', level:2, cost:22, x:46, y:72, desc:'Une eau scintillante qui cache plus que des coquillages.', enemy:'raider', item:'coral'},
  {id:'brume', name:'Île des Brumes', sea:'Mer du Ponant', icon:'🌫️', level:3, cost:34, x:62, y:26, desc:'La brume y protège un ancien gardien.', enemy:'specter', item:'rune'},
  {id:'forge', name:'Atoll de la Forge', sea:'Mer du Ponant', icon:'🌋', level:4, cost:48, x:80, y:61, desc:'Les forges oubliées y façonnaient des lames mythiques.', enemy:'sentinel', item:'ore'},
  {id:'tempete', name:'Cap des Tempêtes', sea:'Mer du Ponant', icon:'⛈️', level:6, cost:62, x:91, y:27, desc:'Une mer sauvage, réservée aux navigateurs aguerris.', enemy:'captain', item:'ore'}
];
const ITEMS = {
  potion: {name:'Potion de soin', icon:'🧪', desc:'Rend 35 PV pendant un combat ou hors combat.'},
  tonic: {name:'Tonique marin', icon:'🫙', desc:'Rend 24 points d’énergie.'},
  wood: {name:'Bois flotté', icon:'🪵', desc:'Ressource récupérée sur les rivages.'},
  coral: {name:'Corail ancien', icon:'🪸', desc:'Un fragment rare des lagons.'},
  rune: {name:'Rune voilée', icon:'🔮', desc:'Une pierre imprégnée de mystère.'},
  ore: {name:'Minerai ardent', icon:'⛏️', desc:'Métal issu des anciennes forges.'},
  fruit: {name:'Perle des marées', icon:'🔮', desc:'Ancienne relique (pas un Fruit du Démon) : +3 attaque et +1 défense.'},
  blade: {name:"Lame de l'Aurore", icon:'🗡️', desc:'Une lame légendaire unique à votre partie. Bonus de +7 en attaque.'},
  sabre: {name:'Sabre de navigateur', icon:'⚔️', desc:'Arme achetée au comptoir. Bonus de +4 en attaque.'}
};
const ENEMIES = {
  mousse: {name:'Voleur des quais', icon:'🥷', hp:29, atk:7, def:2, xp:18, gold:13, drop:'wood'},
  crab: {name:'Crabe cuirassé', icon:'🦀', hp:38, atk:9, def:3, xp:26, gold:19, drop:'wood'},
  raider: {name:'Pilleur de récif', icon:'🏴‍☠️', hp:55, atk:12, def:4, xp:35, gold:27, drop:'coral'},
  specter: {name:'Sentinelle des brumes', icon:'👻', hp:69, atk:15, def:5, xp:44, gold:33, drop:'rune'},
  sentinel: {name:'Garde des forges', icon:'🛡️', hp:90, atk:18, def:7, xp:58, gold:41, drop:'ore'},
  captain: {name:'Capitaine des tempêtes', icon:'🧙', hp:118, atk:21, def:8, xp:73, gold:56, drop:'ore'},
  boss: {name:'Gardien du Phare', icon:'🗿', hp:133, atk:19, def:7, xp:150, gold:140, drop:'rune', boss:true}
};
const QUESTS = [
  {id:'quais', title:'Sécuriser les quais', island:'albe', desc:"Repousse deux voleurs qui menacent les pêcheurs du village.", type:'kills', key:'mousse', count:2, gold:36, xp:50},
  {id:'planche', title:'Les épaves racontent', island:'epaves', desc:'Récupère trois morceaux de bois flotté au cours de tes explorations.', type:'loot', key:'wood', count:3, gold:48, xp:60},
  {id:'lagon', title:'Horizon de corail', island:'corail', desc:'Découvre le Lagon de Corail et rapporte la nouvelle au journal de bord.', type:'visit', key:'corail', count:1, gold:58, xp:72},
  {id:'brume', title:'Le silence du phare', island:'brume', desc:'Défais le Gardien du Phare sur l’Île des Brumes.', type:'boss', key:'boss', count:1, gold:170, xp:140},
  {id:'belvedere', title:'Les yeux sur l’horizon', island:'albe', desc:'Explore les dunes et examine le Belvédère du Levant, près du phare.', type:'discover', key:'albe:vista-east', count:1, gold:62, xp:68},
  {id:'tablette', title:'L’écriture des anciens', island:'albe', desc:'Traverse le Bois des Lucioles puis étudie la tablette des Ruines de Veillebrume.', type:'discover', key:'albe:ruins-tablet', count:1, gold:80, xp:90},
  {id:'perles', title:'Le secret du lagon', island:'albe', desc:'Rejoins le Lagon des Perles et examine le bassin près de la source.', type:'discover', key:'albe:pearl-basin', count:1, gold:54, xp:64}
];
const NAV = [
  {id:'terrain', name:'Explorer', icon:'🏝️'},
  {id:'map', name:'Carte', icon:'🗺️'},
  {id:'adventure', name:'Aventure', icon:'⚔️'},
  {id:'quests', name:'Quêtes', icon:'📜'},
  {id:'bag', name:'Sac & profil', icon:'🎒'}
];
const FRUITS = window.ChroniquesFruits?.fruits || [];
const FREE_PILOTS = window.ChroniquesFruits?.pilotFree || [];
let dexType = 'all';
let dexStatus = 'all';
let dexSearch = '';
const fruitById = id => FRUITS.find(f => f.id === id);
const masteryLevel = uses => 1 + [3,8,15,25].filter(n => (Number(uses)||0) >= n).length;
const fruitPACost = skill => Math.min(6,Math.max(2,skill?.pa??([0,2,3,4,4,5][skill?.rank]||3)));
function playerFruit(){return fruitById(state?.fruitId);}
const JOBS = {bretteur:{name:'Bretteur',atk:3,def:0,energy:0,icon:'⚔️'},eclaireur:{name:'Éclaireur',atk:1,def:1,energy:8,icon:'🧭'},gardien:{name:'Gardien',atk:0,def:3,energy:0,icon:'🛡️'}};

let profiles = loadProfiles();
let selectedSlot = profiles.selected;
let state = profiles.slots[selectedSlot] || null;
let screenMode = 'lobby'; // Le jeu ne se lance plus avant le choix du personnage.
let creationSlot = selectedSlot;
let characterTab = 'stats';
let inventoryFilter = 'all';
let activeTab = state?.combat ? 'adventure' : 'terrain';
let overlayTab = null; // Les autres menus deviennent des panneaux superposés au monde.
let battleBackdrop = null; // Capture de la carte au moment du combat (temporaire, non sauvegardée).
// Réglage temporaire d'affichage : doit survivre aux re-rendus, mais pas être imposé aux autres parties.
let immersiveMode = false;
let toastHandle;
const app = document.getElementById('app');
const toastEl = document.getElementById('toast');

function escapeHTML(value){return String(value).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function number(n){return Math.round(Number(n)||0).toLocaleString('fr-FR');}
function randomInt(min,max){return Math.floor(Math.random()*(max-min+1))+min;}
function pick(arr){return arr[randomInt(0,arr.length-1)];}
function nextXP(level){return 35+level*24;}
function currentIsland(){return ISLANDS.find(i=>i.id===state.island)||ISLANDS[0];}
function statAttack(){return state.atk+(state.items.fruit?3:0)+(state.items.blade?7:state.items.sabre?4:0);}
function statDefense(){return state.def+(state.items.fruit?1:0);}
function maxEnergy(){return state.energyMax;}
function combatCaps(){const mods=state?.combatModifiers||{};return {pa:Math.max(1,Math.min(12,6+(Number(mods.pa)||0))),pm:Math.max(0,Math.min(6,3+(Number(mods.pm)||0)))};}
function migrateCombatResources(){
  if(!state)return;
  if(!state.combatRulesV12){
    // V1.1 initialized base energy at 50; V1.2 begins at 100 while preserving the existing save.
    if(Number.isFinite(state.energyMax)){state.energyMax+=50;state.energy=Math.min(state.energyMax,(Number(state.energy)||0)+50);}
    state.combatRulesV12=true;persist();
  }
}

function bar(value,max,kind){return `<div class="bar ${kind}"><i style="width:${Math.max(0,Math.min(100,Math.round(value/Math.max(1,max)*100)))}%"></i></div>`;}
function readSave(){try{const data=JSON.parse(localStorage.getItem(SAVE_KEY));return validSave(data)?data:null;}catch{return null;}}
function validSave(o){return !!(o&&o.version===1&&typeof o.name==='string'&&o.name.length<=36&&typeof o.level==='number'&&o.level>0&&o.level<999&&typeof o.gold==='number'&&o.items&&typeof o.items==='object'&&o.kills&&o.loot&&o.visits&&o.claimed&&typeof o.island==='string'&&Array.isArray(o.journal));}
function loadProfiles(){
  let data=null;
  try{data=JSON.parse(localStorage.getItem(PROFILES_KEY));}catch{}
  if(data&&data.schema===1&&Array.isArray(data.slots)){
    const slots=Array.from({length:MAX_PROFILES},(_,i)=>validSave(data.slots[i])?data.slots[i]:null);
    const selected=Number.isInteger(data.selected)&&data.selected>=0&&data.selected<MAX_PROFILES?data.selected:0;
    return {schema:1,slots,selected};
  }
  const old=readSave();
  const created={schema:1,slots:Array.from({length:MAX_PROFILES},(_,i)=>i===0?old:null),selected:0};
  // La partie V0.6 n'est jamais supprimée ni écrasée durant la migration.
  try{localStorage.setItem(PROFILES_KEY,JSON.stringify(created));}catch{}
  return created;
}
function storeProfiles(){try{localStorage.setItem(PROFILES_KEY,JSON.stringify(profiles));return true;}catch{notify('Sauvegarde locale inaccessible : exporte ta partie depuis Réglages.');return false;}}
function persist(){if(!state)return;profiles.slots[selectedSlot]=state;profiles.selected=selectedSlot;storeProfiles();}
function pickSlot(index){
  if(!Number.isInteger(index)||index<0||index>=MAX_PROFILES)return;
  persist();selectedSlot=index;profiles.selected=index;state=profiles.slots[index]||null;screenMode='lobby';overlayTab=null;storeProfiles();render();
}
function goLobby(){persist();overlayTab=null;battleBackdrop=null;screenMode='lobby';render();}
function enterGame(){
  if(!state){screenMode='create';creationSlot=selectedSlot;render();return;}
  migrateCombatResources();screenMode='game';characterTab='stats';overlayTab=null;activeTab=state.combat?'adventure':'terrain';render();
}
function record(message){state.journal.unshift({message,time:new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})});state.journal=state.journal.slice(0,16);}
function notify(message){toastEl.textContent=message;toastEl.classList.add('show');clearTimeout(toastHandle);toastHandle=setTimeout(()=>toastEl.classList.remove('show'),3200);}
function setImmersiveMode(value){
  immersiveMode=!!value;
  document.body.classList.toggle('game-expanded',immersiveMode);
  const frame=app.querySelector('.scene-window');
  if(frame)frame.classList.toggle('expanded',immersiveMode);
  const button=app.querySelector('#scene-fullscreen');
  if(button){button.textContent=immersiveMode?'⤓':'⛶';button.setAttribute('aria-label',immersiveMode?'Quitter la vue agrandie':'Agrandir la vue');}
  window.Roam?.resize?.();
}
function commit(message){if(message)record(message);persist();render();if(message)notify(message);}
function normalizeCaptainCustom(raw){
  return window.ChroniquesCaptainRig?.normalizeOptions(raw) || {
    ribbon:['origine','bleu','rouge','vert','violet'].includes(raw?.ribbon)?raw.ribbon:'origine',
    accessory:['aucun','boucle','lunettes','aviateur'].includes(raw?.accessory)?raw.accessory:'aucun'
  };
}
function readCaptainCustom(form){
  return normalizeCaptainCustom({ribbon:form.get('ribbon'),accessory:form.get('accessory')});
}
function captainArtPreview(look,mode,custom){
  return window.ChroniquesCaptainRig?.render(look,mode,custom) || avatarArt(look);
}
function createGame(name, faction, job, appearance, customization){
  const bonus=JOBS[job]||JOBS.bretteur;
  state={version:1,name:name.trim().slice(0,24),faction,job,appearance:['azur','flamme','brume'].includes(appearance)?appearance:'azur',customization:normalizeCaptainCustom(customization),level:1,xp:0,gold:55,hp:100,hpMax:100,energy:100+bonus.energy,energyMax:100+bonus.energy,combatRulesV12:true,will:0,atk:11+bonus.atk,def:3+bonus.def,island:'albe',visits:['albe'],kills:{},loot:{},claimed:{},items:{potion:3,tonic:1},journal:[],battlesWon:0,combat:null,found:{fruit:false,blade:false},fruitId:null,fruitUses:0};
  record(`Bienvenue à Village de Fuchsia, ${state.name}. Ton aventure commence.`);selectedSlot=creationSlot;profiles.selected=selectedSlot;profiles.slots[selectedSlot]=state;persist();overlayTab=null;screenMode='lobby';activeTab='terrain';render();notify('Personnage créé ! Appuie sur JOUER pour partir en mer.');
}
function eatDemoFruit(id){
  if(!state || state.combat){notify('Termine ton combat avant de choisir un fruit.');return;}
  if(state.fruitId){notify('Tu as déjà mangé un Fruit du Démon.');return;}
  if(!FREE_PILOTS.includes(id)){notify('Ce fruit appartient à un PNJ ou n’est pas encore jouable.');return;}
  const fruit=fruitById(id);if(!fruit)return;
  if(!confirm(`Manger ${fruit.name} ?\n\nCHOIX DÉFINITIF dans cette sauvegarde : un seul Fruit du Démon par personnage. Cette acquisition est offerte uniquement pour tester la démo V1.1.`))return;
  state.fruitId=id;state.fruitUses=0;
  characterTab='fruit';commit(`Tu as mangé le ${fruit.name} ! Son pouvoir s'éveille.`);
}
function increaseFruitMastery(n=1){
  if(!state?.fruitId)return null;
  const before=masteryLevel(state.fruitUses||0);
  state.fruitUses=Math.min(999999,(state.fruitUses||0)+n);
  const after=masteryLevel(state.fruitUses);
  if(after>before){record(`Maîtrise du ${playerFruit()?.name||'fruit'} : rang ${after} !`);}
  return after>before?after:null;
}
function fruitPanel(){
 const fruit=playerFruit();
 if(!fruit){
  return `<section class="fruit-lab"><div class="fruit-lab-banner"><span>🍎</span><div><h3>Découverte des Fruits du Démon</h3><p>Prototype V1.2 : choisis <strong>un seul</strong> des six fruits libres du lot pilote pour essayer ses techniques. Ce coffre est un dispositif de test, pas le système de trésors définitif.</p></div></div><p class="fruit-lab-warning">⚠️ Après l’avoir mangé, impossible d’en consommer un autre dans cette sauvegarde. Les fruits possédés par des PNJ restent verrouillés.</p><div class="fruit-choices">${FREE_PILOTS.map(id=>{const f=fruitById(id);return `<article class="fruit-choice"><div class="fruit-choice-type">${f.type} · ${f.subtype}</div><h4>🍎 ${escapeHTML(f.name)}</h4><p>${escapeHTML(f.power)}</p><button type="button" class="btn tiny" data-eat-fruit="${f.id}">Manger ce fruit</button></article>`;}).join('')}</div><p class="char-tip">Les six autres fruits pilotes sont déjà documentés, mais leurs détenteurs demeurent dans le monde. Leurs pouvoirs ne sont pas distribués gratuitement.</p></section>`;
 }
 const lvl=masteryLevel(state.fruitUses||0), thresholds=[0,3,8,15,25],next=thresholds[lvl]||null;
 return `<section class="fruit-lab"><div class="fruit-lab-banner"><span>🍎</span><div><small>${escapeHTML(fruit.type)} · ${escapeHTML(fruit.subtype)}</small><h3>${escapeHTML(fruit.name)}</h3><p>${escapeHTML(fruit.power)}</p></div></div><div class="fruit-level-row"><strong>Maîtrise : rang ${lvl}/5</strong><span>${next?`${state.fruitUses||0} / ${next} utilisations`:'Maîtrise maximale'}</span></div>${bar(next?state.fruitUses||0:1,next||1,'xp')}<p class="char-muted">Utilise tes pouvoirs en combat tactique pour débloquer de nouvelles techniques. Un fruit ne peut pas être remplacé.</p><div class="fruit-skills-list">${(fruit.techniques||[]).map(sk=>`<article class="${sk.rank<=lvl?'unlocked':'locked'}"><div><span class="fruit-skill-rank">${sk.rank}</span><strong>${escapeHTML(sk.name)}</strong><small>${escapeHTML(sk.design)}</small><small class="fruit-skill-cost">⚡ ${fruitPACost(sk)} PA · 💧 ${sk.energy} énergie · 🎯 ${sk.target==='self'?'soi':sk.range+' cases'}${sk.cooldown?` · ⌛ ${sk.cooldown} tour(s)`:''}</small></div><span class="fruit-skill-status">${sk.rank<=lvl?'Disponible':'À maîtriser'}</span></article>`).join('')}</div></section>`;
}
function dexResults(){
  const list=FRUITS.filter(f=>(dexType==='all'||f.type===dexType)&&(dexStatus==='all'||(dexStatus==='free'&&f.free)||(dexStatus==='held'&&!f.free))&&`${f.name} ${f.power} ${f.owner||''} ${f.referenceOwner} ${f.id==='F094'?'Ener Enel':''}`.toLowerCase().includes(dexSearch.toLowerCase()));
  return `<div class="dex-count">${list.length} fruit${list.length>1?'s':''} / 100 <span>· affectations proposées pour le scénario alternatif</span></div><div class="dex-grid">${list.map(f=>{const mine=state?.fruitId===f.id;const status=mine?'Mangé par ton personnage':f.free?'Libre au départ (proposé)':`Détenu par ${escapeHTML(f.owner||'un PNJ')}`;return `<article class="dex-card ${mine?'mine':''}"><div class="dex-card-top"><span class="dex-type">${escapeHTML(f.type)}${f.subtype==='Standard'?'':` · ${escapeHTML(f.subtype)}`}</span><span class="dex-icon">${f.free?'🍏':'🔒'}</span></div><h3>${escapeHTML(f.name)}</h3><p>${escapeHTML(f.power)}</p><div class="dex-state">${mine?'✅ ':f.free?'🧭 ':'👤 '}${status}</div>${f.pilot?`<div class="dex-pilot">${f.free?'✨ Techniques en démo':'🔬 Techniques préparées, fruit verrouillé'} · ${f.techniques.length} techniques</div>`:''}${f.techniques?`<details><summary>Voir les 5 techniques</summary><ul>${f.techniques.map(k=>`<li><b>Rang ${k.rank} · ${escapeHTML(k.name)}</b><small>${escapeHTML(k.design)}</small><small>⚡ ${fruitPACost(k)} PA · 💧 ${k.energy} énergie · 🎯 ${k.target==='self'?'soi':k.range+' cases'}</small></li>`).join('')}</ul></details>`:''}</article>`;}).join('')||'<div class="char-empty">Aucun fruit ne correspond à ta recherche.</div>'}</div>`;
}
function dexView(inGame=false){
 return `<div class="dex-page"><div class="dex-intro"><span class="eyebrow">🍎 Grand registre des Fruits du Démon</span><h2>L’Encyclopédie</h2><p>Les 100 fruits du projet, leurs pouvoirs et leurs détenteurs <b>proposés</b> pour notre futur alternatif. Les statuts ne deviennent définitifs qu’une fois les histoires validées.</p></div><div class="dex-controls"><input id="dex-search" type="search" autocomplete="off" placeholder="Chercher un fruit ou un détenteur…" value="${escapeHTML(dexSearch)}" aria-label="Rechercher un fruit"><div class="dex-filters">${[['all','Tous'],['Paramecia','Paramecia'],['Zoan','Zoan'],['Logia','Logia']].map(([k,v])=>`<button type="button" data-dex-type="${k}" class="${dexType===k?'selected':''}">${v}</button>`).join('')}</div><div class="dex-filters">${[['all','Tous les statuts'],['free','Libres'],['held','Détenus']].map(([k,v])=>`<button type="button" data-dex-status="${k}" class="${dexStatus===k?'selected':''}">${v}</button>`).join('')}</div></div><div id="dex-results">${dexResults()}</div>${!inGame?'<div class="dex-return"><button class="btn secondary" data-action="close-dex">← Retour aux personnages</button></div>':''}</div>`;
}
function refreshDex(){
 const content=app.querySelector('#dex-results');if(content)content.innerHTML=dexResults();
 app.querySelectorAll('[data-dex-type]').forEach(b=>b.classList.toggle('selected',b.dataset.dexType===dexType));
 app.querySelectorAll('[data-dex-status]').forEach(b=>b.classList.toggle('selected',b.dataset.dexStatus===dexStatus));
}
function gainXP(amount){
  state.xp+=amount;let levels=0;
  while(state.xp>=nextXP(state.level)){
    state.xp-=nextXP(state.level);state.level++;levels++;
    state.hpMax+=15;state.energyMax+=6;state.atk+=2;state.def+=1;
    state.hp=state.hpMax;state.energy=state.energyMax;
  }
  if(levels)record(`Niveau ${state.level} atteint ! PV, énergie et puissance améliorés.`);
  return levels;
}
function giveItem(key,amount=1){state.items[key]=(state.items[key]||0)+amount;}
function spendItem(key,amount=1){if((state.items[key]||0)<amount)return false;state.items[key]-=amount;if(state.items[key]===0)delete state.items[key];return true;}
function addLoot(key,n=1){giveItem(key,n);state.loot[key]=(state.loot[key]||0)+n;}
function questProgress(q){switch(q.type){case 'kills':return state.kills[q.key]||0;case 'loot':return state.loot[q.key]||0;case 'visit':return state.visits.includes(q.key)?1:0;case 'boss':return state.kills.boss||0;case 'discover':return state.sceneDiscovered?.[q.key]?1:0;default:return 0;}}
function followedQuest(){
  const pending=QUESTS.filter(q=>!state.claimed[q.id]);
  if(!pending.length)return null;
  // Safe fallback for all old saves, which do not contain trackedQuestId.
  return pending.find(q=>q.id===state.trackedQuestId)
    || pending.find(q=>questProgress(q)>=q.count)
    || pending.find(q=>q.island===state.island)
    || pending[0];
}
function questTracker(){
  const quest=followedQuest();
  if(!quest)return '<button type="button" class="hud-quest-track" data-tab="quests"><span>📜 Toutes les quêtes terminées !</span></button>';
  const progress=Math.max(0,Math.min(quest.count,questProgress(quest)));
  const ready=progress>=quest.count;
  return `<button type="button" class="hud-quest-track ${ready?'is-ready':''}" data-tab="quests" aria-label="Ouvrir les quêtes. ${escapeHTML(quest.title)}, ${progress} sur ${quest.count}">
    <span class="hud-quest-label">📜 ${ready?'Récompense disponible':'Quête suivie'}</span>
    <strong>${escapeHTML(quest.title)}</strong><small>${progress} / ${quest.count} ${ready?'· À récupérer':''}</small>
  </button>`;
}
function travel(id){
  if(state.combat){notify('Termine ton combat avant de lever les voiles.');return;}
  const dest=ISLANDS.find(i=>i.id===id);if(!dest)return;
  if(dest.id===state.island){overlayTab=null;activeTab='terrain';render();return;}
  if(state.level<dest.level){notify(`Il faut atteindre le niveau ${dest.level}.`);return;}
  if(state.gold<dest.cost){notify(`Il te manque ${dest.cost-state.gold} pièces pour voyager.`);return;}
  state.gold-=dest.cost;state.island=dest.id;
  if(!state.visits.includes(dest.id))state.visits.push(dest.id);
  state.energy=Math.min(state.energyMax,state.energy+5);overlayTab=null;activeTab='terrain';commit(`Cap sur ${dest.name} ! Voyage : ${dest.cost} pièces.`);
}
function newBattle(key){
  battleBackdrop=window.Roam?.capture?.()||null;
  overlayTab=null;
  const template=ENEMIES[key];const increase=Math.max(0,state.level-1);
  const enemy={key,name:template.name,icon:template.icon,maxHp:template.hp+increase*5,hp:template.hp+increase*5,atk:template.atk+Math.floor(increase*.75),def:template.def,exp:template.xp,gold:template.gold,drop:template.drop,boss:!!template.boss};
  state.combat={enemy,techCooldown:0,guard:false,history:[`Un ${enemy.name.toLowerCase()} surgit devant toi !`]};
  activeTab='adventure';commit(`Un adversaire apparaît : ${enemy.name}.`);
}
function explore(){
  if(state.combat){overlayTab=null;activeTab='adventure';render();return;}
  if(state.energy<3){notify('Pas assez d’énergie : repose-toi ou utilise un tonique.');return;}
  state.energy-=3;
  const island=currentIsland();const roll=Math.random();
  if(roll<.55){newBattle(island.enemy);return;}
  if(roll<.78){let n=Math.random()<.22?2:1;addLoot(island.item,n);commit(`Exploration : ${n} × ${ITEMS[island.item].name} trouvé${n>1?'s':''} !`);return;}
  if(roll<.92){let found=randomInt(9,22)+island.level*2;state.gold+=found;commit(`Un coffre abandonné contient ${found} pièces !`);return;}
  if(island.level>=3&&!state.found.fruit&&Math.random()<.30){state.found.fruit=true;giveItem('fruit');commit('Découverte exceptionnelle : la Perle des marées, relique unique dans cette partie !');return;}
  const stories=['Une vieille carte mentionne un archipel oublié.','Tu aperçois une voile à l’horizon, puis elle disparaît.','Le vent emporte le chant des marins du passé.','Des traces indiquent qu’un explorateur est passé avant toi.'];
  commit(pick(stories));
}
function fight(action){
  if(!state.combat)return;
  const battle=state.combat;const enemy=battle.enemy;
  if(action==='flee'){
    if(enemy.boss){notify('Impossible de fuir le gardien.');return;}
    if(Math.random()<.72){state.combat=null;battleBackdrop=null;state.sceneOpponent=null;state.will=0;activeTab='terrain';commit('Tu réussis à battre en retraite.');return;}
    battle.history.unshift('Impossible de fuir !');
  }else if(action==='attack'){
    let hit=Math.max(2,statAttack()+randomInt(-3,4)-Math.floor(enemy.def*.75));
    enemy.hp=Math.max(0,enemy.hp-hit);state.will=Math.min(100,state.will+14);
    battle.history.unshift(`Tu frappes : ${hit} dégâts infligés.`);
  }else if(action==='tech'){
    if(battle.techCooldown>0||state.energy<9){notify('Technique indisponible : énergie ou recharge insuffisante.');return;}
    state.energy-=9;let hit=Math.max(5,Math.round(statAttack()*1.7)+randomInt(0,6)-enemy.def);
    enemy.hp=Math.max(0,enemy.hp-hit);battle.techCooldown=3;state.will=Math.min(100,state.will+20);
    battle.history.unshift(`Frappe du ressac : ${hit} dégâts !`);
  }else if(action==='will'){
    if(state.will<45){notify('Ta Volonté doit atteindre 45.');return;}
    state.will-=45;let hit=Math.max(5,Math.round(statAttack()*2.25)+randomInt(0,6)-enemy.def);
    enemy.hp=Math.max(0,enemy.hp-hit);
    battle.history.unshift(`Élan de Volonté : ${hit} dégâts !`);
  }else if(action==='guard'){
    battle.guard=true;state.energy=Math.min(maxEnergy(),state.energy+6);state.will=Math.min(100,state.will+12);
    battle.history.unshift('Tu te protèges et reprends ton souffle.');
  }else if(action==='potion'){
    if(state.hp>=state.hpMax){notify('Tes PV sont déjà au maximum.');return;}
    if(!spendItem('potion')){notify('Plus de potions !');return;}
    let healed=Math.min(35,state.hpMax-state.hp);state.hp+=healed;battle.history.unshift(`Potion utilisée : +${healed} PV.`);
  }else return;
  if(enemy.hp<=0){winBattle();return;}
  let damage=Math.max(1,enemy.atk+randomInt(-2,3)-Math.floor(statDefense()*.7));
  if(battle.guard){damage=Math.max(1,Math.ceil(damage*.3));battle.guard=false;}
  state.hp=Math.max(0,state.hp-damage);
  battle.history.unshift(`${enemy.name} riposte : ${damage} dégâts reçus.`);
  battle.history=battle.history.slice(0,7);
  if(battle.techCooldown>0)battle.techCooldown--;
  if(state.hp<=0){loseBattle();return;}
  persist();render();
}
function winBattle(){
  const enemy=state.combat.enemy;state.combat=null;state.will=Math.min(100,state.will+8);
  battleBackdrop=null;
  if(state.sceneOpponent){state.sceneDefeated ||= {};state.sceneDefeated[state.sceneOpponent]=Date.now();state.sceneOpponent=null;}
  activeTab='terrain';
  state.gold+=enemy.gold;state.battlesWon++;state.kills[enemy.key]=(state.kills[enemy.key]||0)+1;
  let reward=`Victoire contre ${enemy.name} ! +${enemy.gold} pièces, +${enemy.exp} XP.`;
  if(Math.random()<.55){addLoot(enemy.drop);reward+=` Butin : ${ITEMS[enemy.drop].name}.`;}
  if(enemy.boss&&!state.found.blade){state.found.blade=true;giveItem('blade');reward+=' Tu obtiens la Lame de l’Aurore !';}
  gainXP(enemy.exp);commit(reward);
}
function loseBattle(){
  const lost=Math.min(state.gold,Math.ceil(state.gold*.15));state.gold-=lost;
  state.hp=Math.max(25,Math.ceil(state.hpMax*.45));state.energy=Math.max(10,Math.ceil(state.energyMax*.3));state.combat=null;state.will=0;
  battleBackdrop=null;state.sceneOpponent=null;state.island='albe';activeTab='terrain';commit(`Défaite : retour à Village de Fuchsia. ${lost} pièces perdues.`);
}
function rest(){
  if(state.combat)return;
  if(state.hp===state.hpMax&&state.energy===state.energyMax){notify('Tu es déjà en pleine forme.');return;}
  const cost=state.island==='albe'?0:12;
  if(state.gold<cost){notify('Il faut 12 pièces pour installer un campement.');return;}
  state.gold-=cost;state.hp=state.hpMax;state.energy=state.energyMax;
  commit(cost?'Campement terminé : PV et énergie restaurés.':'Repos au port : PV et énergie restaurés gratuitement.');
}
function usePotion(key){
  if(state.combat){notify('Utilise la potion depuis les actions de combat.');return;}
  const heal=key==='potion';const stat=heal?'hp':'energy';const max=heal?state.hpMax:state.energyMax;
  if(state[stat]>=max){notify('Cette jauge est déjà pleine.');return;}
  if(!spendItem(key)){notify('Objet indisponible.');return;}
  const amount=heal?35:24;state[stat]=Math.min(max,state[stat]+amount);
  commit(`${ITEMS[key].name} utilisé : ${heal?'PV':'énergie'} restaurés.`);
}
function buy(key){
  if(state.island!=='albe'){notify('Le comptoir se trouve à Port d’Albe.');return;}
  const prices={potion:18,tonic:22,sabre:85};const cost=prices[key];if(!cost)return;
  if(key==='sabre'&&state.items.sabre){notify('Tu possèdes déjà cette arme.');return;}
  if(state.gold<cost){notify(`Il te manque ${cost-state.gold} pièces.`);return;}
  state.gold-=cost;giveItem(key);commit(`Acheté : ${ITEMS[key].name}, pour ${cost} pièces.`);
}
function claimQuest(id){
  const quest=QUESTS.find(q=>q.id===id);if(!quest||state.claimed[id])return;
  if(questProgress(quest)<quest.count){notify('Cette quête n’est pas encore terminée.');return;}
  state.claimed[id]=true;state.gold+=quest.gold;gainXP(quest.xp);
  commit(`Quête terminée : « ${quest.title} ». +${quest.gold} pièces, +${quest.xp} XP.`);
}
function bossBattle(){
  if(state.island!=='brume'||state.level<3||state.combat)return;
  newBattle('boss');
}
function downloadSave(){
  const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`chroniques-mers-${state.name.toLowerCase().replace(/[^a-z0-9]/g,'-')||'partie'}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('Sauvegarde exportée. Garde ce fichier en lieu sûr.');
}
function importSave(file){
  if(!file||file.size>1_000_000){notify('Fichier trop volumineux.');return;}
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const data=JSON.parse(String(reader.result));
      if(!validSave(data)||!ISLANDS.some(i=>i.id===data.island))throw Error('Format invalide');
      const dest=screenMode==='game'?selectedSlot:(profiles.slots[selectedSlot]===null?selectedSlot:profiles.slots.findIndex(v=>v===null));
      if(dest<0){notify('Les 4 emplacements sont occupés : libère-en un pour importer.');return;}
      if(profiles.slots[dest]&&!confirm(`Remplacer le personnage « ${profiles.slots[dest].name} » par « ${data.name} » ?`))return;
      if(!profiles.slots[dest]&&!confirm(`Importer « ${data.name} » dans l’emplacement ${dest+1} ?`))return;
      selectedSlot=dest;profiles.selected=dest;state=data;profiles.slots[dest]=data;persist();overlayTab=null;battleBackdrop=null;screenMode='lobby';render();notify('Personnage importé avec succès.');
    }catch{notify('Cette sauvegarde est invalide ou incompatible.');}
  };
  reader.onerror=()=>notify('Lecture impossible du fichier.');reader.readAsText(file);
}
function resetGame(){
  if(!state)return;
  if(!confirm(`Supprimer définitivement « ${state.name} » de cet appareil ? Pense à exporter sa sauvegarde avant.`))return;
  window.Roam?.unmount();window.Tactics?.unmount();profiles.slots[selectedSlot]=null;
  const next=profiles.slots.findIndex(Boolean);selectedSlot=next>=0?next:0;
  profiles.selected=selectedSlot;state=profiles.slots[selectedSlot]||null;
  screenMode='lobby';overlayTab=null;battleBackdrop=null;storeProfiles();render();notify('Emplacement de personnage libéré.');
}

function avatarArt(look='azur'){
  const colors={azur:{hair:'#163f79',hairLight:'#508bd1',coat:'#17667d',coatDark:'#123e54'},flamme:{hair:'#9d4125',hairLight:'#ef9963',coat:'#803b3f',coatDark:'#512c3d'},brume:{hair:'#6b4a96',hairLight:'#b092da',coat:'#395d6f',coatDark:'#24384a'}};
  const c=colors[look]||colors.azur;
  return `<svg class="captain-portrait" viewBox="0 0 300 345" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Aventurier stylisé, dessin original">
  <defs><linearGradient id="cape-${look}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${c.coat}"/><stop offset="1" stop-color="${c.coatDark}"/></linearGradient><linearGradient id="hair-${look}" x1="0" y1="0" x2=".9" y2="1"><stop stop-color="${c.hairLight}"/><stop offset="1" stop-color="${c.hair}"/></linearGradient></defs>
  <ellipse cx="150" cy="329" rx="108" ry="12" fill="#031422" opacity=".45"/>
  <path d="M92 180Q43 197 35 309L75 323 111 238 96 330H207L194 234 233 325 266 305Q255 194 200 181Z" fill="url(#cape-${look})" stroke="#07192b" stroke-width="7" stroke-linejoin="round"/>
  <path d="M107 217L100 334H200L194 217Q160 235 150 252 136 236 107 217" fill="#e3d1a5" stroke="#0a2437" stroke-width="5"/>
  <path d="M135 238L121 326H177L164 237Z" fill="#f4f0e0"/><path d="M143 239L153 270 144 325H162L158 270 168 240" fill="#c45153"/>
  <path d="M95 220L117 249 105 325 67 322 73 238Z" fill="${c.coat}" stroke="#0e2739" stroke-width="5"/><path d="M204 220L182 249 196 324 232 320 225 237Z" fill="${c.coat}" stroke="#0e2739" stroke-width="5"/>
  <path d="M95 280L109 278 104 302 85 304M206 281L193 277 199 303 218 306" stroke="#e5ac62" stroke-width="8" stroke-linecap="round"/>
  <rect x="126" y="313" width="49" height="14" rx="5" fill="#9a6438" stroke="#e5b86e" stroke-width="4"/>
  <path d="M80 140Q74 45 147 41 226 41 222 148L236 226 194 204 113 202 64 227Z" fill="url(#hair-${look})" stroke="#14243b" stroke-width="7"/>
  <path d="M106 110Q120 85 151 84 186 83 205 113L200 178Q180 206 152 208 119 204 102 178Z" fill="#f1c49a" stroke="#583c4a" stroke-width="5"/>
  <path d="M101 116Q111 56 153 58 199 60 209 122L184 101 168 114 150 92 127 116 108 115Z" fill="url(#hair-${look})"/>
  <path d="M118 140L141 142M166 142L189 139" stroke="#273449" stroke-width="7" stroke-linecap="round"/><circle cx="130" cy="145" r="4" fill="#111c30"/><circle cx="178" cy="144" r="4" fill="#111c30"/>
  <path d="M150 148L147 161 156 161M138 180Q151 189 169 180" stroke="#a55f57" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M107 103L88 170 101 225 78 199 76 136ZM202 101L226 166 218 220 242 196 230 122Z" fill="url(#hair-${look})" stroke="#1c324b" stroke-width="4"/>
  <path d="M73 94Q152 50 227 92L216 70Q145 24 85 71Z" fill="#d9ab59" stroke="#3a3037" stroke-width="6"/><ellipse cx="148" cy="84" rx="103" ry="19" fill="#e7c16e" stroke="#5b4040" stroke-width="6"/><path d="M96 77Q150 55 204 78" stroke="#8e573a" stroke-width="8" fill="none"/>
  <path d="M233 292L248 186" stroke="#352e38" stroke-width="12" stroke-linecap="round"/>
  <path d="M248 186L255 154L264 185" stroke="#f2d29a" stroke-width="6" fill="#d9e6e4" stroke-linejoin="round"/>
  <path d="M231 209L267 217" stroke="#e1b56c" stroke-width="9" stroke-linecap="round"/>
  <circle cx="151" cy="282" r="4.5" fill="#be925b" stroke="#62493f" stroke-width="2"/>
  <circle cx="150" cy="304" r="4" fill="#be925b" stroke="#62493f" stroke-width="2"/>
  <path d="M94 248Q82 270 86 300M206 244Q225 263 217 295" fill="none" stroke="#fff5d44a" stroke-width="3"/>
  <path d="M83 324L98 282M216 323L200 282" stroke="#f0b86a" stroke-width="6"/>
  </svg>`;
}
function hasSlot(){return profiles.slots.some(Boolean);}
/* V1.3.6 — original, self-contained pirate UI icon family. */
function menuIcon(key){
 const shapes={
  home:'<path d="M3 11.3 12 4l9 7.3v9.1H14v-6h-4v6H3z" fill="#ddad57" stroke="#fff2c9" stroke-width="1.5"/><path d="m2 11 10-8 10 8" stroke="#75431f" stroke-width="2"/>',
  crew:'<circle cx="9" cy="7" r="3.2" fill="#f8d39a"/><circle cx="17" cy="9" r="2.8" fill="#bd8857"/><path d="M2 21c0-4.3 2.5-7 7-7s7 2.7 7 7M13 16c4-2 9 0 9 5" fill="#f0bb6a" stroke="#493120" stroke-width="1.5"/>',
  book:'<path d="M2.5 5Q7 3 12 6v14Q7 17 2.5 19zM21.5 5Q17 3 12 6v14q5-3 9.5-1z" fill="#f7d39a" stroke="#804c27" stroke-width="1.4"/><path d="M5.5 8 10 9M5.5 12 10 13M14 9l5-1M14 13l5-1" stroke="#a26c3e" stroke-width="1.2"/>',
  scroll:'<path d="M6 4h12v14H6c-2 0-3 3 0 3h13V6c0-2-3-3-4 0" fill="#f2cb8c" stroke="#75401e" stroke-width="1.5"/><path d="M9 8h6M9 11h6M9 14h5" stroke="#a66c38" stroke-width="1.5"/>',
  shop:'<path d="M4 11h16v10H4z" fill="#a4673a" stroke="#f5dca5" stroke-width="1.2"/><path d="M3 7h18l-2 6H5z" fill="#e4a85b" stroke="#513524" stroke-width="1.2"/><path d="M6 7 4.5 13H8l1-6zm7 0 .5 6H17l-1-6z" fill="#ed664a"/><path d="M10 15h4v6h-4z" fill="#18485b"/>',
  refresh:'<path d="M20 11a8 8 0 0 0-14-4L3 10M4 13a8 8 0 0 0 14 4l3-3" fill="none" stroke="#f5cb67" stroke-width="2.5" stroke-linecap="round"/><path d="M3 4v6h6M21 20v-6h-6" fill="none" stroke="#f5cb67" stroke-width="2.3"/>',
  helm:'<circle cx="12" cy="12" r="5.3" fill="none" stroke="#e8af53" stroke-width="2.3"/><circle cx="12" cy="12" r="1.4" fill="#fff2cd"/><path d="M12 1v22M1 12h22M4.2 4.2l15.6 15.6M19.8 4.2 4.2 19.8" stroke="#f6d28d" stroke-width="1.5"/><circle cx="12" cy="1.6" r="1.3" fill="#ecba6f"/><circle cx="22.4" cy="12" r="1.3" fill="#ecba6f"/><circle cx="12" cy="22.4" r="1.3" fill="#ecba6f"/><circle cx="1.6" cy="12" r="1.3" fill="#ecba6f"/>',
  anchor:'<circle cx="12" cy="4" r="2.3" fill="none" stroke="#efc683" stroke-width="1.6"/><path d="M12 6v14m-5-8h10M4 15c1 6 5 8 8 8s7-2 8-8l-4 2m4-2 2 3M4 15l-2 3" fill="none" stroke="#efc683" stroke-width="2" stroke-linejoin="round"/>',
  map:'<path d="M2 5 9 3l6 3 7-2v15l-7 2-6-3-7 2z" fill="#e1b677" stroke="#fce9b8" stroke-width="1.2"/><path d="M9 3v15M15 6v15" stroke="#754722" stroke-width="1.4"/><path d="M3.5 8 8 6l5 4 7-3v7l-7 3-4-5-5 1z" fill="#57b6a0" stroke="#26556a" stroke-width="1"/>',
  fruit:'<path d="M13 5Q20 4 21 10c1 5-3 11-9 11S2 16 3 10q2-6 9-5" fill="#8733a7" stroke="#f59aec" stroke-width="1.5"/><path d="M12 5q1-4 5-4M12 6C11 2 7 2 6 3" stroke="#a7df61" stroke-width="2" fill="none"/><path d="M7 10q3-4 6 0t5 0M6 15q3-4 6 0t5 0" fill="none" stroke="#d98dfa" stroke-width="1.2"/>',
  coins:'<ellipse cx="12" cy="8" rx="8" ry="3.5" fill="#ffe7a0" stroke="#8f5c24" stroke-width="1.6"/><path d="M4 8v9c0 2 4 4 8 4s8-2 8-4V8" fill="#e9b447" stroke="#8f5c24" stroke-width="1.6"/><path d="M5 12c4 3 10 3 14 0M5 16c4 3 10 3 14 0" stroke="#ffe9a6" stroke-width="1.3"/><path d="m12 6 1.5 2L12 10l-1.5-2z" fill="#955d2c"/>',
  trophy:'<path d="M7 3h10v8q0 7-5 7t-5-7z" fill="#f5c86b" stroke="#784421" stroke-width="1.5"/><path d="M7 6H3q0 7 5 7M17 6h4q0 7-5 7" fill="none" stroke="#f5c86b" stroke-width="2"/><path d="M12 18v3M8 22h8" stroke="#f4d396" stroke-width="2"/>',
  wave:'<path d="M1 16Q5 10 9 16t8 0q3-4 6 0M1 21q4-5 8 0t8 0q3-4 6 0" fill="none" stroke="#4ad1db" stroke-width="2.5"/><path d="M8 12q0-7 7-9c0 4 2 5 5 5" fill="none" stroke="#c6fcfd" stroke-width="1.8"/>',
  arrow:'<path d="M4 12h16M13 5l7 7-7 7" fill="none" stroke="#f7cb77" stroke-width="2.2" stroke-linecap="round"/>',
  chest:'<rect x="3" y="9" width="18" height="12" rx="2" fill="#aa653a" stroke="#f0b767" stroke-width="1.5"/><path d="M3 10V7c0-3 3-5 9-5s9 2 9 5v3z" fill="#e3a455" stroke="#f7d799" stroke-width="1.3"/><path d="M9 4v17m6-17v17" stroke="#7c411f" stroke-width="1.8"/><rect x="10" y="11" width="4" height="6" rx="1" fill="#fbe099"/>',
  chart:'<path d="M3 21h18" stroke="#f6d184" stroke-width="1.4"/><rect x="4" y="13" width="4" height="7" fill="#76bfc1"/><rect x="10" y="9" width="4" height="11" fill="#ffd47b"/><rect x="16" y="4" width="4" height="16" fill="#ea8852"/>',
  sword:'<path d="m4 20 4-4L20 3l1 1L9 17l-5 4z" fill="#c3f3fc" stroke="#4b6b7c" stroke-width="1.4"/><path d="m4 15 5 5M5 21 2 23" stroke="#e4b46d" stroke-width="2"/>',
  skull:'<path d="M5 7q0-6 7-6t7 6v7l-4 2v4H9v-4l-4-2z" fill="#fff1cb" stroke="#654626" stroke-width="1.2"/><circle cx="9" cy="9" r="2" fill="#143346"/><circle cx="15" cy="9" r="2" fill="#143346"/><path d="m12 11-1 2h2zm-3 6h6" stroke="#654626" stroke-width="1.3"/>',
  star:'<path d="m12 1 2.5 7.5L22 11l-7.5 2.5L12 21l-2.5-7.5L2 11l7.5-2.5z" fill="#ffe3a0" stroke="#a86b26" stroke-width="1.2"/>'
 };
 return `<svg viewBox="0 0 24 24" class="v136-glyph v136-glyph-${key}" focusable="false" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">${shapes[key]||shapes.star}</svg>`;
}
function welcomeView(){
  const p=profiles.slots[selectedSlot],free=profiles.slots.findIndex(x=>!x);
  const islandName=p?ISLANDS.find(i=>i.id===p.island)?.name||"Village de Fuchsia":"Village de Fuchsia";
  const level=p?Math.max(1,Number(p.level)||1):1;
  const xpNow=p?Math.max(0,Number(p.xp)||0):0;
  const xpMax=p?Math.max(1,nextXP(level)):100;
  const xpPercent=Math.max(0,Math.min(100,Math.round(100*xpNow/xpMax)));
  const completed=p?QUESTS.filter(q=>p.claimed?.[q.id]).length:0;
  const visited=p?Array.isArray(p.visits)?p.visits.length:1:0;
  const followed=p?.trackedQuestId?QUESTS.find(q=>q.id===p.trackedQuestId&&!p.claimed?.[q.id]):null;
  const displayName=p?escapeHTML(p.name):'Futur capitaine';
  const job=p?escapeHTML(JOBS[p.job]?.name||'Aventurier'):'Pirate';
  const slots=profiles.slots.filter(Boolean).length;
  const look=p&&['azur','flamme','brume'].includes(p.appearance)?p.appearance:'azur';
  const lookLabel={azur:'Azur',flamme:'Flamme',brume:'Brume'}[look];
  return `<main class="lobby-root v133-menu v134-menu v135-menu v136-menu v137-menu v138-menu v140-menu v141-menu v142-menu v143-menu v144-menu v145-menu v146-menu ${!p||p.island==='albe'?'v140-fuchsia':'v140-other'}" id="lobby-port">
    <div class="lobby-atmosphere" aria-hidden="true"><span class="v133-sun-glint"></span><span class="v133-vignette"></span></div>
    <header class="v133-header">
      <div class="v133-brand" aria-label="Les Chroniques des Mers"><span class="v133-brand-icon" aria-hidden="true">${menuIcon('skull')}</span><span><small>UNE AVENTURE DE PIRATES</small><strong>Les Chroniques <em>des Mers</em></strong></span></div>
      <div class="v143-nav-crest" aria-hidden="true"><svg class="v143-nav-compass" viewBox="0 0 86 86" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
  <defs><radialGradient id="cRose"><stop stop-color="#1c6882"/><stop offset="1" stop-color="#061b38"/></radialGradient></defs>
  <circle cx="43" cy="43" r="37" fill="#183348" stroke="#efc978" stroke-width="3"/>
  <circle cx="43" cy="43" r="29" fill="url(#cRose)" stroke="#b77e3f" stroke-width="2"/>
  <path d="M43 3v80M3 43h80M15 15l56 56m0-56L15 71" stroke="#e0b86c" stroke-width="2.5"/>
  <path d="M43 9 49 38 77 43 49 48 43 77 37 48 9 43 37 38Z" fill="#f7d98e" stroke="#6b432a" stroke-width="2"/>
  <path d="M43 12 43 43 74 43Z" fill="#ffe9c5"/>
  <path d="M43 74 43 43 12 43Z" fill="#0a527f"/>
  <circle cx="43" cy="43" r="7" fill="#9c622d" stroke="#ffe4a2" stroke-width="2"/>
  <circle cx="43" cy="43" r="2.5" fill="#fff4c8"/>
</svg><span class="v143-crest-copy"><strong>CAP SUR LES MERS</strong><small>LES MERS T'ATTENDENT</small></span></div>
      <nav class="v133-topnav" aria-label="Navigation principale">
        <button type="button" class="selected" data-lobby-scroll="port" aria-current="page"><span aria-hidden="true">${menuIcon('home')}</span> Accueil</button>
        <button type="button" data-action="open-dex"><span aria-hidden="true">${menuIcon('book')}</span> Encyclopédie</button>
        <button type="button" data-lobby-open="quests"><span aria-hidden="true">${menuIcon('scroll')}</span> Quêtes</button>
        <button type="button" data-lobby-open="comptoir"><span aria-hidden="true">${menuIcon('shop')}</span> Boutique</button>
        <button type="button" data-lobby-updates><span aria-hidden="true">${menuIcon('refresh')}</span> Mises à jour</button>
      </nav>
      <span class="v133-version" aria-label="Version 1.4.6, Fuchsia sur l’Île de l’Aube">V1.4.6</span>
    </header>
    <div class="v133-layout">
      <aside class="v133-sidebar v133-sidebar-left" aria-label="Mon aventure">
        <section class="v133-panel v133-profile">
          <div class="v133-panel-title"><span>${menuIcon('helm')}</span> Mon aventure</div>
          <div class="v133-profile-line"><div class="v133-portrait" aria-hidden="true">${p?`${window.ChroniquesCaptainRig?.render(look,'portrait',p?.customization)||`<img class="v136-avatar-image" src="assets/chibi-avatar-${look}.webp" alt="" draggable="false">`}`:'<span class="v134-profile-placeholder" aria-label="Emplacement libre">＋</span>'}</div><div><strong>${displayName}</strong><small>${p?`Niv. ${level} · ${job}`:'Choisis un personnage'}</small></div></div>
          <div class="v133-xp-caption"><span>Expérience</span><strong>${number(xpNow)} / ${number(xpMax)}</strong></div>
          <div class="v133-xp-bar" role="progressbar" aria-valuenow="${xpNow}" aria-valuemin="0" aria-valuemax="${xpMax}" aria-label="Progression de niveau"><span style="width:${xpPercent}%"></span></div>
          <div class="v133-stat-line"><span>${menuIcon('anchor')} Position</span><strong>${escapeHTML(islandName)}</strong></div>
          <div class="v133-stat-line"><span>${menuIcon('coins')} Berrys</span><strong>${p?number(p.gold):'0'}</strong></div>
        </section>
        <section class="v133-panel v133-progress">
          <div class="v133-panel-title"><span>${menuIcon('chart')}</span> Progression</div>
          <div class="v133-stat-line"><span>${menuIcon('map')} Îles découvertes</span><strong>${visited} / ${ISLANDS.length}</strong></div>
          <div class="v133-stat-line"><span>${menuIcon('scroll')} Quêtes terminées</span><strong>${completed} / ${QUESTS.length}</strong></div>
          <div class="v133-stat-line"><span>${menuIcon('trophy')} Victoires</span><strong>${p?number(p.battlesWon):0}</strong></div>
        </section>
        <section class="v133-panel v133-followed">
          <div class="v133-panel-title"><span>${menuIcon('scroll')}</span> Quête suivie</div>
          <strong class="v133-followed-name">${followed?escapeHTML(followed.title):'Choisis ton prochain objectif'}</strong>
          <p>${followed?'Continue ton aventure pour progresser.':'Le journal des quêtes te guidera sur les mers.'}</p>
          <button type="button" class="v133-panel-link" data-lobby-open="quests">Voir le journal <span aria-hidden="true">›</span></button>
        </section>
      </aside>
      <section class="v133-center" aria-label="Capitaine au port">
        <div class="v133-port-badge"><span aria-hidden="true">${menuIcon('anchor')}</span><strong>${escapeHTML(islandName)}</strong></div>
        ${(!p||p.island==='albe')?'<span class="v140-region-label">EAST BLUE · ÎLE DE L’AUBE</span>':''}
        <div class="v136-scene-decor v136-rope-left" aria-hidden="true"></div><div class="v136-scene-decor v136-rope-right" aria-hidden="true"></div><div class="v133-scene v134-scene ${p?'v134-occupied':'v134-vacant'}">
          
          <div class="v133-scene-glow" aria-hidden="true"></div><div class="v136-scene-sparkles" aria-hidden="true"></div>
          <div class="v143-stage-plinth" aria-hidden="true"></div><div class="v133-stage-shadow" aria-hidden="true"></div>
          ${p?`${window.ChroniquesCaptainRig?.render(look,'stage',p.customization)||`<img class="v133-captain-art v134-chibi v135-chibi v134-look-${look}" src="assets/chibi-capitaine-${look}.webp" width="460" height="550" alt="Capitaine chibi au manteau ${lookLabel}, illustration de menu" draggable="false" />`}<span class="v134-appearance-tag">Style : ${lookLabel}</span><button type="button" class="v142-customize-cta" data-action="customize">✦ Personnaliser</button>`:`<div class="v134-free-stage" aria-label="Emplacement vide, créer un nouveau personnage"><span aria-hidden="true" class="v134-free-silhouette">＋</span><strong>À ton tour de prendre la mer !</strong><small>Crée ton capitaine</small></div>`}
          <span class="v133-scene-ribbon"><span class="v136-ribbon-decoration" aria-hidden="true">❮</span>${p?displayName:'Emplacement libre'}<span class="v136-ribbon-decoration" aria-hidden="true">❯</span></span>
        </div>
        <div class="v133-main-action">
          <button type="button" class="v133-play" data-action="${p?'start-game':'create-slot'}"><span aria-hidden="true">${menuIcon('anchor')}</span><strong>${p?'JOUER':'CRÉER MON PERSONNAGE'}</strong><span aria-hidden="true">${menuIcon('anchor')}</span><small>${p?'Reprendre mon aventure':'Commencer une nouvelle aventure'}</small></button>
        </div>
      </section>
      <aside class="v133-sidebar v133-sidebar-right" aria-label="Accès rapides">
        <section class="v133-panel v133-shortcuts">
          <div class="v133-panel-title"><span>${menuIcon('anchor')}</span> Accès rapides</div>
          <div class="v133-quick-grid">
            <button type="button" data-lobby-open="character" data-lobby-char-tab="stats"><span class="v143-quick-icon" aria-hidden="true"><img class="v145-quick-art" src="assets/v145-crew.svg" width="64" height="64" alt="" draggable="false"></span> Personnage</button>
            <button type="button" data-lobby-open="map"><span class="v143-quick-icon" aria-hidden="true"><img class="v145-quick-art" src="assets/v145-map.svg" width="64" height="64" alt="" draggable="false"></span> Carte des mers</button>
            <button type="button" data-lobby-open="character" data-lobby-char-tab="equip"><span class="v143-quick-icon" aria-hidden="true"><img class="v145-quick-art" src="assets/v145-sword.svg" width="64" height="64" alt="" draggable="false"></span> Équipement</button>
            <button type="button" data-lobby-open="character" data-lobby-char-tab="inventory"><span class="v143-quick-icon" aria-hidden="true"><img class="v145-quick-art" src="assets/v145-inventory.svg" width="64" height="64" alt="" draggable="false"></span> Inventaire</button>
            <button type="button" data-lobby-open="character" data-lobby-char-tab="tech"><span class="v143-quick-icon" aria-hidden="true"><img class="v145-quick-art" src="assets/v145-tech.svg" width="64" height="64" alt="" draggable="false"></span> Techniques</button>
            <button type="button" data-lobby-open="character" data-lobby-char-tab="journal"><span class="v143-quick-icon" aria-hidden="true"><img class="v145-quick-art" src="assets/v145-journal.svg" width="64" height="64" alt="" draggable="false"></span> Journal</button>
          </div>
        </section>
        <section class="v133-panel v133-news">
          <div class="v133-panel-title"><span>${menuIcon('book')}</span> Carnet de bord</div>
          <p><strong>Grand Line t'attend.</strong> Explore les îles, découvre les fruits et développe ton personnage.</p>
          <small>⚒ À venir : équipages et navigation avancée.</small>
        </section>
      </aside>
    </div>
    <section class="v133-slots" id="lobby-characters" aria-label="Emplacements de personnages">
      <header class="v133-slots-title"><h2><span class="v136-slots-icon" aria-hidden="true">${menuIcon('skull')}</span> Mes personnages <span>${slots} / ${MAX_PROFILES}</span></h2>${free>=0?'<button type="button" data-action="create-new" class="v133-new-slot">＋ Nouveau</button>':''}</header>
      <div class="v133-slot-grid">${profiles.slots.map((v,i)=>`<button type="button" class="v133-slot ${i===selectedSlot?'selected':''} ${v?'occupied':'empty'}" data-slot="${i}" aria-pressed="${i===selectedSlot}"><span class="v133-slot-face" aria-hidden="true">${v?`${window.ChroniquesCaptainRig?.render(v.appearance,'portrait',v.customization)||`<img class="v136-avatar-image" src="assets/chibi-avatar-${['azur','flamme','brume'].includes(v.appearance)?v.appearance:'azur'}.webp" alt="" draggable="false">`}`:'＋'}</span><span class="v133-slot-data"><strong>${v?escapeHTML(v.name):'Emplacement libre'}</strong><small>${v?`Niv. ${v.level} · ${escapeHTML(ISLANDS.find(il=>il.id===v.island)?.name||'En mer')}`:`Créer un personnage`}</small></span></button>`).join('')}</div>
    </section>
    <footer class="v133-footer"><span>Aventure solo · Sauvegardes locales sur cet appareil</span><button type="button" data-action="lobby-import">${menuIcon('arrow')} Importer une sauvegarde</button><input type="file" id="save-file" accept=".json,application/json" class="hidden"></footer>
  </main>`;
}
/** Dans le menu, les rubriques sont de vraies fenêtres, pas un saut caché en exploration. */
function lobbySlotsPage(){
  return `<section class="v138-slot-chooser">
    <p>Choisis le capitaine dont tu veux reprendre l'aventure, ou crée un nouveau personnage dans un emplacement libre.</p>
    <div class="v138-chooser-grid">${profiles.slots.map((p,i)=>{
      const look=p&&['azur','flamme','brume'].includes(p.appearance)?p.appearance:'azur';
      const place=p?ISLANDS.find(island=>island.id===p.island)?.name||'En mer':'';
      const selected=i===selectedSlot;
      return `<button type="button" class="v138-chooser-slot ${selected?'selected':''} ${p?'occupied':'vacant'}" data-lobby-pick-slot="${i}" aria-label="Emplacement ${i+1} : ${p?escapeHTML(p.name):'Créer un personnage'}">
        <span class="v138-chooser-portrait" aria-hidden="true">${p?`${window.ChroniquesCaptainRig?.render(look,'portrait',p?.customization)||`<img src="assets/chibi-avatar-${look}.webp" alt="" draggable="false">`}`:'＋'}</span>
        <span class="v138-chooser-info"><small>Emplacement ${i+1}${selected?' · sélectionné':''}</small><strong>${p?escapeHTML(p.name):'Personnage à créer'}</strong>
          <span>${p?`Niveau ${Math.max(1,Number(p.level)||1)} · ${escapeHTML(place)}`:'Commencer une nouvelle aventure'}</span>
        </span>
        <span class="v138-chooser-cta" aria-hidden="true">${p?(selected?'Actuel':'Choisir'):'Créer'} ❯</span>
      </button>`;
    }).join('')}</div>
    <div class="v138-chooser-footer">Les quatre personnages ont chacun leur sauvegarde. Choisir un emplacement ne supprime aucun personnage.</div>
  </section>`;
}

function lobbyOverlay(){
  if(!overlayTab||(!state&&overlayTab!=='slots'))return '';
  const pages={slots:()=>lobbySlotsPage(),character:()=>characterPage(),map:()=>map(),quests:()=>quests(),comptoir:()=>comptoirPage()};
  if(!pages[overlayTab])return '';
  const names={slots:'Choisir un personnage',character:'Fiche de personnage',map:'Carte des mers',quests:'Journal des quêtes',comptoir:'Boutique du port'};
  return `<div class="game-overlay panel-${overlayTab} v137-lobby-dialog v138-lobby-dialog" role="dialog" aria-modal="true" aria-label="${names[overlayTab]}">
    <button class="overlay-scrim" type="button" data-action="close-overlay" aria-label="Fermer la fenêtre"></button>
    <section class="overlay-sheet">
      <header class="overlay-header">
        <div class="overlay-heading"><span class="eyebrow">⚓ Les Chroniques des Mers</span><h2>${names[overlayTab]}</h2>
          ${overlayTab==='character'?`<span class="overlay-character-meta">${escapeHTML(state.name)} · Niveau ${state.level} · ${number(state.gold)} Berrys</span>`:''}
        </div>
        <div class="overlay-header-actions"><button class="overlay-close" type="button" data-action="close-overlay" aria-label="Retour à l'accueil">✕</button></div>
      </header>
      <div class="overlay-scroll" tabindex="0">${pages[overlayTab]()}</div>
    </section>
  </div>`;
}
function creationView(editing=false){
 const active=editing&&state?state:null;
 const selectedLook=active&&['azur','flamme','brume'].includes(active.appearance)?active.appearance:'azur';
 const custom=normalizeCaptainCustom(active?.customization);
 const choice=(values,name,selected)=>values.map(([value,label])=>`<label class="v142-choice"><input type="radio" name="${name}" value="${value}" ${selected===value?'checked':''}><span>${label}</span></label>`).join('');
 return `<main class="create-root v142-creator"><header class="create-head"><button type="button" class="btn secondary tiny" data-action="back-lobby">← Accueil</button><div><span class="eyebrow">Les Chroniques des Mers · Atelier du capitaine</span><h2>${editing?'Personnaliser '+escapeHTML(state.name):'Créer un aventurier'}</h2></div></header>
 <div class="create-layout v142-create-layout"><div class="create-art v142-create-art"><strong class="v142-preview-label">APERÇU ANIMÉ · ${editing?escapeHTML(state.name):'NOUVEAU CAPITAINE'}</strong><div class="v142-creation-preview">${captainArtPreview(selectedLook,'stage',custom)}</div><p>Modifie les options : le résultat apparaît directement sur ton capitaine.</p></div>
 <form id="${editing?'customize-form':'create-form'}" class="create-form v142-customize-form"><h2>${editing?'Ton apparence':'Ton identité'}</h2>
 ${editing?'<p>Les changements sont uniquement cosmétiques : ton niveau, tes quêtes, ton inventaire et tes Berrys restent intacts.</p>':`<p>Personnalise ton capitaine avant de prendre la mer. Tu pourras modifier son apparence plus tard.</p>
 <div class="field"><label for="player-name">Nom du personnage</label><input id="player-name" name="name" minlength="2" maxlength="24" placeholder="Ex. : Kael" required autocomplete="off"></div>
 <div class="field"><label for="faction">Orientation</label><select id="faction" name="faction"><option>Pirate indépendant</option><option>Garde maritime</option><option>Explorateur libre</option><option>Chasseur de primes</option></select></div>
 <div class="field"><label for="job">Style de combat</label><select id="job" name="job"><option value="bretteur">⚔️ Bretteur — meilleure attaque</option><option value="eclaireur">🧭 Éclaireur — plus d’énergie</option><option value="gardien">🛡️ Gardien — meilleure défense</option></select></div>`}
 <fieldset class="appearance-field"><legend>Tenue de départ</legend><div class="appearance-list">${[['azur','🌊','Azur'],['flamme','🔥','Flamme'],['brume','🌙','Brume']].map(([v,icon,label])=>`<label class="appearance-choice"><input type="radio" name="appearance" value="${v}" ${selectedLook===v?'checked':''}><span>${icon}<small>${label}</small></span></label>`).join('')}</div></fieldset>
 <fieldset class="v142-custom-field"><legend>Couleur du ruban</legend><div class="v142-choices">${choice([['origine','⚓ Origine'],['bleu','🔵 Bleu'],['rouge','🔴 Rouge'],['vert','🟢 Vert'],['violet','🟣 Violet']],'ribbon',custom.ribbon)}</div></fieldset>
 <div class="field"><label for="captain-accessory">Accessoire</label><select id="captain-accessory" name="accessory">${[['aucun','Aucun'],['boucle',"Boucle d'oreille dorée"],['lunettes','Lunettes rondes'],['aviateur',"Lunettes d'aviateur sur le chapeau"]].map(([v,label])=>`<option value="${v}" ${v===custom.accessory?'selected':''}>${label}</option>`).join('')}</select></div>
 <p class="v142-creator-note">Première étape du créateur : la tenue, le ruban et l'accessoire sont visibles et sauvegardés. Les coiffures et les vêtements séparés arriveront avec de nouveaux dessins.</p>
 <button class="lobby-play" type="submit">${editing?'ENREGISTRER L’APPARENCE':'CRÉER LE PERSONNAGE'}<span>${editing?'Sans modifier ma progression':`Emplacement ${creationSlot+1} · sauvegarde locale`}</span></button><small class="create-warning">Chaque personnage garde ses réglages sur cet appareil. Tu peux exporter une sauvegarde avant tout changement important.</small></form></div></main>`;
}

function playerStats(){
  return `<div class="panel panel-pad"><div class="panel-header"><h3 class="panel-title">${escapeHTML(state.name)}</h3><span class="tag">Niv. ${state.level}</span></div>
    <div class="stat-row"><span>❤️ Points de vie</span><b>${number(state.hp)} / ${number(state.hpMax)}</b></div>${bar(state.hp,state.hpMax,'hp')}
    <div class="stat-row"><span>💧 Énergie</span><b>${number(state.energy)} / ${number(state.energyMax)}</b></div>${bar(state.energy,state.energyMax,'energy')}
    <div class="stat-row"><span>✨ Expérience</span><b>${number(state.xp)} / ${nextXP(state.level)}</b></div>${bar(state.xp,nextXP(state.level),'xp')}
    <div class="stats-grid"><div class="stat"><div class="v">${statAttack()}</div><span class="k">Attaque</span></div><div class="stat"><div class="v">${statDefense()}</div><span class="k">Défense</span></div><div class="stat"><div class="v">${state.battlesWon}</div><span class="k">Victoires</span></div></div>
  </div>`;
}
function journalCard(){return `<div class="panel panel-pad"><div class="panel-header"><h3 class="panel-title">Journal de bord</h3><span class="tag gold">Récemment</span></div><ul class="journal">${state.journal.slice(0,5).map(line=>`<li><span>✦</span><div>${escapeHTML(line.message)} <small class="subtle">· ${escapeHTML(line.time)}</small></div></li>`).join('')}</ul></div>`;}
function home(){
  const loc=currentIsland();const questDone=QUESTS.filter(q=>state.claimed[q.id]).length;
  return `<div class="main-grid"><div class="stack">
    <section class="panel hero"><div class="hero-content"><div class="eyebrow">⚓ &nbsp; ${escapeHTML(loc.sea)} / Niveau ${state.level}</div><h1>Ton histoire<br>commence en mer.</h1><p>Te voilà à <strong>${escapeHTML(loc.name)}</strong>. Pars explorer les environs, progresse en combat et découvre les secrets de cet archipel.</p><div class="actions"><button class="btn" data-action="explore">⚔️ Explorer les environs</button><button class="btn secondary" data-tab="map">🧭 Voir la carte</button></div></div></section>
    <div class="panel panel-pad"><div class="panel-header"><h3 class="panel-title">Ton escale actuelle</h3><span class="tag">${loc.icon} Niveau ${loc.level}+</span></div><h3>${escapeHTML(loc.name)}</h3><p class="section-lead" style="margin-bottom:13px">${escapeHTML(loc.desc)}</p><div class="actions"><button class="btn secondary" data-action="rest">🛏️ Se reposer ${state.island==='albe'?'(gratuit)':'(12 pièces)'}</button><button class="btn secondary" data-tab="quests">📜 Voir les missions</button></div></div>
    ${journalCard()}
  </div><div class="stack">${playerStats()}
    <div class="panel panel-pad"><div class="panel-header"><h3 class="panel-title">Ton aventure</h3></div><div class="stat-row"><span>🗺️ Îles découvertes</span><b>${state.visits.length} / ${ISLANDS.length}</b></div><div class="stat-row"><span>📜 Missions accomplies</span><b>${questDone} / ${QUESTS.length}</b></div><div class="stat-row"><span>🍈 Fruit unique trouvé</span><b>${state.found.fruit?'Oui':'Non'}</b></div><div class="stat-row"><span>🗡️ Lame légendaire</span><b>${state.found.blade?'Oui':'Non'}</b></div><div class="divider"></div><div class="notice">Chaque joueur a son propre monde. Un trésor unique peut être découvert une fois <strong>par sauvegarde</strong>.</div></div>
  </div></div>`;
}
function worldMap(){
  const paths=[[0,1],[1,2],[2,3],[3,4],[4,5]];
  return `<div class="worldmap" aria-label="Carte des îles de l'archipel"><span class="map-sea-label" style="left:8%;top:10%">Mer de l'Aube</span><span class="map-sea-label" style="left:72%;top:82%">Mer du Ponant</span>
  <svg class="map-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${paths.map(([a,b])=>`<path d="M${ISLANDS[a].x},${ISLANDS[a].y} L${ISLANDS[b].x},${ISLANDS[b].y}" fill="none" stroke="#9dd4cf" stroke-width="0.45" stroke-dasharray="1.2 2.5" opacity=".8"/>`).join('')}</svg>
  ${ISLANDS.map(i=>`<button data-travel="${i.id}" title="${escapeHTML(i.name)}" class="map-island ${i.id===state.island?'now':''} ${i.level>state.level?'locked':''}" style="left:${i.x}%;top:${i.y}%" aria-label="Voyager vers ${escapeHTML(i.name)}">${i.icon}</button><span class="map-label" style="left:${i.x}%;top:${Math.min(94,i.y+11)}%">${escapeHTML(i.name)}</span>`).join('')}</div>`;
}
function map(){return `<div><div class="eyebrow">Les routes de l'archipel</div><h2>Carte des mers</h2><p class="section-lead">Choisis une destination. Les îles plus dangereuses se débloquent avec ton niveau. Chaque voyage coûte des pièces.</p>
  <div class="panel panel-pad">${worldMap()}<div class="island-list">${ISLANDS.map(i=>`<div class="island-card ${state.island===i.id?'active':''} ${state.level<i.level?'locked':''}"><div class="island-emoji">${i.icon}</div><div class="island-info"><h3>${escapeHTML(i.name)}</h3><p>${escapeHTML(i.desc)}</p><div class="island-meta">${escapeHTML(i.sea)} · Niveau ${i.level}+ · ${state.island===i.id?'Position actuelle':`${i.cost} pièces le voyage`}</div></div><div class="card-actions"><button class="btn tiny ${state.island===i.id?'secondary':''}" data-travel="${i.id}" ${state.level<i.level?'disabled':''}>${state.island===i.id?'Explorer':state.level<i.level?'Verrouillé':'Naviguer'}</button></div></div>`).join('')}</div></div></div>`;}
function fruitTechniqueGlyph(fruit,index){
  const illustrations={
    F003:['💣','💥','🧨','🔥','☄️'],F006:['🕯️','🧱','🕸️','🛡️','🏰'],
    F012:['↗️','🥊','⚡','🛡️','💢'],F034:['⭕','🔀','⚔️','⚡','🗡️'],
    F043:['🛡️','💠','🔰','🪞','🏰'],F064:['🦅','💚','🪽','🔥','✨'],
    F069:['🐾','⚡','🐆','🩸','👑'],F071:['🐂','💨','🛡️','🐃','💥'],
    F076:['⛏️','🐾','↗️','🪨','🕳️'],F079:['🐸','🛡️','🦎','🦷','💚'],
    F091:['🌫️','✊','🪢','💨','🌪️'],F099:['❄️','🧊','🌫️','🌨️','🥶']
  };
  return illustrations[fruit?.id]?.[index]||'✦';
}
function combatView(){
  const battle=state.combat,foe=battle.enemy,f=playerFruit(),frank=masteryLevel(state.fruitUses||0),limits=combatCaps();
  const skills=[
    ['attack','⚔️','Coup',2,0],['ressac','🌊','Ressac',3,9],['impact','💥','Onde',4,14],
    ...Array.from({length:5},(_,i)=>{const t=f?.techniques[i];return [`fruit${i+1}`,fruitTechniqueGlyph(f,i),t?.name||`Fruit ${i+1}`,t?fruitPACost(t):null,t?.energy??null];}),
    ['guard','🛡️','Garde',2,0],['potion','🧪','Potion',2,0]
  ];
  return `<div id="tactical-root" class="tactical-shell tactical-v12">
    <div class="tactical-head">
      <div class="tactic-heading"><span class="eyebrow" id="tactic-phase">🛡️ Placement</span><h2>${escapeHTML(foe.name)}</h2></div>
      <div class="tactic-head-right"><span id="tactic-round" class="tag gold">Préparation</span><span id="tactic-timer" class="tactic-timer" title="Durée d'essai : 60 secondes par tour">⏳ 60 s</span></div>
    </div>
    <div class="tactical-hud" aria-label="Ressources du combat">
      <span id="tactic-hp">❤️ ${state.hp}/${state.hpMax}</span>
      <span id="tactic-pa" class="tactic-pa">⚡ ${limits.pa}/${limits.pa} PA</span>
      <span id="tactic-pm" class="tactic-pm">👟 ${limits.pm}/${limits.pm} PM</span>
      <span id="tactic-energy">💧 ${state.energy}/${state.energyMax}</span>
    </div>
    <div class="tactic-initiative" id="tactic-initiative" aria-label="Ordre des combattants"></div>
    <div class="tactical-map"><canvas id="tactical-canvas" role="img" aria-label="Grille tactique : clic sur une case pour marcher ou attaquer, glisser pour déplacer la caméra, molette pour zoomer"></canvas></div>
    <div class="tactic-camera-tools" aria-label="Caméra du combat">
      <button type="button" data-tactic-camera="zoom-in" aria-label="Zoomer">+</button>
      <span id="tactic-zoom" class="tactic-camera-level">100 %</span>
      <button type="button" data-tactic-camera="zoom-out" aria-label="Dézoomer">−</button>
      <button type="button" data-tactic-camera="center" aria-label="Recentrer sur le héros">⌖ <small>Moi</small></button>
    </div>
    <div class="tactical-message" id="tactic-msg" aria-live="polite">Place ton personnage sur une case bleue.</div>
    <section class="tactic-info" id="tactic-info" hidden aria-live="off"></section>
    <div class="tactical-action-dock">
      <div class="tactical-buttons" aria-label="Barre de 10 compétences, touches 1 à 0">
        ${skills.map(([key,ico,label,pa,en],i)=>`<button type="button" data-tactic="${key}" class="tactic-btn ${key.startsWith('fruit')?'fruit-tactic':''}" aria-pressed="false" ${!f&&key.startsWith('fruit')?'disabled':''} title="${escapeHTML(label)} · touche ${i===9?0:i+1}" aria-label="Touche ${i===9?0:i+1} : ${escapeHTML(label)}">
          <kbd>${i===9?'0':i+1}</kbd><b><span class="tactic-glyph">${ico}</span> ${escapeHTML(label)}</b><small>${pa===null?'À débloquer':`${pa} PA${en?` · ${en} EN`:''}`}</small>
        </button>`).join('')}
      </div>
      <div class="tactical-turn-actions">
        <button data-tactic="ready" class="tactic-btn end-btn tactic-ready"><b>✓ Prêt</b><small>ESPACE</small></button>
        <button data-tactic="pass" class="tactic-btn end-btn tactic-pass"><b>➜ Fin du tour</b><small>ESPACE</small></button>
        <button data-tactic="flee" class="tactic-flee" ${foe.boss?'disabled':''}>Fuir</button>
      </div>
    </div>
    <span class="sr-only" id="tactic-mode" aria-live="polite">Placement</span>
    <span class="sr-only" id="tactic-foes">Adversaires</span>
  </div>`;
}
function adventure(){
  if(state.combat)return combatView();
  const island=currentIsland();
  return `<div><div class="eyebrow">⚔️ Exploration libre</div><h2>L'appel de l'aventure</h2><p class="section-lead">Tu te trouves à <strong>${escapeHTML(island.name)}</strong>. Chaque exploration peut donner une rencontre, des ressources ou un trésor.</p>
  <div class="main-grid"><div class="stack"><div class="panel hero"><div class="hero-content"><div class="eyebrow">${island.icon} ${escapeHTML(island.sea)}</div><h1>${escapeHTML(island.name)}</h1><p>${escapeHTML(island.desc)}</p><div class="actions"><button class="btn" data-action="explore" ${state.energy<3?'disabled':''}>🧭 Explorer (3 énergie)</button><button class="btn secondary" data-action="rest">🛏️ Repos</button></div></div></div>
    ${island.id==='brume'?`<div class="panel panel-pad"><div class="panel-header"><h3 class="panel-title">Le Gardien du Phare</h3><span class="tag red">Boss</span></div><p class="section-lead" style="margin-bottom:12px">Une épreuve redoutable. Une lame légendaire attend le premier vainqueur de ta partie.</p><button class="btn" data-action="boss">🗿 Défier le Gardien</button>${state.found.blade?'<div class="boss-flag">✓ La lame de ce monde a déjà été découverte.</div>':''}</div>`:''}
    <div class="notice">Les rencontres et le butin sont aléatoires. Le fruit rare et la lame légendaire sont chacun limités à un exemplaire <strong>dans cette partie solo</strong>.</div></div>
    <div class="stack">${playerStats()}<div class="panel panel-pad"><h3 class="panel-title">Préparer l'expédition</h3><p class="section-lead" style="margin-bottom:14px">Soigne-toi avant d'entrer dans la mêlée.</p><div class="actions"><button class="btn secondary tiny" data-use="potion" ${!state.items.potion?'disabled':''}>🧪 Potion × ${state.items.potion||0}</button><button class="btn secondary tiny" data-use="tonic" ${!state.items.tonic?'disabled':''}>🫙 Tonique × ${state.items.tonic||0}</button></div></div></div></div></div>`;
}
function terrain(){
  const island=currentIsland(),hpPct=Math.max(0,Math.min(100,100*state.hp/Math.max(1,state.hpMax))),energyPct=Math.max(0,Math.min(100,100*state.energy/Math.max(1,state.energyMax)));
  const xpPct=Math.max(0,Math.min(100,100*state.xp/Math.max(1,nextXP(state.level))));
  const countPot=state.items.potion||0,countTon=state.items.tonic||0;
  return `<section class="terrain-shell v09-hud" id="scene-root">
    <div class="hud-upper" aria-label="Informations du personnage et mini-carte">
      <button type="button" class="hud-profile" data-tab="character" aria-label="Ouvrir la fiche de ${escapeHTML(state.name)}">
        <div class="hud-portrait">${avatarBust(state.appearance)}</div>
        <div class="hud-id"><div class="hud-id-row"><strong>${escapeHTML(state.name)}</strong><span>Niv. ${state.level}</span></div>
          <div class="hud-meter hp" role="progressbar" aria-label="Points de vie" aria-valuemin="0" aria-valuemax="${state.hpMax}" aria-valuenow="${state.hp}"><i style="width:${hpPct}%"></i><em>${state.hp} / ${state.hpMax}</em></div>
          <div class="hud-meter energy" role="progressbar" aria-label="Énergie" aria-valuemin="0" aria-valuemax="${state.energyMax}" aria-valuenow="${state.energy}"><i style="width:${energyPct}%"></i><em>${state.energy} / ${state.energyMax}</em></div>
          <div class="hud-xp" title="${number(state.xp)} / ${number(nextXP(state.level))} XP"><i style="width:${xpPct}%"></i></div>
        </div>
      </button>
      <div class="hud-location"><span>✦ ${escapeHTML(island.sea)}</span><strong>${escapeHTML(island.name)}</strong>${questTracker()}</div>
      <div class="hud-map-wrap">
        <button type="button" id="scene-map" class="hud-map" aria-label="Ouvrir la carte des îles">
          <canvas id="hud-minimap" width="144" height="112" aria-hidden="true"></canvas>
          <span class="hud-map-label">CARTE</span>
        </button>
        <div class="hud-money" aria-label="Pièces : ${number(state.gold)}"><span>✦</span>${number(state.gold)}</div>
      </div>
    </div>
    <div class="scene-window">
      <canvas id="scene-canvas" aria-label="Carte jouable de ${escapeHTML(island.name)}. Déplacement tactile, glissement et zoom par pincement." role="img"></canvas>
      <div class="scene-prompt" id="scene-prompt">Découvre l'île en te déplaçant</div>
      <div class="scene-camera-tools" aria-label="Contrôles de caméra">
        <button id="scene-zoom-in" type="button" aria-label="Zoomer">＋</button>
        <span id="scene-zoom-label" aria-live="off">78 %</span>
        <button id="scene-zoom-out" type="button" aria-label="Dézoomer">−</button>
        <button id="scene-recenter" class="scene-recenter" type="button" aria-label="Recentrer sur mon personnage">⌖ <span>Moi</span></button>
        <button id="scene-fullscreen" type="button" aria-label="Activer le plein écran du téléphone" title="Plein écran système">⛶</button>
      </div>
      <nav class="hud-quick" aria-label="Accès rapide">
        <button type="button" id="scene-bag" aria-label="Ouvrir mon inventaire"><span class="hud-quick-icon">🎒</span><small>Sac</small></button>
        <button type="button" id="scene-quests" aria-label="Ouvrir les quêtes"><span class="hud-quick-icon">📜</span><small>Quêtes</small></button>
        <button type="button" id="scene-menu" data-tab="menu" aria-label="Ouvrir le menu principal"><span class="hud-quick-icon">☰</span><small>Menu</small></button>
      </nav>
      <div class="scene-controls" aria-label="Commandes tactiles">
        <div class="scene-stick" id="scene-stick" role="application" aria-label="Joystick pour se déplacer"><div class="scene-stick-ring"><div class="scene-stick-knob" id="scene-knob"></div></div></div>
        <div class="scene-buttons"><button id="scene-interact" class="scene-button interact" type="button">✨<span>Action</span></button></div>
      </div>
      <div class="scene-dialog" id="scene-dialog" hidden></div>
    </div>
    <nav class="scene-toolbar" aria-label="Barre d'actions de l'aventurier">
      <div class="hud-dock-title"><span>⚓</span><b>Actions</b></div>
      <div class="hud-action-list">
        <button type="button" id="scene-attack" class="hud-action strike" title="Défier l'ennemi proche"><span class="hud-action-icon">⚔️</span><span>Combat</span></button>
        <button type="button" data-use="potion" class="hud-action cure" ${!countPot?'disabled':''} title="Boire une potion de soin"><span class="hud-action-icon">❤️</span><span>Soin</span><em>${countPot}</em></button>
        <button type="button" data-use="tonic" class="hud-action tonic" ${!countTon?'disabled':''} title="Boire un tonique d'énergie"><span class="hud-action-icon">💧</span><span>Énergie</span><em>${countTon}</em></button>
        <button type="button" data-action="rest" class="hud-action rest" title="Se reposer"><span class="hud-action-icon">🌙</span><span>Repos</span></button>
      </div>
      <div class="hud-dock-sigil" aria-hidden="true">✧</div>
    </nav>
  </section>`;
}
function avatarBust(look){return avatarArt(look).replace('viewBox="0 0 300 345"','viewBox="71 42 162 176"').replace('class="captain-portrait"','class="hud-bust"');}
function quests(){
  return `<div><div class="eyebrow">📜 Missions et progression</div><h2>Journal des quêtes</h2><p class="section-lead">Toutes les missions sont individuelles. Leur progression est enregistrée automatiquement.</p><div class="split"><div class="panel panel-pad"><div class="panel-header"><h3 class="panel-title">Missions</h3><span class="tag">${QUESTS.filter(q=>state.claimed[q.id]).length} / ${QUESTS.length} terminées</span></div>
  ${QUESTS.map(q=>{const progress=Math.min(q.count,questProgress(q));const done=!!state.claimed[q.id];return `<article class="quest"><div class="mini-header" style="margin:0"><span class="eyebrow">${escapeHTML(ISLANDS.find(i=>i.id===q.island)?.name||'Mission')}</span><span class="tag ${done?'green':progress>=q.count?'gold':''}">${done?'Récompensée':progress>=q.count?'À récupérer':'En cours'}</span></div><h3>${escapeHTML(q.title)}</h3><p>${escapeHTML(q.desc)}</p><div class="quest-foot"><span class="subtle">${progress} / ${q.count} · ${q.gold} pièces · ${q.xp} XP</span><div class="quest-buttons"><button class="btn tiny secondary" data-track-quest="${q.id}" ${done?'disabled':''}>${done?'Terminée':state.trackedQuestId===q.id?'✓ Suivie':'Suivre'}</button><button class="btn tiny ${done?'secondary':''}" data-quest="${q.id}" ${done||progress<q.count?'disabled':''}>${done?'Terminée':progress>=q.count?'Récupérer':'En progression'}</button></div></div></article>`;}).join('')}</div><div class="stack">${journalCard()}<div class="notice">Le journal garde une trace des derniers événements. Tes quêtes restent disponibles même si tu quittes le jeu.</div></div></div></div>`;
}
function itemCard(key,amount){
  const item=ITEMS[key];if(!item||!amount)return '';
  return `<div class="inventory-item"><div class="inventory-icon">${item.icon}</div><div style="flex:1;min-width:0"><h3>${escapeHTML(item.name)} <span class="tag">×${amount}</span></h3><p>${escapeHTML(item.desc)}</p>${['potion','tonic'].includes(key)?`<button class="btn tiny secondary" style="margin-top:10px" data-use="${key}" ${state.combat?'disabled':''}>Utiliser</button>`:''}</div></div>`;
}
function bag(){return `<div><div class="eyebrow">🎒 Équipement et sauvegarde</div><h2>Sac de voyage</h2><p class="section-lead">Tout ce que tu trouves t'appartient, dans ta partie solo.</p><div class="split"><div class="stack"><div class="panel panel-pad"><div class="panel-header"><h3 class="panel-title">Inventaire</h3><span class="tag">${Object.keys(state.items).length} objets différents</span></div><div class="item-grid">${Object.keys(state.items).filter(k=>state.items[k]>0&&ITEMS[k]).map(k=>itemCard(k,state.items[k])).join('')||'<div class="empty">Ton sac est vide. Explore les îles !</div>'}</div></div>
    <div class="panel panel-pad"><div class="panel-header"><h3 class="panel-title">Comptoir de Port d’Albe</h3><span class="tag gold">🪙 ${number(state.gold)} pièces</span></div><p class="section-lead" style="margin-bottom:14px">Potions, toniques et armes pour la route. Les achats se font uniquement au port.</p><div class="stack" style="gap:10px">${[['potion',18],['tonic',22],['sabre',85]].map(([key,price])=>`<div class="inventory-item"><div class="inventory-icon">${ITEMS[key].icon}</div><div style="flex:1"><strong>${ITEMS[key].name}</strong><p>${ITEMS[key].desc}</p></div><button class="btn tiny secondary" data-buy="${key}" ${state.island!=='albe'||(key==='sabre'&&state.items.sabre)?'disabled':''}>${price} 🪙</button></div>`).join('')}</div>${state.island!=='albe'?'<p class="subtle" style="font-size:11px;margin-top:12px">Reviens à Port d’Albe pour accéder au comptoir.</p>':''}</div></div>
    <div class="stack">${playerStats()}<div class="panel panel-pad"><h3 class="panel-title">Fiche du personnage</h3><div class="pills"><span class="pill">${escapeHTML(state.faction)}</span><span class="pill">${escapeHTML(JOBS[state.job]?.name||'Bretteur')}</span></div><div class="stat-row"><span>Position</span><b>${escapeHTML(currentIsland().name)}</b></div><div class="stat-row"><span>Pièces</span><b>${number(state.gold)}</b></div><div class="stat-row"><span>Victoires</span><b>${state.battlesWon}</b></div><div class="stat-row"><span>Arme</span><b>${state.items.blade?'Lame légendaire':state.items.sabre?'Sabre':'Arme de départ'}</b></div></div>
    <div class="panel panel-pad"><h3 class="panel-title">Sauvegarde de ta partie</h3><p class="section-lead" style="margin-bottom:13px">Le jeu sauvegarde automatiquement dans ce navigateur. Exporte une copie pour éviter de perdre ta progression si les données du navigateur sont effacées.</p><div class="save-tools"><button class="btn secondary tiny" data-action="export">⬇ Exporter</button><button class="btn secondary tiny" data-action="import">⬆ Importer</button><input type="file" id="save-file" accept=".json,application/json" class="hidden" aria-label="Importer une sauvegarde"></div><div class="danger-zone"><strong>Nouvelle partie</strong><p class="subtle" style="font-size:12px;line-height:1.6;margin:8px 0">Supprime la progression de cet appareil seulement.</p><button class="btn tiny danger" data-action="reset">Supprimer la partie</button></div></div></div></div></div>`;}
// V1.2.1 — fenêtre RPG compacte. Aucune modification des sauvegardes ou des règles de combat.
let selectedBagItem = 'potion';
function rpgIcon(name){
 const paths={
   compass:'<circle cx="12" cy="12" r="9"/><path d="m15.9 8.1-2.3 5.5-5.5 2.3 2.3-5.5z"/>',
   equipment:'<path d="m14.5 3.5 6 6-11 11-6-6zM3 21l5-5M21 3l-5 5"/><path d="M3 3l6 6M21 21l-6-6"/>',
   bag:'<path d="M5 9h14l1 12H4L5 9zM9 9V6a3 3 0 0 1 6 0v3"/><path d="M9 13v2m6-2v2"/>',
   skills:'<path d="m12 2 1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7L12 2zM19 18l.5 1.5L21 20l-1.5.5L19 22l-.5-1.5L17 20l1.5-.5z"/>',
   haki:'<path d="M12 2 4 5v6c0 5 3.5 8 8 11 4.5-3 8-6 8-11V5l-8-3z"/><path d="M12 5v13"/>',
   fruit:'<path d="M12 6c-3-4-8 0-8 7 0 5 4 9 8 9s8-4 8-9c0-7-5-11-8-7z"/><path d="M12 6c-1-3 1-5 4-5M12 6c-1-2-4-3-6-3"/>',
   journal:'<path d="M5 3h12a2 2 0 0 1 2 2v16H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3zM8 8h7M8 12h7M8 16h5"/>',
   coin:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="6"/><path d="M12 8v8M9 10h6M9 14h6"/>',
   bolt:'<path d="M13 2 4 13h7l-1 9 10-12h-7l1-8z"/>',
   shoe:'<path d="M3 15c4 0 6-1 7-8h3c2 4 4 6 8 7v5H3v-4z"/>',
   shield:'<path d="M12 2 4 5v7c0 4 4 8 8 10 4-2 8-6 8-10V5l-8-3z"/>',
   sword:'<path d="M20 3 9 14m0 0 3 3m-3-3-3-3m6 6-5 5m-2-2 4 4"/>',
   heart:'<path d="M20.8 4.8a5 5 0 0 0-7.1 0L12 6.5l-1.7-1.7a5 5 0 0 0-7.1 7.1L12 21l8.8-9.1a5 5 0 0 0 0-7.1z"/>',
   book:'<path d="M3 5a3 3 0 0 1 3-3h13v18H6a3 3 0 0 0-3 3zM3 5v15a3 3 0 0 1 3-3h13"/>',
 };
 return `<svg class="rpg-svg" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">${paths[name]||paths.compass}</svg>`;
}
function bagDetailContent(key){
 const item=ITEMS[key];
 if(!item||!(state.items[key]>0))return '<span class="rpg-no-item">Aucun objet dans cette catégorie.</span>';
 return `<span class="rpg-item-pic">${item.icon}</span><div><strong>${escapeHTML(item.name)}</strong><p>${escapeHTML(item.desc)}</p></div>${['potion','tonic'].includes(key)?`<button class="rpg-use-btn" data-use="${key}" ${state.combat?'disabled':''}>Utiliser</button>`:''}`;
}
function bagInventory(compact=false){
 const keys=Object.keys(state.items).filter(k=>state.items[k]>0&&ITEMS[k]);
 const matching=keys.filter(k=>inventoryFilter==='all'||(inventoryFilter==='use'&&['potion','tonic'].includes(k))||(inventoryFilter==='gear'&&['sabre','blade','fruit'].includes(k))||(inventoryFilter==='resources'&&!['potion','tonic','sabre','blade','fruit'].includes(k)));
 const selected=matching.includes(selectedBagItem)?selectedBagItem:matching[0];
 const itm=selected?ITEMS[selected]:null;
 const filler=Array.from({length:Math.max(0,(compact?20:30)-matching.length)},(_,i)=>`<span class="bag-empty-tile" aria-hidden="true">✦</span>`).join('');
 return `<section class="rpg-bag ${compact?'rpg-bag-mini':''}">
   <div class="rpg-block-title"><span>${rpgIcon('bag')} SAC</span><small>${keys.length} types · Sans poids</small></div>
   <div class="rpg-bag-controls"><div class="rpg-bag-tabs">${[['all','Tout'],['use','Soins'],['gear','Équipement'],['resources','Ressources']].map(([id,label])=>`<button data-filter="${id}" class="${inventoryFilter===id?'active':''}" type="button">${label}</button>`).join('')}</div><span class="rpg-money">${rpgIcon('coin')} ${number(state.gold)}</span></div>
   <div class="rpg-bag-content"><div class="rpg-bag-grid" aria-label="Objets du sac">${matching.map(k=>`<button class="loot-slot ${selected===k?'selected':''}" data-inventory-select="${k}" type="button" title="${escapeHTML(ITEMS[k].name)} · ${state.items[k]} exemplaire(s)" aria-label="${escapeHTML(ITEMS[k].name)}, quantité ${state.items[k]}"><span class="loot-art">${ITEMS[k].icon}</span><small class="loot-count">${state.items[k]}</small></button>`).join('')}${filler}</div></div>
   <div class="rpg-bag-detail">${bagDetailContent(selected)}</div>
 </section>`;
}
function equipmentBoard(){
 const activeWeapon=state.items.blade?'blade':state.items.sabre?'sabre':null;
 const slots=[
  ['Coiffe','♛',null],['Collier','◈',null],['Cape','♜',null],['Anneau','◇',null],
  ['Arme',activeWeapon?ITEMS[activeWeapon].icon:'⚔',activeWeapon],['Protection','⛨',null],['Bottes','♧',null],['Anneau','◇',null]
 ];
 const group=(from,to,side)=>`<div class="paper-slots ${side}">${slots.slice(from,to).map(([label,ico,key])=>`<div class="paper-slot ${key?'filled':''}" title="${escapeHTML(label)}${key?' : '+escapeHTML(ITEMS[key].name):' · à découvrir'}"><span>${ico}</span><small>${label}</small></div>`).join('')}</div>`;
 return `<section class="rpg-paper"><div class="rpg-block-title"><span>${rpgIcon('equipment')} ÉQUIPEMENT</span><small>Pièces équipées</small></div>
  <div class="rpg-paper-layout">${group(0,4,'left')}<div class="paper-person"><div class="paper-stage">${avatarArt(state.appearance)}</div><div class="paper-name">${escapeHTML(state.name)}</div><div class="paper-profession">${escapeHTML(JOBS[state.job]?.name||'Bretteur')} · Niv. ${state.level}</div></div>${group(4,8,'right')}</div>
  <div class="paper-bonus">${rpgIcon('sword')} Arme : <b>${activeWeapon?escapeHTML(ITEMS[activeWeapon].name):'Arme de départ'}</b><span> · ${statAttack()} ATQ</span></div>
  <p class="paper-disclaimer">Équipement manuel, raretés et forge prévus pour une future version.</p>
 </section>`;
}
function characterPage(){
 const tabs=[['stats','compass','Caractéristiques','Caract.'],['equip','equipment','Équipement','Équip.'],['inventory','bag','Inventaire','Sac'],['tech','skills','Techniques','Techniques'],['haki','haki','Haki','Haki'],['fruit','fruit','Fruit du Démon','Fruit'],['journal','journal','Journal','Journal']];
 let body='';
 if(characterTab==='stats')body=`<div class="rpg-stats-layout"><div class="rpg-character-display"><div class="rpg-character-art">${avatarArt(state.appearance)}</div><div class="rpg-character-caption"><strong>${escapeHTML(state.name)}</strong><small>${escapeHTML(JOBS[state.job]?.name||'Bretteur')} · ${escapeHTML(currentIsland().name)}</small></div></div><section class="rpg-stat-sheet"><div class="rpg-block-title"><span>${rpgIcon('compass')} CARACTÉRISTIQUES</span><small>Niveau ${state.level}</small></div>
 <div class="rpg-resource-line"><div class="char-gauge"><span>PV <b>${number(state.hp)} / ${number(state.hpMax)}</b></span>${bar(state.hp,state.hpMax,'hp')}</div><div class="char-gauge"><span>Énergie <b>${number(state.energy)} / ${number(state.energyMax)}</b></span>${bar(state.energy,state.energyMax,'energy')}</div><div class="char-gauge"><span>Expérience <b>${number(state.xp)} / ${number(nextXP(state.level))}</b></span>${bar(state.xp,nextXP(state.level),'xp')}</div></div>
 <div class="rpg-stat-caption">Ressources de base <b>6 PA · 3 PM · 100 énergie</b><span>Plafonds : 12 PA / 6 PM</span></div>
 <div class="rpg-stat-list">${[['bolt','Points d’action',combatCaps().pa,'12'],['shoe','Points de mouvement',combatCaps().pm,'6'],['sword','Attaque',statAttack(),''],['shield','Défense',statDefense(),''],['heart','Victoires',state.battlesWon,''],['coin','Berrys',number(state.gold),'']].map(([ico,label,val,max])=>`<div class="rpg-stat-cell">${rpgIcon(ico)}<span>${label}</span><b>${val}</b>${max?`<small>/ ${max}</small>`:''}</div>`).join('')}</div></section></div>`;
 else if(characterTab==='equip')body=`<div class="rpg-equip-layout">${equipmentBoard()}${bagInventory(true)}</div>`;
 else if(characterTab==='inventory')body=bagInventory(false);
 else if(characterTab==='tech')body=`<div class="rpg-block-title"><span>${rpgIcon('skills')} TECHNIQUES</span><small>Maîtrises de combat</small></div><div class="rpg-skill-list">${[['⚔️','Coup direct','2 PA · 1 case · frappe simple'],['🌊','Frappe du ressac','3 PA + 9 EN · 3 cases · 2 tours de recharge'],['💥','Onde de choc','4 PA + 14 EN · 4 cases · zone'],['🛡️','Garde','2 PA · défense et +5 énergie']].map(([ico,title,desc],i)=>`<article class="rpg-skill"><span class="skill-badge">${ico}</span><div><strong>${title}</strong><small>${desc}</small></div><span class="skill-index">0${i+1}</span></article>`).join('')}</div><p class="rpg-muted-note">Ces techniques sont jouables ; leur maîtrise avancée sera développée ultérieurement.</p>`;
 else if(characterTab==='haki')body=`<div class="rpg-block-title"><span>${rpgIcon('haki')} MAÎTRISE DU HAKI</span><small>Progression future</small></div><div class="rpg-skill-list">${[['👁️','Observation','Perception et anticipation'],['🛡️','Armement','Renforcement et maîtrise'],['👑','Volonté royale','Éveil exceptionnel']].map(([ico,title,desc])=>`<article class="rpg-skill"><span class="skill-badge">${ico}</span><div><strong>${title}</strong><small>${desc}</small></div><span class="skill-locked">Verrouillé</span></article>`).join('')}</div>`;
 else if(characterTab==='fruit')body=`<div class="rpg-block-title"><span>${rpgIcon('fruit')} FRUIT DU DÉMON</span><small>Un fruit par personnage</small></div><div class="rpg-fruit-content">${fruitPanel()}</div>`;
 else body=`<div class="rpg-block-title"><span>${rpgIcon('journal')} JOURNAL DE BORD</span><small>Souvenirs d'aventure</small></div><div class="rpg-journal-content">${journalCard()}</div>`;
 return `<div class="character-page rpg-character-window"><aside class="char-sidebar"><div class="char-side-name"><small class="rpg-caption-label">${escapeHTML(state.faction)} · FICHE PERSONNAGE</small><h3>${escapeHTML(state.name)}</h3><small>${escapeHTML(state.faction)} · Niveau ${state.level}</small></div><nav class="char-nav" aria-label="Rubriques du personnage">${tabs.map(([id,ico,label,short])=>`<button type="button" data-char-tab="${id}" class="${characterTab===id?'active':''}" aria-pressed="${characterTab===id}" title="${label}">${rpgIcon(ico)}<span class="char-nav-label">${short}</span></button>`).join('')}</nav><div class="rpg-sidebar-footer">✦ LES CHRONIQUES DES MERS ✦</div></aside><section class="char-detail rpg-detail rpg-tab-${characterTab}">${body}</section></div>`;
}

function comptoirPage(){
 return `<div class="store-page"><span class="eyebrow">⚓ Comptoir de Port d’Albe</span><h2>Échoppe du port</h2><p class="char-muted">Les achats se font uniquement à Port d’Albe. L’argent dépensé concerne seulement le personnage actif.</p><div class="store-money">En poche : <strong>🪙 ${number(state.gold)}</strong></div><div class="char-tech-grid">${[['potion',18],['tonic',22],['sabre',85]].map(([key,price])=>`<article><div class="tech-icon">${ITEMS[key].icon}</div><div><h4>${escapeHTML(ITEMS[key].name)}</h4><p>${escapeHTML(ITEMS[key].desc)}</p></div><button class="btn tiny" data-buy="${key}" ${state.island!=='albe'||state.gold<price||(key==='sabre'&&state.items.sabre)?'disabled':''}>🪙 ${price}</button></article>`).join('')}</div>${state.island!=='albe'?'<p class="char-tip">Retourne à Port d’Albe pour acheter des objets.</p>':''}</div>`;
}
function settingsPage(){return `<div class="settings-page"><h3>Partie et sauvegardes</h3><p class="char-muted">Chaque personnage possède sa sauvegarde locale. Tu peux revenir à l’accueil et choisir un autre emplacement à tout moment.</p><div class="settings-actions"><button class="btn secondary" data-action="back-to-lobby">🏠 Choisir un personnage</button><button class="btn secondary" data-action="export">⬇ Exporter ce personnage</button><button class="btn secondary" data-action="import">⬆ Importer dans cet emplacement</button><input type="file" id="save-file" class="hidden" accept=".json,application/json"></div><div class="char-tip">Le jeu sauvegarde automatiquement sur cet appareil. Si tu changes de navigateur ou si ses données sont effacées, les sauvegardes locales ne suivront pas : conserve un fichier exporté.</div><div class="settings-danger"><h3>Zone sensible</h3><p>Supprimer le personnage de l’emplacement ${selectedSlot+1}. Cette action est irréversible sans export.</p><button class="btn danger" data-action="reset">Supprimer ce personnage</button></div></div>`;}
function menuPage(){return `<div class="menu-page"><span class="eyebrow">⚓ Menu du bord</span><h2>Choisis ta prochaine escale</h2><p class="char-muted">Tes raccourcis vers les principales fonctions du jeu.</p><div class="menu-tiles">${[['character','🧭','Personnage','Fiche, équipement et sac'],['encyclopedia','🍎','Encyclopédie','100 fruits et leurs détenteurs'],['map','🗺️','Carte des mers','Voyager entre les îles'],['quests','📜','Quêtes','Journal des missions'],['comptoir','🪙','Comptoir','Soins, armes et ressources'],['settings','⚙️','Réglages','Sauvegardes et personnages']].map(([id,icon,title,sub])=>`<button data-tab="${id}"><span>${icon}</span><strong>${title}</strong><small>${sub}</small></button>`).join('')}</div><div class="menu-quick"><button class="btn secondary" data-action="rest">🛏️ Se reposer</button><button class="btn secondary" data-action="explore">⚔️ Chercher une rencontre</button></div></div>`;}

function openOverlay(tab){
  if(state?.combat){notify('Termine ton combat avant d’ouvrir les menus.');return;}
  if(tab==='bag')tab='character';
  if(tab==='character'&&overlayTab!=='character')characterTab='stats';
  overlayTab=overlayTab===tab?null:tab;
  render();
}
function render(){
  window.Roam?.unmount();window.Tactics?.unmount();
  document.body.classList.toggle('chroniques-lobby-v137',screenMode==='lobby');
  if(screenMode==='lobby'||screenMode==='create'||screenMode==='customize'||screenMode==='encyclopedia'){
    document.body.classList.remove('immersive-game','game-expanded');
    app.innerHTML=screenMode==='lobby'?welcomeView()+lobbyOverlay():screenMode==='encyclopedia'?`<main class="dex-lobby">${dexView(false)}</main>`:creationView(screenMode==='customize');return;
  }
  if(!state){screenMode='lobby';render();return;}
  migrateCombatResources();document.body.classList.add('immersive-game');
  document.body.classList.remove('game-expanded');
  activeTab=state.combat?'adventure':'terrain';
  if(state.combat)overlayTab=null;
  const content={character:characterPage,map,quests,encyclopedia:()=>dexView(true),comptoir:comptoirPage,settings:settingsPage,menu:menuPage};
  const pageNames={character:'Personnage',map:'Carte des mers',quests:'Quêtes',comptoir:'Comptoir',settings:'Réglages',menu:'Menu du bord',encyclopedia:'Encyclopédie'};
  // Chaque rubrique a sa propre navigation. Les raccourcis Carte, Quêtes,
  // Comptoir et Réglages appartiennent exclusivement au Menu du bord.
  const panel=overlayTab&&content[overlayTab]?`<div class="game-overlay panel-${overlayTab}" role="dialog" aria-modal="true" aria-label="${pageNames[overlayTab]}">
    <button type="button" class="overlay-scrim" data-action="close-overlay" aria-label="Fermer le menu"></button>
    <section class="overlay-sheet">
      <header class="overlay-header">
        <div class="overlay-heading"><span class="eyebrow">⚓ ${overlayTab==='menu'?'Les Chroniques des Mers':'Menu du bord'}</span><h2>${pageNames[overlayTab]}</h2>${overlayTab==='character'?`<span class="overlay-character-meta">${escapeHTML(state.name)} · Niv. ${state.level} &nbsp; ◆ &nbsp; ${number(state.gold)} Berrys</span>`:''}</div>
        <div class="overlay-header-actions">
          ${overlayTab!=='menu'?'<button type="button" class="overlay-back" data-action="back-menu" aria-label="Retour au menu du bord">← <span>Menu</span></button>':''}
          <button type="button" class="overlay-close" data-action="close-overlay" aria-label="Retour au jeu">✕</button>
        </div>
      </header>
      <div class="overlay-scroll" tabindex="0">${content[overlayTab]()}</div>
    </section>
  </div>`:'';
  app.innerHTML=`<main class="play-stage" data-page="${activeTab}">
    ${state.combat?combatView():terrain()}
    ${panel}
    <div class="version-mark" aria-hidden="true">DÉMO · 1.4.6</div>
  </main>`;
  if(state.combat){
    window.Tactics?.mount({state,attack:statAttack,defense:statDefense,masteryGain:increaseFruitMastery,persist,toast:notify,win:winBattle,lose:loseBattle,
      backdrop:battleBackdrop,
      flee:()=>{battleBackdrop=null;state.combat=null;state.sceneOpponent=null;state.will=0;activeTab='terrain';commit('Tu as réussi à battre en retraite.');}});
  }else{
    window.Roam?.mount({state,persist,commit,toast:notify,enemyKey:()=>currentIsland().enemy,islandName:()=>currentIsland().name,
      fullScreen:async()=>{if(document.fullscreenElement){await document.exitFullscreen().catch(()=>{});return;}
        if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen().catch(()=>notify('Plein écran système indisponible. Ajoute le jeu à ton écran d’accueil.'));
        else notify('Pour masquer la barre du navigateur, ajoute le jeu à ton écran d’accueil.');},
      openStore:()=>openOverlay('comptoir'),openMap:()=>openOverlay('map'),openBag:()=>{characterTab='inventory';overlayTab='character';render();},openQuests:()=>openOverlay('quests'),
      rest,availableQuests:()=>QUESTS,boss:bossBattle,startFight:(specific)=>newBattle(ENEMIES[specific]?specific:currentIsland().enemy)});
  }
}
app.addEventListener('submit',event=>{
  if(event.target?.id==='customize-form'&&screenMode==='customize'){
    event.preventDefault();if(!state)return;
    const form=new FormData(event.target);
    state.appearance=['azur','flamme','brume'].includes(form.get('appearance'))?form.get('appearance'):'azur';
    state.customization=readCaptainCustom(form);
    persist();screenMode='lobby';render();notify('Apparence enregistrée sans modifier ta progression.');return;
  }
  if(event.target?.id!=='create-form'||screenMode!=='create')return;
  event.preventDefault();const form=new FormData(event.target);const name=String(form.get('name')||'').trim();
  if(name.length<2){notify('Choisis un nom d’au moins 2 caractères.');return;}
  createGame(name,String(form.get('faction')||'Explorateur libre'),String(form.get('job')||'bretteur'),String(form.get('appearance')||'azur'),readCaptainCustom(form));
});
app.addEventListener('click',event=>{
  const target=event.target.closest('button');if(!target||target.disabled)return;
  if(target.dataset.lobbyPickSlot!==undefined){
    const index=Number(target.dataset.lobbyPickSlot);
    if(!Number.isInteger(index)||index<0||index>=MAX_PROFILES)return;
    if(profiles.slots[index]){pickSlot(index);return;}
    persist();
    selectedSlot=index;profiles.selected=index;state=null;creationSlot=index;
    overlayTab=null;screenMode='create';storeProfiles();render();return;
  }
  if(target.dataset.slot!==undefined){pickSlot(Number(target.dataset.slot));return;}
  if(target.dataset.lobbyScroll!==undefined){
    document.getElementById(target.dataset.lobbyScroll==='slots'?'lobby-characters':'lobby-port')?.scrollIntoView?.({behavior:'smooth',block:'nearest'});
    if(target.dataset.lobbyScroll==='slots')app.querySelector('.v133-slot.selected')?.focus?.({preventScroll:true});
    return;
  }
  if(target.dataset.lobbyUpdates!==undefined){document.getElementById('chroniques-updates-button')?.click();return;}
  if(target.dataset.lobbyOpen){
    if(target.dataset.lobbyOpen==='slots'){overlayTab='slots';render();return;}
    if(!state){notify('Crée ou sélectionne un personnage pour ouvrir cette rubrique.');return;}
    if(state.combat){notify('Termine ton combat avant d’ouvrir les menus.');return;}
    overlayTab=target.dataset.lobbyOpen;
    if(overlayTab==='character')characterTab=target.dataset.lobbyCharTab||'stats';
    render();return;
  }
  if(target.dataset.dexType){dexType=target.dataset.dexType;refreshDex();return;}
  if(target.dataset.dexStatus){dexStatus=target.dataset.dexStatus;refreshDex();return;}
  if(target.dataset.charTab){characterTab=target.dataset.charTab;render();return;}
  if(target.dataset.filter){inventoryFilter=target.dataset.filter;render();return;}
  if(target.dataset.inventorySelect){
    selectedBagItem=target.dataset.inventorySelect;
    app.querySelectorAll('.loot-slot').forEach(tile=>tile.classList.toggle('selected',tile.dataset.inventorySelect===selectedBagItem));
    const detail=app.querySelector('.rpg-bag-detail');if(detail)detail.innerHTML=bagDetailContent(selectedBagItem);
    return;
  }
  if(target.dataset.action==='customize'){
    if(!state||state.combat){notify('Personnalisation indisponible pendant un combat.');return;}
    overlayTab=null;screenMode='customize';render();return;
  }
  if(target.dataset.action==='open-dex'){screenMode='encyclopedia';render();return;}
  if(target.dataset.action==='close-dex'){screenMode='lobby';render();return;}
  if(target.dataset.action==='back-lobby'){screenMode='lobby';render();return;}
  if(target.dataset.action==='create-new'){
    const idx=profiles.slots.findIndex(v=>!v);if(idx<0){notify('Les quatre emplacements sont occupés.');return;}
    persist();selectedSlot=idx;profiles.selected=idx;state=null;creationSlot=idx;screenMode='create';storeProfiles();render();return;
  }
  if(target.dataset.action==='create-slot'){
    if(profiles.slots[selectedSlot])return;
    creationSlot=selectedSlot;screenMode='create';render();return;
  }
  if(target.dataset.action==='start-game'){enterGame();return;}
  if(target.dataset.action==='lobby-import'){document.getElementById('save-file')?.click();return;}
  if(target.dataset.tab){if(target.dataset.tab==='terrain'){overlayTab=null;render();return;}openOverlay(target.dataset.tab);return;}
  if(!state)return;
  if(target.dataset.eatFruit){eatDemoFruit(target.dataset.eatFruit);return;}
  if(target.dataset.travel){travel(target.dataset.travel);return;}
  if(target.dataset.fight){fight(target.dataset.fight);return;}
  if(target.dataset.trackQuest){
    const quest=QUESTS.find(q=>q.id===target.dataset.trackQuest);
    if(!quest||state.claimed[quest.id])return;
    state.trackedQuestId=quest.id;
    persist();render();notify(`Quête suivie : ${quest.title}`);
    return;
  }
  if(target.dataset.quest){claimQuest(target.dataset.quest);return;}
  if(target.dataset.use){usePotion(target.dataset.use);return;}
  if(target.dataset.buy){buy(target.dataset.buy);return;}
  switch(target.dataset.action){case 'back-menu':overlayTab='menu';render();break;case 'close-overlay':overlayTab=null;render();break;case 'back-to-lobby':goLobby();break;case 'explore':explore();break;case 'rest':rest();break;case 'boss':bossBattle();break;case 'export':downloadSave();break;case 'import':document.getElementById('save-file')?.click();break;case 'reset':resetGame();break;}
});
app.addEventListener('input',event=>{if(event.target?.id==='dex-search'){dexSearch=event.target.value.slice(0,100);refreshDex();}});
app.addEventListener('change',event=>{
  if((screenMode==='create'||screenMode==='customize')&&event.target?.matches('input[name=appearance],input[name=ribbon],select[name=accessory]')){
    const form=app.querySelector('#create-form, #customize-form');
    const preview=app.querySelector('.v142-creation-preview');
    if(!form||!preview)return;
    const values=new FormData(form);
    const look=['azur','flamme','brume'].includes(values.get('appearance'))?values.get('appearance'):'azur';
    preview.innerHTML=captainArtPreview(look,'stage',readCaptainCustom(values));
    return;
  }
  if(event.target?.id==='save-file'&&event.target.files?.[0])importSave(event.target.files[0]);
});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&overlayTab){overlayTab=null;render();}});
if('serviceWorker' in navigator&&location.protocol==='https:'){
  window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
}
render();
})();
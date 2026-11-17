'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {test} = require('node:test');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'versions', 'v1.3.7', 'game.js'), 'utf8');
const stylesheet = fs.readFileSync(path.join(root, 'versions', 'v1.3.7', 'theme-v137.css'), 'utf8');
const html = fs.readFileSync(path.join(root, 'versions', 'v1.3.7', 'index.html'), 'utf8');

function loadGame(options={}) {
  const hero={version:1,name:'Aventurier Test',level:2,xp:4,gold:60,
    hp:100,hpMax:100,energy:100,energyMax:100,combatRulesV12:true,
    island:'albe',visits:['albe'],kills:{},loot:{},claimed:{},
    items:{potion:3,tonic:1},journal:[],battlesWon:0,combat:null,
    found:{fruit:false,blade:false},atk:14,def:4,
    job:'bretteur',appearance:options.appearance||'azur',faction:'Explorateur libre',fruitId:null,fruitUses:0};
  const storage=new Map([['chroniques_mers_profiles_v1',
    JSON.stringify({schema:1,selected:0,slots:[hero,options.secondLook?{...hero,name:'Deuxieme Aventurier',appearance:options.secondLook}:null,null,null]})]]);
  const listeners={};
  const app={innerHTML:'',addEventListener(type,fn){listeners[type]=fn;},querySelector(){return null;}};
  const toast={textContent:'',classList:{add(){},remove(){}}};
  const document={
    body:{classList:{add(){},remove(){},toggle(){}}},
    getElementById(id){return id==='app'?app:id==='toast'?toast:null;},
    addEventListener(){},querySelector(){return null;}
  };
  const sandbox={window:{Roam:{unmount(){},mount(){}},Tactics:{unmount(){},mount(){}},
    ChroniquesFruits:{fruits:[],pilotFree:[]}},
    document,navigator:{},location:{protocol:'file:'},
    localStorage:{getItem(k){return storage.get(k)||null;},
      setItem(k,v){storage.set(k,String(v));}},
    console,confirm(){return true;},clearTimeout(){},setTimeout(){return 1;}
  };
  vm.runInNewContext(source,sandbox,{filename:'game.js',timeout:4000});
  return {app,storage,click(dataset){
    const target={dataset,disabled:false};
    listeners.click({target:{closest(){return target;}}});
  }};
}

test('menu V1.3.7 navigation simplifiee et sauvegardes intactes',()=>{
  assert.ok(html.includes('href="theme-v137.css"'));
  assert.ok(html.indexOf('theme-v137.css')>html.indexOf('theme-v136.css'));
  assert.match(stylesheet,/\.v137-menu/);
  assert.match(stylesheet,/\.v137-lobby-dialog/);
  assert.ok(html.includes('theme-v135.css'), 'Le décor V1.3.5 est conservé');
  assert.match(stylesheet,/@media\s*\(max-width:\s*720px\)/);
  const g=loadGame();
  const before=g.storage.get('chroniques_mers_profiles_v1');
  assert.match(g.app.innerHTML,/class="lobby-root v133-menu v134-menu v135-menu v136-menu v137-menu"/);
  assert.match(g.app.innerHTML,/V1\.3\.7/);
  assert.match(g.app.innerHTML,/Aventurier Test/);
  assert.match(g.app.innerHTML,/data-action="start-game"/);
  assert.match(g.app.innerHTML,/data-action="lobby-import"/);
  assert.match(g.app.innerHTML,/data-action="open-dex"/);
  assert.match(g.app.innerHTML,/data-slot="3"/);
  assert.match(g.app.innerHTML,/assets\/chibi-capitaine-azur.webp/);
  assert.match(g.app.innerHTML,/class="v136-glyph/);
  assert.match(g.app.innerHTML,/assets\/chibi-avatar-azur.webp/);
  assert.doesNotMatch(g.app.innerHTML,/v134-pier/);
  assert.match(g.app.innerHTML,/v134-look-azur/);
  assert.match(g.app.innerHTML,/Style : Azur/);
  assert.match(g.app.innerHTML,/data-lobby-open="quests"/);
  assert.match(g.app.innerHTML,/data-lobby-updates/);
  assert.match(g.app.innerHTML,/data-lobby-scroll="slots"/);
  assert.match(g.app.innerHTML,/Emplacements/);
  assert.match(g.app.innerHTML,/data-lobby-char-tab="inventory"/);
  assert.match(g.app.innerHTML,/data-lobby-char-tab="equip"/);
  assert.doesNotMatch(g.app.innerHTML,/data-lobby-updates>.*Versions/);
  assert.equal(g.storage.get('chroniques_mers_profiles_v1'),before);
});

test('choix personnages et bouton JOUER toujours utilisables',()=>{
  const g=loadGame();
  g.click({slot:'1'});
  assert.match(g.app.innerHTML,/data-action="create-slot"/);
  assert.match(g.app.innerHTML,/v134-free-stage/);
  assert.doesNotMatch(g.app.innerHTML,/class="v133-captain-art v134-chibi/);
  assert.doesNotMatch(g.app.innerHTML,/v134-appearance-tag/);
  assert.match(g.app.innerHTML,/Emplacement libre/);
  g.click({slot:'0'});
  assert.match(g.app.innerHTML,/data-action="start-game"/);
  g.click({action:'start-game'});
  assert.match(g.app.innerHTML,/scene-canvas/);
  assert.match(g.app.innerHTML,/DÉMO · 1\.3\.7/);
});


test('raccourcis du menu ouvrent les vraies rubriques du jeu',()=>{
  const g=loadGame();
  g.click({lobbyOpen:'quests'});
  assert.match(g.app.innerHTML,/Journal des quêtes/);
  assert.match(g.app.innerHTML,/data-action="close-overlay"/);
  const h=loadGame();
  h.click({lobbyOpen:'character'});
  assert.match(h.app.innerHTML,/FICHE PERSONNAGE|CARACTÉRISTIQUES/);
  const i=loadGame();
  i.click({action:'open-dex'});
  assert.match(i.app.innerHTML,/Encyclopédie|FRUITS/);
});

test('image chibi présente dans les assets du jeu',()=>{
  for (const name of ['chibi-capitaine-azur.webp','chibi-capitaine-flamme.webp','chibi-capitaine-brume.webp','chibi-avatar-azur.webp','chibi-avatar-flamme.webp','chibi-avatar-brume.webp','ocean-port-ponton.webp']) {
    const image=fs.readFileSync(path.join(root,'versions','v1.3.7','assets',name));
    assert.ok(image.length>10000,name);
    assert.equal(image.toString('ascii',0,4),'RIFF',name);
  }
});


test('apparence enregistree change le profil et le style du chibi',()=>{
  const g=loadGame({secondLook:'flamme'});
  assert.match(g.app.innerHTML,/assets\/chibi-avatar-azur.webp/);
  g.click({slot:'1'});
  assert.match(g.app.innerHTML,/Deuxieme Aventurier/);
  assert.match(g.app.innerHTML,/v134-look-flamme/);
  assert.match(g.app.innerHTML,/assets\/chibi-capitaine-flamme.webp/);
  assert.match(g.app.innerHTML,/Style : Flamme/);
  assert.match(g.app.innerHTML,/assets\/chibi-avatar-flamme.webp/);
  assert.ok(!g.app.innerHTML.includes('v134-free-stage'));
  const b=loadGame({appearance:'brume'});
  assert.match(b.app.innerHTML,/v134-look-brume/);
  assert.match(b.app.innerHTML,/assets\/chibi-capitaine-brume.webp/);
  assert.match(b.app.innerHTML,/Style : Brume/);
});


test('Personnage ouvre la fiche directe depuis le menu sans lancer exploration',()=>{
 const g=loadGame();
 const before=g.storage.get('chroniques_mers_profiles_v1');
 g.click({lobbyOpen:'character',lobbyCharTab:'stats'});
 assert.match(g.app.innerHTML,/v137-lobby-dialog/);
 assert.match(g.app.innerHTML,/Fiche de personnage/);
 assert.match(g.app.innerHTML,/CARACTÉRISTIQUES/);
 assert.match(g.app.innerHTML,/Aventurier Test/);
 assert.doesNotMatch(g.app.innerHTML,/scene-canvas/);
 g.click({charTab:'inventory'});
 assert.match(g.app.innerHTML,/v137-lobby-dialog/);
 assert.match(g.app.innerHTML,/Inventaire|INVENTAIRE|Sac/);
 assert.doesNotMatch(g.app.innerHTML,/scene-canvas/);
 g.click({action:'close-overlay'});
 assert.doesNotMatch(g.app.innerHTML,/v137-lobby-dialog/);
 assert.match(g.app.innerHTML,/data-action="start-game"/);
 assert.equal(g.storage.get('chroniques_mers_profiles_v1'),before);
});

test('raccourcis d equipement et carte ne changent pas de scene',()=>{
 const g=loadGame();
 g.click({lobbyOpen:'character',lobbyCharTab:'equip'});
 assert.match(g.app.innerHTML,/v137-lobby-dialog/);
 assert.match(g.app.innerHTML,/Équip\.|Équipement/);
 assert.doesNotMatch(g.app.innerHTML,/scene-canvas/);
 g.click({action:'close-overlay'});
 g.click({lobbyOpen:'map'});
 assert.match(g.app.innerHTML,/Carte des mers/);
 assert.match(g.app.innerHTML,/v137-lobby-dialog/);
 assert.doesNotMatch(g.app.innerHTML,/scene-canvas/);
});

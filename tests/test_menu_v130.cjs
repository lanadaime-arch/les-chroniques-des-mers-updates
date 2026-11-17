'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {test} = require('node:test');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'versions', 'v1.3.0', 'game.js'), 'utf8');
const stylesheet = fs.readFileSync(path.join(root, 'versions', 'v1.3.0', 'theme-v130.css'), 'utf8');
const html = fs.readFileSync(path.join(root, 'versions', 'v1.3.0', 'index.html'), 'utf8');

function loadGame() {
  const hero={version:1,name:'Aventurier Test',level:2,xp:4,gold:60,
    hp:100,hpMax:100,energy:100,energyMax:100,combatRulesV12:true,
    island:'albe',visits:['albe'],kills:{},loot:{},claimed:{},
    items:{potion:3,tonic:1},journal:[],battlesWon:0,combat:null,
    found:{fruit:false,blade:false},atk:14,def:4,
    job:'bretteur',appearance:'azur',faction:'Explorateur libre',fruitId:null,fruitUses:0};
  const storage=new Map([['chroniques_mers_profiles_v1',
    JSON.stringify({schema:1,selected:0,slots:[hero,null,null,null]})]]);
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

test('menu V1.3.0 affiché sans changer les sauvegardes',()=>{
  assert.ok(html.includes('href="theme-v130.css"'));
  assert.ok(html.indexOf('theme-v130.css')>html.indexOf('theme-v123.css'));
  assert.match(stylesheet,/\.v130-menu/);
  assert.match(stylesheet,/@media \(max-width: 560px\)/);
  const g=loadGame();
  const before=g.storage.get('chroniques_mers_profiles_v1');
  assert.match(g.app.innerHTML,/class="lobby-root v130-menu"/);
  assert.match(g.app.innerHTML,/V1\.3\.0 · MENU/);
  assert.match(g.app.innerHTML,/Aventurier Test/);
  assert.match(g.app.innerHTML,/data-action="start-game"/);
  assert.match(g.app.innerHTML,/data-action="lobby-import"/);
  assert.match(g.app.innerHTML,/data-action="open-dex"/);
  assert.match(g.app.innerHTML,/data-slot="3"/);
  assert.equal(g.storage.get('chroniques_mers_profiles_v1'),before);
});

test('choix personnages et bouton JOUER toujours utilisables',()=>{
  const g=loadGame();
  g.click({slot:'1'});
  assert.match(g.app.innerHTML,/data-action="create-slot"/);
  assert.match(g.app.innerHTML,/Emplacement libre/);
  g.click({slot:'0'});
  assert.match(g.app.innerHTML,/data-action="start-game"/);
  g.click({action:'start-game'});
  assert.match(g.app.innerHTML,/scene-canvas/);
  assert.match(g.app.innerHTML,/DÉMO · 1\.3\.0/);
});

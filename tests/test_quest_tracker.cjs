'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {test} = require('node:test');

const source = fs.readFileSync(path.join(__dirname, '..', 'versions', 'v1.2.3', 'game.js'), 'utf8');

function bootFromExistingProfile() {
  const save = {
    version:1,name:'Capitaine Test',level:2,xp:10,gold:55,hp:100,hpMax:100,
    energy:100,energyMax:100,combatRulesV12:true,island:'albe',
    visits:['albe'],kills:{},loot:{},claimed:{},items:{potion:3,tonic:1},
    journal:[],battlesWon:0,combat:null,found:{fruit:false,blade:false},
    atk:14,def:4,job:'bretteur',appearance:'azur',faction:'Libre',fruitId:null,fruitUses:0
  };
  const values = new Map([['chroniques_mers_profiles_v1', JSON.stringify({
    schema:1,selected:0,slots:[save,null,null,null]
  })]]);
  const listeners = {};
  const app = {innerHTML:'',addEventListener(type,fn){listeners[type]=fn;},querySelector(){return null;}};
  const toast = {textContent:'',classList:{add(){},remove(){}}};
  const window = {
    Roam:{unmount(){},mount(){}}, Tactics:{unmount(){},mount(){}},
    ChroniquesFruits:{fruits:[],pilotFree:[]}
  };
  const document = {
    body:{classList:{add(){},remove(){},toggle(){}}},
    getElementById(id){return id==='app'?app:id==='toast'?toast:null;},
    addEventListener(){},querySelector(){return null;}
  };
  const sandbox={
    window,document,
    localStorage:{getItem(k){return values.get(k)||null;},setItem(k,v){values.set(k,v);}},
    navigator:{},location:{protocol:'file:'},
    setTimeout(){return 1;},clearTimeout(){},
    confirm(){return true;},console,
  };
  // Exposure limited to this VM unit test, never bundled in the game.
  const testSource = source.replace(/\}\)\(\);\s*$/, 'globalThis.__questTestState = () => state;\n})();');
  vm.runInNewContext(testSource,sandbox,{filename:'game.js',timeout:3000});
  function click(dataset){
    const target={dataset,disabled:false};
    listeners.click({target:{closest(){return target;}}});
  }
  return {save:sandbox.__questTestState(),values,app,click};
}

test('suivi de quete sans migration destructive des anciens profils', () => {
  const {save,values,app,click}=bootFromExistingProfile();
  click({action:'start-game'});
  assert.match(app.innerHTML,/class="hud-quest-track/);
  assert.match(app.innerHTML,/Sécuriser les quais/);
  assert.equal(save.trackedQuestId,undefined,'Anciennes sauvegardes non modifiées par simple affichage');

  click({tab:'quests'});
  assert.match(app.innerHTML,/data-track-quest="planche"/);
  click({trackQuest:'planche'});
  assert.equal(save.trackedQuestId,'planche');
  assert.equal(JSON.parse(values.get('chroniques_mers_profiles_v1')).slots[0].trackedQuestId,'planche');
  assert.match(app.innerHTML,/Les épaves racontent/);

  save.loot.wood=3;
  click({tab:'quests'});
  click({tab:'quests'});
  assert.match(app.innerHTML,/hud-quest-track is-ready/);
  assert.match(app.innerHTML,/Récompense disponible/);
  assert.match(app.innerHTML,/3 \/ 3/);
});

test('le suivi rebascule sur une mission valide quand la quete est recompensee', () => {
  const {save,app,click}=bootFromExistingProfile();
  click({action:'start-game'});
  click({trackQuest:'quais'});
  save.kills.mousse=2;
  click({tab:'quests'});
  click({quest:'quais'});
  assert.equal(save.claimed.quais,true);
  assert.match(app.innerHTML,/Les épaves racontent|Les yeux sur l.horizon|Récompense disponible/);
  const tracker = app.innerHTML.match(/<button[^>]*class="hud-quest-track[^"]*"[^>]*>[\s\S]*?<\/button>/)?.[0] || '';
  assert.doesNotMatch(tracker,/Sécuriser les quais/);
});

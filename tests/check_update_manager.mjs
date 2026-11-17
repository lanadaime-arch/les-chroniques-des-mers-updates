import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {test} from 'node:test';
import path from 'node:path';

const root=path.resolve('.');
const manifest=JSON.parse(fs.readFileSync('game-versions.json','utf8'));
const read=pathName=>fs.readFileSync(path.isAbsolute(pathName)?pathName:path.join(root,pathName),'utf8');

test('deux versions disponibles et des chemins locaux, sans publication externe',()=>{
 assert.equal(manifest.schema,1);
 assert.equal(manifest.latest,'1.2.2');
 assert.deepEqual(manifest.versions.map(v=>v.id),['1.2.1','1.2.2']);
 for(const v of manifest.versions){
  assert.equal(v.directory,`versions/v${v.id}/`);
  assert.match(v.directory,/^versions\/v\d+\.\d+\.\d+\/$/);
  for(const file of ['index.html','game.js','roam.js','tactics.js','fruit-data.js','sw.js',
   'style.css','theme-v121.css','assets/ocean-port.webp','manifest.webmanifest']){
    assert.ok(fs.statSync(path.join(root,v.directory,file)).isFile(),v.directory+file);
  }
 }
 assert.ok(fs.statSync('versions/v1.2.2/theme-v122.css').isFile());
});
test('scripts JS des deux versions et gestionnaire chargent sans erreurs de syntaxe',()=>{
 for(const v of manifest.versions){
  for(const file of ['game.js','roam.js','tactics.js','fruit-data.js','sw.js']){
   const p=path.join(root,v.directory,file);assert.doesNotThrow(()=>new vm.Script(read(p),{filename:p}),p);
  }
 }
 assert.doesNotThrow(()=>new vm.Script(read('update-manager.js')));
 assert.doesNotThrow(()=>new vm.Script(read('sw.js')));
});
test('l ancien jeu est inchange, sauf indication de version',()=>{
 const live=read('game.js');
 const stable=read('versions/v1.2.1/game.js');
 const candidate=read('versions/v1.2.2/game.js');
 assert.equal(stable,live,'V1.2.1 strictement conservee');
 assert.equal(candidate.replace('DÉMO · 1.2.2','DÉMO · 1.2.1'),stable,
  'La candidate 1.2.2 conserve les mecanismes et sauvegardes de la V1.2.1');
 assert.equal(read('versions/v1.2.1/index.html').includes('theme-v122.css'),false);
 assert.equal(read('versions/v1.2.2/index.html').includes('theme-v122.css'),true);
});
test('origin et chemins : aucun changement de domaine pour les profils locaux',()=>{
 for(const v of manifest.versions){
  const html=read(path.join(v.directory,'index.html'));
  for(const src of ['game.js','roam.js','tactics.js','fruit-data.js']){
   assert.ok(html.includes('src="'+src+'"'),v.id+' doit charger '+src);
  }
  assert.ok(html.includes('src="../../update-manager.js"'));
  assert.ok(html.includes('href="../../update-manager.css"'));
  assert.ok(html.includes('theme-v121.css'));
 }
 const rootIndex=read('index.html');
 assert.ok(rootIndex.includes('src="update-manager.js"'));
 assert.ok(rootIndex.includes('href="update-manager.css"'));
 const updater=read('update-manager.js');
 assert.ok(updater.includes('chroniques_mers_profiles_v1'));
 assert.ok(updater.includes('chroniques_mers_solo_v1'));
 assert.ok(updater.includes('createBackup(current,id)'));
 assert.ok(updater.includes('localStorage.setItem(STORE,id)'));
 assert.ok(updater.includes("location.assign(fileUrl(choice,'index.html').href)"));
 assert.ok(updater.indexOf('createBackup(current,id)')<updater.indexOf('localStorage.setItem(STORE,id)'));
});
test('service workers ne suppriment pas les caches des autres versions',()=>{
 for(const v of manifest.versions){
  const sw=read(path.join(v.directory,'sw.js'));
  assert.match(sw,/k\.startsWith\(PREFIX\)/);
  assert.match(sw,/k !== CACHE/);
  assert.ok(sw.includes('caches.match(event.request)'));
 }
 const rootSw=read('sw.js');
 assert.ok(rootSw.includes("k.startsWith('chroniques-mers-root-')"));
 assert.ok(!rootSw.includes("keys.filter(k => k !== CACHE)"));
});

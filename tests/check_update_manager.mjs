import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {test} from 'node:test';
import path from 'node:path';

const root=path.resolve('.');
const manifest=JSON.parse(fs.readFileSync('game-versions.json','utf8'));
const read=pathName=>fs.readFileSync(path.isAbsolute(pathName)?pathName:path.join(root,pathName),'utf8');

test('quatre versions disponibles et des chemins locaux, sans publication externe',()=>{
 assert.equal(manifest.schema,1);
 assert.equal(manifest.latest,'1.3.0');
 assert.deepEqual(manifest.versions.map(v=>v.id),['1.2.1','1.2.2','1.2.3','1.3.0']);
 for(const v of manifest.versions){
  assert.equal(v.directory,`versions/v${v.id}/`);
  assert.match(v.directory,/^versions\/v\d+\.\d+\.\d+\/$/);
  for(const file of ['index.html','game.js','roam.js','tactics.js','fruit-data.js','sw.js',
   'style.css','theme-v121.css','assets/ocean-port.webp','manifest.webmanifest']){
    assert.ok(fs.statSync(path.join(root,v.directory,file)).isFile(),v.directory+file);
  }
 }
 assert.ok(fs.statSync('versions/v1.2.2/theme-v122.css').isFile());
 assert.ok(fs.statSync('versions/v1.2.3/theme-v122.css').isFile());
 assert.ok(fs.statSync('versions/v1.2.3/theme-v123.css').isFile());
 assert.ok(fs.statSync('versions/v1.3.0/theme-v130.css').isFile());
});
test('scripts JS des quatre versions et gestionnaire chargent sans erreurs de syntaxe',()=>{
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
 assert.equal(read('versions/v1.2.3/index.html').includes('theme-v122.css'),true);
 assert.equal(read('versions/v1.2.3/index.html').includes('theme-v123.css'),true);
 assert.equal(read('versions/v1.2.3/game.js').includes('DÉMO · 1.2.3'),true);
 assert.equal(read('versions/v1.2.3/game.js').includes('function questTracker()'),true);
 assert.equal(read('versions/v1.3.0/game.js').includes('lobby-root v130-menu'),true);
 assert.equal(read('versions/v1.3.0/index.html').includes('theme-v130.css'),true);
 assert.equal(read('versions/v1.2.3/index.html').includes('theme-v130.css'),false);
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

test('installation et retour arriere sauvegardent les profils avec le meme domaine',async()=>{
 const origin='https://lanadaime-arch.github.io';
 const base=origin+'/les-chroniques-des-mers-updates/';
 const local=new Map([
   ['chroniques_mers_profiles_v1','{"schema":1,"selected":0,"slots":[{"name":"Test"}]}'],
   ['chroniques_mers_solo_v1','{"name":"Ancien"}']
 ]);
 const activeKey='chroniques_mers_active_web_version_v1';
 const backupKey='chroniques_mers_pre_update_backup_v1';
 const records=[];
 const cacheMap=new Map();
 const caches={
   async delete(name){return cacheMap.delete(name);},
   async open(name){
     if(!cacheMap.has(name))cacheMap.set(name,new Map());
     const entries=cacheMap.get(name);
     return {
       async put(url,response){entries.set(String(url),response);},
       async keys(){return [...entries.keys()];},
       async match(url){return entries.get(String(url));}
     };
   }
 };
 function fakeElement(){
  return {id:'',hidden:false,textContent:'',children:[],dataset:{},disabled:false,
   classList:{toggle(){}},handlers:{},setAttribute(){},focus(){},append(...items){this.children.push(...items);},
   replaceChildren(...items){this.children=items;},addEventListener(type,handler){this.handlers[type]=handler;}
  };
 }
 function start(pathname){
   const elements=new Map();
   const doc={
     readyState:'complete',currentScript:{src:base+'update-manager.js'},
     body:{append(...items){for(const item of items)if(item.id)elements.set(item.id,item);}},
     createElement(){return fakeElement();},
     getElementById(id){if(id==='chroniques-updates-button'&&!elements.has(id))return null;if(!elements.has(id))elements.set(id,fakeElement());return elements.get(id);},
     addEventListener(){},
     querySelectorAll(){return (elements.get('chroniques-update-list')?.children||[]).map(line=>line.children[1]);}
   };
   const nav=[];
   const location={origin,pathname,assign(url){nav.push(url);},replace(url){nav.push(url);}};
   const fetch=async(url,options={})=>{
     if(String(url).endsWith('game-versions.json'))return {ok:true,async json(){return manifest;}};
     const mime=/\.(?:js|css)$/.test(String(url))?'text/javascript':'text/plain';
     return {ok:true,type:'basic',headers:{get(){return mime;}}};
   };
   const sandbox={document:doc,location,window:{caches},caches,localStorage:{
     getItem(key){return local.has(key)?local.get(key):null;},
     setItem(key,value){local.set(key,String(value));},
     removeItem(key){local.delete(key);}
   },URL,fetch,Date,Set,Map,Error,console};
   vm.runInNewContext(read('update-manager.js'),sandbox);
   return {elements,nav};
 }
 const original=local.get('chroniques_mers_profiles_v1');
 const first=start('/les-chroniques-des-mers-updates/');
 first.elements.get('chroniques-updates-button').handlers.click();
 await new Promise(resolve=>setImmediate(resolve));
 const items=first.elements.get('chroniques-update-list').children;
 assert.equal(items.length,4);
 const install=items[1].children[1];
 assert.equal(install.dataset.installVersion,'1.2.2');
 await install.handlers.click();
 assert.ok(first.nav[0].endsWith('/versions/v1.2.2/index.html'));
 assert.equal(local.get(activeKey),'1.2.2');
 assert.equal(JSON.parse(local.get(backupKey)).values.chroniques_mers_profiles_v1,original);
 assert.equal(local.get('chroniques_mers_profiles_v1'),original);
 const second=start('/les-chroniques-des-mers-updates/versions/v1.2.2/index.html');
 second.elements.get('chroniques-updates-button').handlers.click();
 await new Promise(resolve=>setImmediate(resolve));
 const upgrade=second.elements.get('chroniques-update-list').children[2].children[1];
 await upgrade.handlers.click();
 assert.ok(second.nav[0].endsWith('/versions/v1.2.3/index.html'));
 assert.equal(local.get(activeKey),'1.2.3');
 assert.equal(local.get('chroniques_mers_profiles_v1'),original);
 const third=start('/les-chroniques-des-mers-updates/versions/v1.2.3/index.html');
 third.elements.get('chroniques-updates-button').handlers.click();
 await new Promise(resolve=>setImmediate(resolve));
 await third.elements.get('chroniques-update-list').children[3].children[1].handlers.click();
 assert.ok(third.nav[0].endsWith('/versions/v1.3.0/index.html'));
 assert.equal(local.get(activeKey),'1.3.0');
 assert.equal(local.get('chroniques_mers_profiles_v1'),original);
 const latest=start('/les-chroniques-des-mers-updates/versions/v1.3.0/index.html');
 latest.elements.get('chroniques-updates-button').handlers.click();
 await new Promise(resolve=>setImmediate(resolve));
 const rollback=latest.elements.get('chroniques-update-list').children[2].children[1];
 await rollback.handlers.click();
 assert.ok(latest.nav[0].endsWith('/versions/v1.2.3/index.html'));
 assert.equal(local.get(activeKey),'1.2.3');
 assert.equal(local.get('chroniques_mers_profiles_v1'),original);
 assert.equal(JSON.parse(local.get(backupKey)).values.chroniques_mers_profiles_v1,original);
 const previous=start('/les-chroniques-des-mers-updates/versions/v1.2.3/index.html');
 previous.elements.get('chroniques-updates-button').handlers.click();
 await new Promise(resolve=>setImmediate(resolve));
 await previous.elements.get('chroniques-update-list').children[1].children[1].handlers.click();
 assert.ok(previous.nav[0].endsWith('/versions/v1.2.2/index.html'));
 assert.equal(local.get(activeKey),'1.2.2');
 assert.equal(local.get('chroniques_mers_profiles_v1'),original);
 const stable=start('/les-chroniques-des-mers-updates/versions/v1.2.2/index.html');
 stable.elements.get('chroniques-updates-button').handlers.click();
 await new Promise(resolve=>setImmediate(resolve));
 await stable.elements.get('chroniques-update-list').children[0].children[1].handlers.click();
 assert.ok(stable.nav[0].endsWith('/versions/v1.2.1/index.html'));
 assert.equal(local.get(activeKey),'1.2.1');
 assert.equal(local.get('chroniques_mers_profiles_v1'),original);
 assert.equal(JSON.parse(local.get(backupKey)).values.chroniques_mers_profiles_v1,original);
 assert.ok(cacheMap.has('chroniques-web-versions-1.3.0'));
 assert.ok(cacheMap.has('chroniques-web-versions-1.2.3'));
 assert.ok(cacheMap.has('chroniques-web-versions-1.2.2'));
 assert.ok(cacheMap.has('chroniques-web-versions-1.2.1'));
});

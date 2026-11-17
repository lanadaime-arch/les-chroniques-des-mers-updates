import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {test} from 'node:test';
import path from 'node:path';

const root=path.resolve('.');
const manifest=JSON.parse(fs.readFileSync('game-versions.json','utf8'));
const read=pathName=>fs.readFileSync(path.isAbsolute(pathName)?pathName:path.join(root,pathName),'utf8');

test('quinze versions disponibles et des chemins locaux, sans publication externe',()=>{
 assert.equal(manifest.schema,1);
 assert.equal(manifest.latest,'1.4.3');
 assert.deepEqual(manifest.versions.map(v=>v.id),['1.2.1','1.2.2','1.2.3','1.3.0','1.3.3','1.3.4','1.3.5','1.3.6','1.3.7','1.3.8','1.3.9','1.4.0','1.4.1','1.4.2','1.4.3']);
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
 assert.ok(fs.statSync('versions/v1.3.3/theme-v133.css').isFile());
 assert.ok(fs.statSync('versions/v1.3.3/assets/chibi-captain.webp').isFile());
 assert.ok(fs.statSync('versions/v1.3.4/theme-v134.css').isFile());
 assert.ok(fs.statSync('versions/v1.3.4/assets/chibi-captain.webp').isFile());
 for(const f of ['theme-v135.css','assets/ocean-port-ponton.webp','assets/chibi-capitaine-azur.webp','assets/chibi-capitaine-flamme.webp','assets/chibi-capitaine-brume.webp'])
   assert.ok(fs.statSync('versions/v1.3.5/'+f).isFile(),f);
 for (const f of ['theme-v136.css','assets/chibi-avatar-azur.webp','assets/chibi-avatar-flamme.webp','assets/chibi-avatar-brume.webp'])
   assert.ok(fs.statSync('versions/v1.3.6/'+f).isFile(),f);
});
test('scripts JS des quinze versions et gestionnaire chargent sans erreurs de syntaxe',()=>{
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
 assert.ok(read('versions/v1.3.3/game.js').includes('lobby-root v133-menu'));
 assert.ok(read('versions/v1.3.3/game.js').includes('DÉMO · 1.3.3'));
 assert.ok(read('versions/v1.3.3/index.html').includes('theme-v133.css'));
 assert.ok(!read('versions/v1.3.0/index.html').includes('theme-v133.css'));
 assert.ok(read('versions/v1.3.4/game.js').includes('lobby-root v133-menu v134-menu'));
 assert.ok(read('versions/v1.3.4/index.html').includes('theme-v134.css'));
 assert.ok(read('versions/v1.3.4/game.js').includes('v134-free-stage'));
 assert.ok(!read('versions/v1.3.3/index.html').includes('theme-v134.css'));
 assert.ok(read('versions/v1.3.5/game.js').includes('lobby-root v133-menu v134-menu v135-menu'));
 assert.ok(read('versions/v1.3.5/index.html').includes('theme-v135.css'));
 assert.ok(!read('versions/v1.3.4/index.html').includes('theme-v135.css'));
 assert.ok(!read('versions/v1.3.5/game.js').includes('class="v134-pier"'));
 assert.ok(read('versions/v1.3.5/sw.js').includes('./assets/ocean-port-ponton.webp'));
 assert.ok(read('versions/v1.3.6/game.js').includes('lobby-root v133-menu v134-menu v135-menu v136-menu'));
 assert.ok(read('versions/v1.3.6/index.html').includes('theme-v136.css'));
 assert.ok(!read('versions/v1.3.5/index.html').includes('theme-v136.css'));
 assert.ok(read('versions/v1.3.6/sw.js').includes('./assets/chibi-avatar-brume.webp'));
 assert.ok(read('versions/v1.3.7/index.html').includes('theme-v137.css'));
 assert.ok(!read('versions/v1.3.6/index.html').includes('theme-v137.css'));
 assert.ok(read('versions/v1.3.7/game.js').includes('v137-lobby-dialog'));
 assert.ok(read('versions/v1.3.8/index.html').includes('theme-v138.css'));
 assert.ok(!read('versions/v1.3.7/index.html').includes('theme-v138.css'));
 assert.ok(read('versions/v1.3.8/game.js').includes('v138-chooser-grid'));
 assert.ok(read('versions/v1.3.9/game.js').includes('DÉMO · 1.3.9'));
 assert.ok(!read('versions/v1.3.9/game.js').includes('data-lobby-open="slots"><span aria-hidden="true"'));
 assert.ok(read('versions/v1.3.9/game.js').includes('id="lobby-characters"'));
 assert.ok(read('versions/v1.3.9/index.html').includes('theme-v138.css'));
 assert.ok(read('versions/v1.4.0/index.html').includes('theme-v140.css'));
 assert.ok(!read('versions/v1.3.9/index.html').includes('theme-v140.css'));
 assert.ok(read('versions/v1.4.0/game.js').includes('Village de Fuchsia'));
 assert.ok(read('versions/v1.4.0/game.js').includes('id:\'albe\''));
 assert.ok(read('versions/v1.4.0/game.js').includes('v140-fuchsia'));
 assert.ok(read('versions/v1.4.0/roam.js').includes('Fuchsia'));
 assert.ok(read('versions/v1.4.0/sw.js').includes('./assets/fuchsia-aube-quai.webp'));
 assert.ok(fs.statSync('versions/v1.4.0/theme-v140.css').isFile());
 assert.ok(fs.statSync('versions/v1.4.0/assets/fuchsia-aube-quai.webp').size>200000);
 assert.ok(read('versions/v1.3.8/sw.js').includes('./theme-v138.css'));
 assert.ok(fs.statSync('versions/v1.3.8/theme-v138.css').isFile());
 assert.ok(!read('versions/v1.3.6/game.js').includes('v137-lobby-dialog'));
});
test('V1.4.1 conserve le vrai chargeur et tous les composants du créateur',()=>{
 const dir='versions/v1.4.1/', html=read(dir+'index.html'), game=read(dir+'game.js'), sw=read(dir+'sw.js');
 for(const file of ['theme-v141.css','captain-rig.js','captain-rig.css','captain-ribbon-masks.js','captain-customization.css']){
  assert.ok(fs.statSync(dir+file).isFile(),file);
  assert.ok(html.includes(file),file+' HTML');
  assert.ok(sw.includes('./'+file),file+' SW');
  assert.ok(read('update-manager.js').includes("'"+file+"'"),file+' mise a jour');
 }
 assert.ok(game.includes('V1.4.1'));
 assert.ok(game.includes('customization'));
 assert.ok(game.includes('chroniques_mers_profiles_v1'));
 assert.ok(!read('versions/v1.4.0/index.html').includes('captain-rig.js'));
});
test('V1.4.2: menu PC premium sans écraser les versions antérieures',()=>{
 const dir='versions/v1.4.2/';
 const html=read(dir+'index.html'),game=read(dir+'game.js'),style=read(dir+'theme-v142.css'),sw=read(dir+'sw.js');
 assert.ok(html.includes('href="theme-v142.css"'));
 assert.ok(html.includes('src="../../update-manager.js"'));
 assert.ok(html.includes('href="../../update-manager.css"'));
 assert.ok(sw.includes('./theme-v142.css'));
 assert.ok(read('update-manager.js').includes("'theme-v142.css'"));
 assert.ok(game.includes('v142-menu'));
 assert.ok(game.includes('V1.4.2'));
 assert.ok(game.includes('chroniques_mers_profiles_v1'));
 assert.ok(style.includes('v133-play'));
 assert.ok(style.includes('max-height:940px'));
 assert.ok(!read('versions/v1.4.1/index.html').includes('theme-v142.css'));
});
test('V1.4.3 menu PC riche et SVG décoratif correctement installés',()=>{
 const dir='versions/v1.4.3/';
 const html=read(dir+'index.html'),game=read(dir+'game.js'),sw=read(dir+'sw.js'),css=read(dir+'theme-v143.css');
 const image=read(dir+'assets/v143-wave-flourish.svg');
 assert.ok(html.includes('href="theme-v143.css"'));
 assert.ok(html.includes('src="../../update-manager.js"'));
 assert.ok(html.includes('href="../../update-manager.css"'));
 assert.ok(game.includes('v143-menu'));
 assert.ok(game.includes('V1.4.3'));
 assert.ok(game.includes('v143-nav-crest'));
 assert.ok(game.includes('chroniques_mers_profiles_v1'));
 assert.ok(css.includes('assets/v143-wave-flourish.svg'));
 assert.ok(image.includes('<svg'));
 assert.ok(sw.includes('./theme-v143.css'));
 assert.ok(sw.includes('./assets/v143-wave-flourish.svg'));
 assert.ok(read('update-manager.js').includes("'theme-v143.css'"));
 assert.ok(read('update-manager.js').includes("'assets/v143-wave-flourish.svg'"));
 assert.ok(!read('versions/v1.4.2/index.html').includes('theme-v143.css'));
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
 assert.equal(items.length,15);
 const hidden=items.filter(line=>line.hidden);
 assert.ok(hidden.length>=5,'Les anciennes versions sont repliees par defaut');
 assert.equal(first.elements.get('chroniques-update-history-toggle').hidden,false);
 first.elements.get('chroniques-update-history-toggle').handlers.click();
 assert.ok(items.every(line=>line.hidden===false),'Le bouton historique revele toutes les versions');
 first.elements.get('chroniques-update-history-toggle').handlers.click();
 assert.ok(items.some(line=>line.hidden),'Le bouton replie a nouveau les versions anciennes');
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
 const fourth=start('/les-chroniques-des-mers-updates/versions/v1.3.0/index.html');
 fourth.elements.get('chroniques-updates-button').handlers.click();
 await new Promise(resolve=>setImmediate(resolve));
 await fourth.elements.get('chroniques-update-list').children[4].children[1].handlers.click();
 assert.ok(fourth.nav[0].endsWith('/versions/v1.3.3/index.html'));
 assert.equal(local.get(activeKey),'1.3.3');
 assert.equal(local.get('chroniques_mers_profiles_v1'),original);
 const fifth=start('/les-chroniques-des-mers-updates/versions/v1.3.3/index.html');
 fifth.elements.get('chroniques-updates-button').handlers.click();
 await new Promise(resolve=>setImmediate(resolve));
 await fifth.elements.get('chroniques-update-list').children[5].children[1].handlers.click();
 assert.ok(fifth.nav[0].endsWith('/versions/v1.3.4/index.html'));
 assert.equal(local.get(activeKey),'1.3.4');
 assert.equal(local.get('chroniques_mers_profiles_v1'),original);
 const sixth=start('/les-chroniques-des-mers-updates/versions/v1.3.4/index.html');
 sixth.elements.get('chroniques-updates-button').handlers.click();
 await new Promise(resolve=>setImmediate(resolve));
 await sixth.elements.get('chroniques-update-list').children[6].children[1].handlers.click();
 assert.ok(sixth.nav[0].endsWith('/versions/v1.3.5/index.html'));
 assert.equal(local.get(activeKey),'1.3.5');
 assert.equal(local.get('chroniques_mers_profiles_v1'),original);
 const seventh=start('/les-chroniques-des-mers-updates/versions/v1.3.5/index.html');
 seventh.elements.get('chroniques-updates-button').handlers.click();
 await new Promise(resolve=>setImmediate(resolve));
 await seventh.elements.get('chroniques-update-list').children[7].children[1].handlers.click();
 assert.ok(seventh.nav[0].endsWith('/versions/v1.3.6/index.html'));
 assert.equal(local.get(activeKey),'1.3.6');
 assert.equal(local.get('chroniques_mers_profiles_v1'),original);
 const eighth=start('/les-chroniques-des-mers-updates/versions/v1.3.6/index.html');
 eighth.elements.get('chroniques-updates-button').handlers.click();
 await new Promise(resolve=>setImmediate(resolve));
 await eighth.elements.get('chroniques-update-list').children[8].children[1].handlers.click();
 assert.ok(eighth.nav[0].endsWith('/versions/v1.3.7/index.html'));
 assert.equal(local.get(activeKey),'1.3.7');
 assert.equal(local.get('chroniques_mers_profiles_v1'),original);
 const ninth=start('/les-chroniques-des-mers-updates/versions/v1.3.7/index.html');
 ninth.elements.get('chroniques-updates-button').handlers.click();
 await new Promise(resolve=>setImmediate(resolve));
 await ninth.elements.get('chroniques-update-list').children[9].children[1].handlers.click();
 assert.ok(ninth.nav[0].endsWith('/versions/v1.3.8/index.html'));
 assert.equal(local.get(activeKey),'1.3.8');
 assert.equal(local.get('chroniques_mers_profiles_v1'),original);
 const tenth=start('/les-chroniques-des-mers-updates/versions/v1.3.8/index.html');
 tenth.elements.get('chroniques-updates-button').handlers.click();
 await new Promise(resolve=>setImmediate(resolve));
 await tenth.elements.get('chroniques-update-list').children[10].children[1].handlers.click();
 assert.ok(tenth.nav[0].endsWith('/versions/v1.3.9/index.html'));
 assert.equal(local.get(activeKey),'1.3.9');
 assert.equal(local.get('chroniques_mers_profiles_v1'),original);
 const eleventh=start('/les-chroniques-des-mers-updates/versions/v1.3.9/index.html');
 eleventh.elements.get('chroniques-updates-button').handlers.click();
 await new Promise(resolve=>setImmediate(resolve));
 await eleventh.elements.get('chroniques-update-list').children[11].children[1].handlers.click();
 assert.ok(eleventh.nav[0].endsWith('/versions/v1.4.0/index.html'));
 assert.equal(local.get(activeKey),'1.4.0');
 assert.equal(local.get('chroniques_mers_profiles_v1'),original);
 const staged=start('/les-chroniques-des-mers-updates/versions/v1.4.0/index.html');
 staged.elements.get('chroniques-updates-button').handlers.click();
 await new Promise(resolve=>setImmediate(resolve));
 await staged.elements.get('chroniques-update-list').children[12].children[1].handlers.click();
 assert.ok(staged.nav[0].endsWith('/versions/v1.4.1/index.html'));
 assert.equal(local.get(activeKey),'1.4.1');
 assert.equal(local.get('chroniques_mers_profiles_v1'),original);
 const staged142=start('/les-chroniques-des-mers-updates/versions/v1.4.1/index.html');
 staged142.elements.get('chroniques-updates-button').handlers.click();
 await new Promise(resolve=>setImmediate(resolve));
 await staged142.elements.get('chroniques-update-list').children[13].children[1].handlers.click();
 assert.ok(staged142.nav[0].endsWith('/versions/v1.4.2/index.html'));
 assert.equal(local.get(activeKey),'1.4.2');
 assert.equal(local.get('chroniques_mers_profiles_v1'),original);
 const installed143=start('/les-chroniques-des-mers-updates/versions/v1.4.2/index.html');
 installed143.elements.get('chroniques-updates-button').handlers.click();
 await new Promise(resolve=>setImmediate(resolve));
 await installed143.elements.get('chroniques-update-list').children[14].children[1].handlers.click();
 assert.ok(installed143.nav[0].endsWith('/versions/v1.4.3/index.html'));
 assert.equal(local.get(activeKey),'1.4.3');
 assert.equal(local.get('chroniques_mers_profiles_v1'),original);
 const rollback143=start('/les-chroniques-des-mers-updates/versions/v1.4.3/index.html');
 rollback143.elements.get('chroniques-updates-button').handlers.click();
 await new Promise(resolve=>setImmediate(resolve));
 await rollback143.elements.get('chroniques-update-list').children[13].children[1].handlers.click();
 assert.ok(rollback143.nav[0].endsWith('/versions/v1.4.2/index.html'));
 assert.equal(local.get(activeKey),'1.4.2');
 assert.equal(local.get('chroniques_mers_profiles_v1'),original);
 const rollback142=start('/les-chroniques-des-mers-updates/versions/v1.4.2/index.html');
 rollback142.elements.get('chroniques-updates-button').handlers.click();
 await new Promise(resolve=>setImmediate(resolve));
 await rollback142.elements.get('chroniques-update-list').children[12].children[1].handlers.click();
 assert.ok(rollback142.nav[0].endsWith('/versions/v1.4.1/index.html'));
 assert.equal(local.get(activeKey),'1.4.1');
 assert.equal(local.get('chroniques_mers_profiles_v1'),original);
 const preview=start('/les-chroniques-des-mers-updates/versions/v1.4.1/index.html');
 preview.elements.get('chroniques-updates-button').handlers.click();
 await new Promise(resolve=>setImmediate(resolve));
 await preview.elements.get('chroniques-update-list').children[11].children[1].handlers.click();
 assert.ok(preview.nav[0].endsWith('/versions/v1.4.0/index.html'));
 assert.equal(local.get(activeKey),'1.4.0');
 assert.equal(local.get('chroniques_mers_profiles_v1'),original);
 const latest=start('/les-chroniques-des-mers-updates/versions/v1.4.0/index.html');
 latest.elements.get('chroniques-updates-button').handlers.click();
 await new Promise(resolve=>setImmediate(resolve));
 const rollback=latest.elements.get('chroniques-update-list').children[10].children[1];
 await rollback.handlers.click();
 assert.ok(latest.nav[0].endsWith('/versions/v1.3.9/index.html'));
 assert.equal(local.get(activeKey),'1.3.9');
 assert.equal(local.get('chroniques_mers_profiles_v1'),original);
 assert.equal(JSON.parse(local.get(backupKey)).values.chroniques_mers_profiles_v1,original);
 const eleventhBack=start('/les-chroniques-des-mers-updates/versions/v1.3.9/index.html');
 eleventhBack.elements.get('chroniques-updates-button').handlers.click();
 await new Promise(resolve=>setImmediate(resolve));
 await eleventhBack.elements.get('chroniques-update-list').children[9].children[1].handlers.click();
 assert.ok(eleventhBack.nav[0].endsWith('/versions/v1.3.8/index.html'));
 assert.equal(local.get(activeKey),'1.3.8');
 assert.equal(local.get('chroniques_mers_profiles_v1'),original);
 const tenthBack=start('/les-chroniques-des-mers-updates/versions/v1.3.8/index.html');
 tenthBack.elements.get('chroniques-updates-button').handlers.click();
 await new Promise(resolve=>setImmediate(resolve));
 await tenthBack.elements.get('chroniques-update-list').children[8].children[1].handlers.click();
 assert.ok(tenthBack.nav[0].endsWith('/versions/v1.3.7/index.html'));
 assert.equal(local.get(activeKey),'1.3.7');
 assert.equal(local.get('chroniques_mers_profiles_v1'),original);
 const ninthBack=start('/les-chroniques-des-mers-updates/versions/v1.3.7/index.html');
 ninthBack.elements.get('chroniques-updates-button').handlers.click();
 await new Promise(resolve=>setImmediate(resolve));
 await ninthBack.elements.get('chroniques-update-list').children[7].children[1].handlers.click();
 assert.ok(ninthBack.nav[0].endsWith('/versions/v1.3.6/index.html'));
 assert.equal(local.get(activeKey),'1.3.6');
 assert.equal(local.get('chroniques_mers_profiles_v1'),original);
 const eighthBack=start('/les-chroniques-des-mers-updates/versions/v1.3.6/index.html');
 eighthBack.elements.get('chroniques-updates-button').handlers.click();
 await new Promise(resolve=>setImmediate(resolve));
 await eighthBack.elements.get('chroniques-update-list').children[6].children[1].handlers.click();
 assert.ok(eighthBack.nav[0].endsWith('/versions/v1.3.5/index.html'));
 assert.equal(local.get(activeKey),'1.3.5');
 assert.equal(local.get('chroniques_mers_profiles_v1'),original);
 const seventhBack=start('/les-chroniques-des-mers-updates/versions/v1.3.5/index.html');
 seventhBack.elements.get('chroniques-updates-button').handlers.click();
 await new Promise(resolve=>setImmediate(resolve));
 await seventhBack.elements.get('chroniques-update-list').children[5].children[1].handlers.click();
 assert.ok(seventhBack.nav[0].endsWith('/versions/v1.3.4/index.html'));
 assert.equal(local.get(activeKey),'1.3.4');
 assert.equal(local.get('chroniques_mers_profiles_v1'),original);
 const sixthBack=start('/les-chroniques-des-mers-updates/versions/v1.3.4/index.html');
 sixthBack.elements.get('chroniques-updates-button').handlers.click();
 await new Promise(resolve=>setImmediate(resolve));
 await sixthBack.elements.get('chroniques-update-list').children[4].children[1].handlers.click();
 assert.ok(sixthBack.nav[0].endsWith('/versions/v1.3.3/index.html'));
 assert.equal(local.get(activeKey),'1.3.3');
 assert.equal(local.get('chroniques_mers_profiles_v1'),original);
 const fifthBack=start('/les-chroniques-des-mers-updates/versions/v1.3.3/index.html');
 fifthBack.elements.get('chroniques-updates-button').handlers.click();
 await new Promise(resolve=>setImmediate(resolve));
 await fifthBack.elements.get('chroniques-update-list').children[3].children[1].handlers.click();
 assert.ok(fifthBack.nav[0].endsWith('/versions/v1.3.0/index.html'));
 assert.equal(local.get(activeKey),'1.3.0');
 assert.equal(local.get('chroniques_mers_profiles_v1'),original);
 const thirdBack=start('/les-chroniques-des-mers-updates/versions/v1.3.0/index.html');
 thirdBack.elements.get('chroniques-updates-button').handlers.click();
 await new Promise(resolve=>setImmediate(resolve));
 await thirdBack.elements.get('chroniques-update-list').children[2].children[1].handlers.click();
 assert.ok(thirdBack.nav[0].endsWith('/versions/v1.2.3/index.html'));
 assert.equal(local.get(activeKey),'1.2.3');
 assert.equal(local.get('chroniques_mers_profiles_v1'),original);
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
 assert.ok(cacheMap.has('chroniques-web-versions-1.4.0'));
 assert.ok(cacheMap.has('chroniques-web-versions-1.3.9'));
 assert.ok(cacheMap.has('chroniques-web-versions-1.3.8'));
 assert.ok(cacheMap.has('chroniques-web-versions-1.3.7'));
 assert.ok(cacheMap.has('chroniques-web-versions-1.3.6'));
 assert.ok(cacheMap.has('chroniques-web-versions-1.3.5'));
 assert.ok(cacheMap.has('chroniques-web-versions-1.3.4'));
 assert.ok(cacheMap.has('chroniques-web-versions-1.3.3'));
 assert.ok(cacheMap.has('chroniques-web-versions-1.3.0'));
 assert.ok(cacheMap.has('chroniques-web-versions-1.2.3'));
 assert.ok(cacheMap.has('chroniques-web-versions-1.2.2'));
 assert.ok(cacheMap.has('chroniques-web-versions-1.2.1'));
});

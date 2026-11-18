/* Les Chroniques des Mers — mises a jour web pour l'application Windows existante.
 * Utilise seulement le meme domaine HTTPS et les sauvegardes localStorage deja presentes.
 * Ne telecharge et n'execute aucun installateur Windows.
 */
(() => {
  'use strict';
  const scriptUrl = document.currentScript && document.currentScript.src;
  if (!scriptUrl) return;
  const root = new URL('./', scriptUrl);
  if (location.origin !== root.origin || !location.pathname.startsWith(root.pathname)) return;
  const STORE = 'chroniques_mers_active_web_version_v1';
  const BACKUP = 'chroniques_mers_pre_update_backup_v1';
  const SAVE_KEYS = ['chroniques_mers_profiles_v1', 'chroniques_mers_solo_v1'];
  const STABLE = '1.2.1';
  const ALLOWED_DIR = /^versions\/v[0-9]+\.[0-9]+\.[0-9]+\/$/;
  const FILES = [
    'index.html', 'game.js', 'roam.js', 'tactics.js', 'fruit-data.js',
    'style.css', 'theme-v08.css', 'theme-v09.css', 'theme-v091.css',
    'theme-v10.css', 'theme-v11.css', 'theme-v12.css', 'theme-v121.css',
    'icon.svg', 'manifest.webmanifest', 'sw.js',
    'assets/harbor-portrait.webp', 'assets/ocean-port.webp', 'assets/wave-texture.png'
  ];
  const state = {manifest:null, busy:false, historyExpanded:false};
  const versionFromPath = () => {
    const sub = location.pathname.slice(root.pathname.length);
    const match = /^versions\/v([0-9]+\.[0-9]+\.[0-9]+)\/(?:index\.html)?$/.exec(sub);
    return match ? match[1] : STABLE;
  };
  function parseManifest(data) {
    if (!data || data.schema !== 1 || !Array.isArray(data.versions) || data.versions.length < 2) {
      throw Error('Catalogue de mises à jour invalide.');
    }
    const versions = data.versions.map(v => {
      if (!v || !/^\d+\.\d+\.\d+$/.test(v.id) || typeof v.directory !== 'string' || !ALLOWED_DIR.test(v.directory) || v.directory !== 'versions/v' + v.id + '/') {
        throw Error('Chemin de version refusé.');
      }
      return {id:v.id, directory:v.directory, notes:String(v.notes||'').slice(0,160)};
    });
    if (!versions.some(v => v.id === STABLE) || !versions.some(v => v.id === data.latest) ||
        new Set(versions.map(v => v.id)).size !== versions.length) {
      throw Error('Versions incohérentes.');
    }
    return {latest:data.latest,versions};
  }
  async function manifest() {
    if (state.manifest) return state.manifest;
    const response = await fetch(new URL('game-versions.json', root), {cache:'no-store'});
    if (!response.ok) throw Error('Catalogue indisponible : connexion nécessaire.');
    const raw = await response.json();
    state.manifest = parseManifest(raw);
    return state.manifest;
  }
  function fileUrl(version, file) {
    return new URL(file, new URL(version.directory, root));
  }
  function updateStatus(message, isError) {
    const out = document.getElementById('chroniques-update-status');
    if (out) {
      out.textContent = message;
      out.classList.toggle('error', Boolean(isError));
    }
  }
  function createBackup(from, to) {
    const previous = {};
    for (const key of SAVE_KEYS) previous[key] = localStorage.getItem(key);
    const backup = {schema:1,created:new Date().toISOString(),from,to,values:previous};
    // Refuse le changement si le navigateur ne peut pas conserver cette copie.
    localStorage.setItem(BACKUP,JSON.stringify(backup));
    const roundTrip = JSON.parse(localStorage.getItem(BACKUP) || 'null');
    if (!roundTrip || roundTrip.schema !== 1 || roundTrip.from !== from || roundTrip.to !== to ||
        SAVE_KEYS.some(k => roundTrip.values[k] !== previous[k])) {
      throw Error('Impossible de vérifier la sauvegarde avant mise à jour.');
    }
  }
  async function cacheVersion(version) {
    if (!('caches' in window)) throw Error('Téléchargement hors ligne indisponible dans ce navigateur.');
    const cacheName = 'chroniques-web-versions-' + version.id;
    const temporary = cacheName + '-incomplete';
    await caches.delete(temporary);
    const targetCache = await caches.open(temporary);
    try {
      const urls = FILES.slice();
      if (['1.2.2','1.2.3','1.3.0','1.3.3','1.3.4','1.3.5','1.3.6','1.3.7','1.3.8','1.3.9','1.4.0','1.4.1','1.4.2','1.4.3','1.4.4','1.4.5','1.4.6','1.4.7','1.4.8'].includes(version.id)) urls.push('theme-v122.css');
      if (['1.2.3','1.3.0','1.3.3','1.3.4','1.3.5','1.3.6','1.3.7','1.3.8','1.3.9','1.4.0','1.4.1','1.4.2','1.4.3','1.4.4','1.4.5','1.4.6','1.4.7','1.4.8'].includes(version.id)) urls.push('theme-v123.css');
      if (['1.3.0','1.3.3','1.3.4','1.3.5','1.3.6','1.3.7','1.3.8','1.3.9','1.4.0','1.4.1','1.4.2','1.4.3','1.4.4','1.4.5','1.4.6','1.4.7','1.4.8'].includes(version.id)) urls.push('theme-v130.css');
      if (['1.3.3','1.3.4','1.3.5','1.3.6','1.3.7','1.3.8','1.3.9','1.4.0','1.4.1','1.4.2','1.4.3','1.4.4','1.4.5','1.4.6','1.4.7','1.4.8'].includes(version.id)) urls.push('theme-v133.css', 'assets/chibi-captain.webp');
      if (['1.3.4','1.3.5','1.3.6','1.3.7','1.3.8','1.3.9','1.4.0','1.4.1','1.4.2','1.4.3','1.4.4','1.4.5','1.4.6','1.4.7','1.4.8'].includes(version.id)) urls.push('theme-v134.css');
      if (['1.3.5','1.3.6','1.3.7','1.3.8','1.3.9','1.4.0','1.4.1','1.4.2','1.4.3','1.4.4','1.4.5','1.4.6','1.4.7','1.4.8'].includes(version.id)) urls.push('theme-v135.css', 'assets/ocean-port-ponton.webp', 'assets/chibi-capitaine-azur.webp', 'assets/chibi-capitaine-flamme.webp', 'assets/chibi-capitaine-brume.webp');
      if (['1.3.6','1.3.7','1.3.8','1.3.9','1.4.0','1.4.1','1.4.2','1.4.3','1.4.4','1.4.5','1.4.6','1.4.7','1.4.8'].includes(version.id)) urls.push('theme-v136.css', 'assets/chibi-avatar-azur.webp', 'assets/chibi-avatar-flamme.webp', 'assets/chibi-avatar-brume.webp');
      if (['1.3.7','1.3.8','1.3.9','1.4.0','1.4.1','1.4.2','1.4.3','1.4.4','1.4.5','1.4.6','1.4.7','1.4.8'].includes(version.id)) urls.push('theme-v137.css');
      if (['1.3.8','1.3.9','1.4.0','1.4.1','1.4.2','1.4.3','1.4.4','1.4.5','1.4.6','1.4.7','1.4.8'].includes(version.id)) urls.push('theme-v138.css');
      if (version.id === '1.4.0') urls.push('theme-v140.css','assets/fuchsia-aube-quai.webp');
      if (version.id === '1.4.1') urls.push('theme-v140.css','assets/fuchsia-aube-quai.webp','theme-v141.css','captain-rig.css','captain-rig.js','captain-customization.css','captain-ribbon-masks.js');
      if (version.id === '1.4.2') urls.push('theme-v140.css','assets/fuchsia-aube-quai.webp','theme-v141.css','captain-rig.css','captain-rig.js','captain-customization.css','captain-ribbon-masks.js','theme-v142.css');
      if (version.id === '1.4.3') urls.push('theme-v140.css','assets/fuchsia-aube-quai.webp','theme-v141.css','captain-rig.css','captain-rig.js','captain-customization.css','captain-ribbon-masks.js','theme-v142.css','theme-v143.css','assets/v143-wave-flourish.svg');
      if (version.id === '1.4.4') urls.push('theme-v140.css','assets/fuchsia-aube-quai.webp','theme-v141.css','captain-rig.css','captain-rig.js','captain-customization.css','captain-ribbon-masks.js','theme-v142.css','theme-v143.css','assets/v143-wave-flourish.svg','theme-v144.css');
      if (version.id === '1.4.5') urls.push('theme-v140.css','assets/fuchsia-aube-quai.webp','theme-v141.css','captain-rig.css','captain-rig.js','captain-customization.css','captain-ribbon-masks.js','theme-v142.css','theme-v143.css','assets/v143-wave-flourish.svg','theme-v144.css','theme-v145.css','assets/v145-crew.svg','assets/v145-map.svg','assets/v145-sword.svg','assets/v145-inventory.svg','assets/v145-tech.svg','assets/v145-journal.svg');
      if (version.id === '1.4.6') urls.push('theme-v140.css','assets/fuchsia-aube-quai.webp','theme-v141.css','captain-rig.css','captain-rig.js','captain-customization.css','captain-ribbon-masks.js','theme-v142.css','theme-v143.css','assets/v143-wave-flourish.svg','theme-v144.css','theme-v145.css','assets/v145-crew.svg','assets/v145-map.svg','assets/v145-sword.svg','assets/v145-inventory.svg','assets/v145-tech.svg','assets/v145-journal.svg','captain-presence.js','captain-presence.css');
      if (version.id === '1.4.7') urls.push('theme-v140.css','assets/fuchsia-aube-quai.webp','theme-v141.css','captain-rig.css','captain-rig.js','captain-customization.css','captain-ribbon-masks.js','theme-v142.css','theme-v143.css','assets/v143-wave-flourish.svg','theme-v144.css','theme-v145.css','assets/v145-crew.svg','assets/v145-map.svg','assets/v145-sword.svg','assets/v145-inventory.svg','assets/v145-tech.svg','assets/v145-journal.svg','captain-presence.js','captain-presence.css');
      if (version.id === '1.4.8') urls.push('theme-v140.css','assets/fuchsia-aube-quai.webp','theme-v141.css','captain-rig.css','captain-rig.js','captain-customization.css','captain-ribbon-masks.js','theme-v142.css','theme-v143.css','assets/v143-wave-flourish.svg','theme-v144.css','theme-v145.css','assets/v145-crew.svg','assets/v145-map.svg','assets/v145-sword.svg','assets/v145-inventory.svg','assets/v145-tech.svg','assets/v145-journal.svg','captain-presence.js','captain-presence.css','character-v2-prototype.js','character-v2-prototype.css');
      // The updater is shared at the same origin, and is usable in both versions.
      const resources = urls.map(file => fileUrl(version,file));
      resources.push(new URL('update-manager.js',root),new URL('update-manager.css',root));
      if(['1.4.7','1.4.8'].includes(version.id))resources.push(new URL('loading-screen.js',root),new URL('loading-screen.css',root));
      for (let i=0;i<resources.length;i++) {
        const url = resources[i];
        const response = await fetch(url,{cache:'reload'});
        if (!response.ok || response.type === 'opaque') throw Error('Fichier de jeu indisponible : '+url.pathname);
        const type = response.headers.get('content-type') || '';
        if (/\.(js|css)$/.test(url.pathname) && /text\/html/i.test(type)) throw Error('Fichier de jeu incorrect : '+url.pathname);
        await targetCache.put(url,response);
        updateStatus('Téléchargement et contrôle : '+(i+1)+' / '+resources.length,false);
      }
      // Make the package available under a stable name only when completely cached.
      await caches.delete(cacheName);
      const finalCache = await caches.open(cacheName);
      const cachedRequests = await targetCache.keys();
      for (const url of cachedRequests) {
        const response = await targetCache.match(url);
        if (!response) throw Error('Archive incomplète.');
        await finalCache.put(url,response);
      }
    } finally {
      await caches.delete(temporary);
    }
  }
  async function install(id) {
    if (state.busy) return;
    state.busy=true;
    const buttons = document.querySelectorAll('#chroniques-updates-dialog button[data-install-version]');
    buttons.forEach(button => button.disabled=true);
    try {
      const catalogue = await manifest();
      const choice = catalogue.versions.find(v => v.id === id);
      if (!choice) throw Error('Cette version n’est pas disponible.');
      const current = versionFromPath();
      if (id === current) { updateStatus('Cette version est déjà active.',false);return; }
      updateStatus('Téléchargement de la version '+id+'…',false);
      await cacheVersion(choice);
      updateStatus('Vérification des personnages…',false);
      createBackup(current,id);
      localStorage.setItem(STORE,id);
      // The web origin stays EXACTLY the same: all existing save slots remain accessible.
      location.assign(fileUrl(choice,'index.html').href);
    } catch (error) {
      updateStatus('Mise à jour non effectuée : '+String(error.message||error),true);
    } finally {
      state.busy=false;
      buttons.forEach(button => button.disabled=false);
    }
  }
  async function drawCatalogue() {
    const list = document.getElementById('chroniques-update-list');
    if (!list) return;
    list.textContent='Recherche des versions disponibles…';
    try {
      const catalogue=await manifest();
      const current=versionFromPath();
      list.replaceChildren();
      const currentIndex=catalogue.versions.findIndex(v=>v.id===current);
      const previous=catalogue.versions[Math.max(0,currentIndex-1)]?.id;
      const highlighted=new Set([current,catalogue.latest,previous]);
      let archived=0;
      for (const version of catalogue.versions) {
        const line=document.createElement('div');
        line.className='chroniques-update-version';
        const isOlder=!highlighted.has(version.id);
        line.dataset.history=isOlder?'older':'recent';
        line.hidden=isOlder&&!state.historyExpanded;
        if(isOlder)archived++;
        const left=document.createElement('div');
        const heading=document.createElement('strong');
        heading.textContent='Version '+version.id+(version.id===current?' · installée':'')+(version.id===catalogue.latest?' · dernière':'');
        const note=document.createElement('small');
        note.textContent=version.notes;
        left.append(heading,note);line.append(left);
        const button=document.createElement('button');
        button.type='button';button.dataset.installVersion=version.id;
        button.disabled=version.id===current;
        button.textContent=version.id===current?'Actuelle':(version.id===STABLE?'Revenir à cette version':'Télécharger et installer');
        button.addEventListener('click',()=>install(version.id));
        line.append(button);list.append(line);
      }
      const olderButton=document.getElementById('chroniques-update-history-toggle');
      if(olderButton){
        olderButton.hidden=archived===0;
        olderButton.textContent=state.historyExpanded?'Masquer les anciennes versions':'Afficher les '+archived+' anciennes versions';
      }
    } catch (error) {
      list.textContent='Connexion impossible : '+String(error.message||error);
    }
  }
  function init() {
    // The original app always opens the root URL. Return to the selected version
    // at launch, without changing the original Windows shortcut or the domain.
    const sub = location.pathname.slice(root.pathname.length);
    const isRoot = sub==='' || sub==='index.html';
    const active=localStorage.getItem(STORE);
    if (isRoot && active && active!==STABLE && /^\d+\.\d+\.\d+$/.test(active)) {
      const path='versions/v'+active+'/index.html';
      const target=new URL(path,root);
      // L'ancien accueil ne s'initialise pas avant le verdict. Sa page reste
      // le repli sûr si la version n'est plus présente.
      const fallback=()=>{
        if(window.ChroniquesRootBoot?.pending)window.ChroniquesRootBoot.fallback();
        else document.documentElement?.classList?.remove?.('chroniques-root-routing');
      };
      const cached=async()=>{
        try{
          if(!('caches' in window))return false;
          const cache=await window.caches.open('chroniques-web-versions-'+active);
          return !!(await cache.match(target.href));
        }catch{return false;}
      };
      const check=async()=>{
        try{
          const response=await fetch(target,{method:'HEAD',cache:'no-store'});
          if(response.ok){location.replace(target.href);return;}
          // Une version supprimée du serveur déclenche un vrai repli, sans
          // détruire les personnages ou les caches des autres versions.
          if(response.status===404||response.status===410){
            localStorage.removeItem(STORE);fallback();return;
          }
        }catch{}
        // Offline : la version déjà installée peut rester jouable depuis son cache.
        if(await cached())location.replace(target.href);
        else fallback();
      };
      check();
    }
    if (document.getElementById('chroniques-updates-button')) return;
    const button=document.createElement('button');
    button.id='chroniques-updates-button';
    button.type='button';
    button.textContent='↻ Mises à jour';
    button.setAttribute('aria-haspopup','dialog');
    const dialog=document.createElement('section');
    dialog.id='chroniques-updates-dialog';
    dialog.hidden=true;
    dialog.setAttribute('role','dialog');
    dialog.setAttribute('aria-modal','true');
    dialog.setAttribute('aria-label','Mises à jour du jeu');
    dialog.innerHTML='<header><strong>↻ Mises à jour du jeu</strong><button type="button" id="chroniques-updates-close" aria-label="Fermer">✕</button></header>'+
      '<p>Version active : <strong id="chroniques-update-current"></strong>. Les personnages restent sur cet appareil. Une copie de sécurité est créée avant chaque changement.</p>'+
      '<div id="chroniques-update-list"></div><button type="button" id="chroniques-update-history-toggle" hidden>Afficher les anciennes versions</button><p id="chroniques-update-status" role="status" aria-live="polite"></p>'+
      '<small>Les mises à jour modifient uniquement le contenu du jeu, jamais l’installation Windows.</small>';
    document.body.append(button,dialog);
    const close=()=>{dialog.hidden=true;button.focus();};
    document.getElementById('chroniques-update-history-toggle').addEventListener('click',()=>{
      state.historyExpanded=!state.historyExpanded;
      const list=document.getElementById('chroniques-update-list');
      if(list)Array.from(list.children).forEach(line=>{if(line.dataset.history==='older')line.hidden=!state.historyExpanded;});
      const toggle=document.getElementById('chroniques-update-history-toggle');
      const count=list?Array.from(list.children).filter(line=>line.dataset.history==='older').length:0;
      toggle.textContent=state.historyExpanded?'Masquer les anciennes versions':'Afficher les '+count+' anciennes versions';
    });
    document.getElementById('chroniques-updates-close').addEventListener('click',close);
    button.addEventListener('click',()=>{
      dialog.hidden=!dialog.hidden;
      if(!dialog.hidden){
        document.getElementById('chroniques-update-current').textContent=versionFromPath();
        updateStatus('',false);
        state.historyExpanded=false;
        drawCatalogue();
        document.getElementById('chroniques-updates-close').focus();
      }
    });
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!dialog.hidden)close();});
  }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();

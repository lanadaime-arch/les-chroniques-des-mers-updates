/* Écran de chargement partagé entre la racine Windows et le jeu V1.4.7.
 * La barre représente trois jalons réels, pas un pourcentage de téléchargement inventé.
 * Ne stocke aucune donnée et n'introduit aucune attente artificielle. */
(function(){
  'use strict';
  if(typeof document==='undefined')return;
  const splash=document.getElementById('chroniques-loading');
  if(!splash)return;
  const bar=splash.querySelector('.chroniques-loading-progress');
  const fill=document.getElementById('chroniques-loading-progress-fill');
  const stageText=document.getElementById('chroniques-loading-stage');
  const tip=document.getElementById('chroniques-loading-tip');
  const retry=document.getElementById('chroniques-loading-retry');
  let last=0,finishing=false;
  const tips=[
    'Conseil : explore chaque île pour découvrir ses secrets.',
    'Conseil : tes quatre emplacements de personnage restent sur cet appareil.',
    'Conseil : tu peux retrouver les anciennes versions dans Mises à jour.',
    'Conseil : les quêtes suivies t’aident à progresser dans chaque région.'
  ];
  if(tip)tip.textContent=tips[Math.floor(Math.random()*tips.length)];
  function advance(step,message){
    if(finishing||step<last)return;
    last=step;
    if(bar)bar.setAttribute('aria-valuenow',String(step));
    if(fill)fill.style.width=String(step/3*100)+'%';
    if(stageText&&message)stageText.textContent=message;
  }
  function whenFrame(action){
    if(typeof requestAnimationFrame==='function'){
      requestAnimationFrame(()=>requestAnimationFrame(action));
    }else action();
  }
  function imageReady(image){
    if(!image||image.complete)return Promise.resolve();
    return new Promise(resolve=>{
      image.addEventListener('load',resolve,{once:true});
      image.addEventListener('error',resolve,{once:true});
    });
  }
  async function visualAssetsReady(){
    const app=document.getElementById('app');
    if(!app)return;
    const images=Array.from(app.querySelectorAll('img'));
    const tasks=images.map(imageReady);
    if(app.querySelector('.v140-fuchsia') && typeof Image!=='undefined'){
      const port=new Image();
      port.src=new URL('assets/fuchsia-aube-quai.webp',document.baseURI).href;
      tasks.push(imageReady(port));
    }
    if(document.fonts?.ready)tasks.push(Promise.resolve(document.fonts.ready));
    await Promise.allSettled(tasks);
  }
  function finish(){
    if(finishing)return;
    advance(3,'Prêt à embarquer !');
    finishing=true;
    if(bar)bar.setAttribute('aria-valuenow','3');
    if(fill)fill.style.width='100%';
    whenFrame(()=>{
      splash.classList.add('chroniques-loading-out');
      if(typeof setTimeout==='function')setTimeout(()=>{splash.hidden=true;},300);
      else splash.hidden=true;
    });
  }
  async function ready(){
    if(finishing)return;
    advance(2,'Mise en place du décor et des personnages…');
    await visualAssetsReady();
    finish();
  }
  function failed(message){
    if(finishing)return;
    if(stageText)stageText.textContent=message||'Le chargement prend plus de temps que prévu.';
    if(retry)retry.hidden=false;
  }
  if(retry)retry.addEventListener('click',()=>location.reload());
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>{
      advance(1,'Préparation des fichiers du jeu…');
    },{once:true});
  }else advance(1,'Préparation des fichiers du jeu…');
  window.ChroniquesLoading=Object.freeze({ready,advance,failed});
  if(typeof setTimeout==='function')setTimeout(()=>{
    if(!finishing)failed('Le démarrage semble bloqué. Tu peux réessayer.');
  },18000);
})();

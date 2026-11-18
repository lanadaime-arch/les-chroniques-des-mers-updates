/* Les Chroniques des Mers — V1.4.6, présence contextuelle du capitaine.
   Des attitudes jouées par les groupes ARTICULÉS du SVG, jamais une image
   entière déplacée. Aucune écriture dans les profils ou les sauvegardes. */
(function(){
 'use strict';
 if(typeof document==='undefined')return;
 const valid=new Set(['idle','lookout','breeze','ready']);
 const classes=['v146-lookout','v146-breeze','v146-ready','v146-welcome'];
 const cycle=['lookout','idle','breeze','idle','ready','idle'];
 let phase=0;
 const actor=()=>document.querySelector?.('svg.v141-rig-stage');
 const reduced=()=>!!(typeof window!=='undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
 function pose(svg,mood='idle'){
  if(!svg?.classList?.contains?.('v141-rig-stage'))return false;
  if(!valid.has(mood))return false;
  for(const name of classes)svg.classList.remove(name);
  if(mood!=='idle')svg.classList.add('v146-'+mood);
  return true;
 }
 function tick(){
  if(reduced()||document.hidden)return;
  const svg=actor();
  if(!svg || svg.classList.contains('v141-greet') ||
      svg.classList.contains('v146-welcome') ||
      svg.matches?.(':hover') || document.activeElement===svg)return;
  pose(svg,cycle[phase%cycle.length]);
  phase+=1;
 }
 function localSvg(target){return target?.closest?.('svg.v141-rig-stage')||null}
 document.addEventListener?.('pointerover',e=>{
  const svg=localSvg(e.target);
  if(svg&&!reduced()&&!svg.contains?.(e.relatedTarget)){
    pose(svg,'idle');
    svg.classList.add('v146-welcome');
  }
 });
 document.addEventListener?.('pointerout',e=>{
  const svg=localSvg(e.target);
  if(svg&&!svg.contains?.(e.relatedTarget))svg.classList.remove('v146-welcome');
 });
 document.addEventListener?.('focusin',e=>{
  const svg=localSvg(e.target);if(svg&&!reduced())pose(svg,'ready');
 });
 document.addEventListener?.('focusout',e=>{
  const svg=localSvg(e.target);if(svg)pose(svg,'idle');
 });
 document.addEventListener?.('visibilitychange',()=>{
  if(document.hidden){const svg=actor();if(svg)pose(svg,'idle');}
 });
 if(typeof setInterval==='function')setInterval(tick,6400);
 if(typeof window!=='undefined')window.ChroniquesCaptainPresence=Object.freeze({pose,tick});
})();

/* Atelier personnages V2 — premier jalon: HUMAIN par défaut.
   100% SVG en pièces originales, sans découpe d'illustration existante.
   Prototype non sauvegardé: aucune écriture de sauvegarde ni création d'emplacement. */
(function(){
'use strict';
const RACE='humain';
const choices={
 eyes:{ronds:'Ronds',fins:'Fins',vifs:'Expressifs'},
 mouth:{neutre:'Neutre',sourire:'Sourire',ferme:'Déterminée'},
 nose:{petit:'Petit',droit:'Droit'},
 hair:{courts:'Courts',epis:'Ébouriffés',longs:'Mi-longs'},
 skin:{clair:'#e8bc97',dore:'#c79163',brun:'#9e694f'},
 hairColor:{noir:'#292831',brun:'#724b38',roux:'#ba6942',blond:'#d5b576'},
 eyeColor:{brun:'#7a4b34',bleu:'#4292bc',vert:'#488f68'},
 top:{ecru:'#cbbfa9',bleu:'#567f9b',rouge:'#ac6754'},
 pants:{gris:'#5d626e',sable:'#aa9379',marine:'#354d6a'}
};
const labels={skin:{clair:'Clair',dore:'Doré',brun:'Brun'},hairColor:{noir:'Noir',brun:'Brun',roux:'Roux',blond:'Blond'},eyeColor:{brun:'Bruns',bleu:'Bleus',vert:'Verts'},top:{ecru:'Écru',bleu:'Bleu',rouge:'Rouge'},pants:{gris:'Gris',sable:'Sable',marine:'Marine'}};
const CLASSES={bretteur:['Bretteur','Mêlée'],eclaireur:['Éclaireur','Mobilité'],gardien:['Gardien','Défense']};
const DEFAULT=Object.freeze({race:RACE,classId:'bretteur',eyes:'ronds',mouth:'neutre',nose:'petit',hair:'courts',
 skin:'clair',hairColor:'noir',eyeColor:'brun',top:'ecru',pants:'gris',pose:'idle'});
let draft={...DEFAULT},tab='race';
function normalize(o={}){
 const next={...DEFAULT};for(const k of Object.keys(next)){
   if(k==='race'){next.race=RACE;continue}
   if(k==='pose'){next.pose=['idle','wave','walk'].includes(o.pose)?o.pose:'idle';continue}
   if(k==='classId'){next.classId=Object.hasOwn(CLASSES,o.classId)?o.classId:DEFAULT.classId;continue}
   next[k]=Object.hasOwn(choices[k],o[k])?o[k]:DEFAULT[k];
 }return next;
}
function hairBack(kind,color){
 if(kind==='longs')return '<path d="M121 98Q119 48 166 49T215 98L219 199 194 193 192 127 142 127 141 193 113 198Z" />';
 if(kind==='epis')return '<path d="M116 116L102 90 126 93 126 64 147 73 166 43 183 70 204 53 210 81 230 85 214 119Z"/>';
 return '<path d="M118 115Q105 64 144 56 199 35 217 96L214 118 193 103 140 101Z"/>';
}
function hairFront(kind){
 if(kind==='longs')return '<path d="M123 108Q132 54 177 53 222 56 220 105L211 153 197 133 198 100 180 132 168 110 149 134 134 108 132 150 120 151Z"/>';
 if(kind==='epis')return '<path d="M119 120L107 88 129 94 130 64 151 79 169 54 181 80 203 64 207 87 226 89 212 123 199 101 183 124 162 103 145 124 132 102Z"/>';
 return '<path d="M118 114Q115 66 155 56 207 47 219 104L210 116 200 91 182 114 170 95 153 117 140 98 125 124Z"/>';
}
function faceEyes(o){
 const color=choices.eyeColor[o.eyeColor];
 if(o.eyes==='fins')return `<path d="M139 132q10-8 22-1m21 0q11-7 22 1" fill="none" stroke="#33313a" stroke-width="4" stroke-linecap="round"/><path d="M149 134l5 1m34 0 5-2" stroke="${color}" stroke-width="4" stroke-linecap="round"/>`;
 const wide=o.eyes==='vifs'?12:9;
 return `<ellipse cx="150" cy="135" rx="${wide}" ry="10" fill="#fff8ec" stroke="#4c3434" stroke-width="2"/><ellipse cx="191" cy="135" rx="${wide}" ry="10" fill="#fff8ec" stroke="#4c3434" stroke-width="2"/><ellipse cx="150" cy="135" rx="5" ry="7" fill="${color}"/><ellipse cx="191" cy="135" rx="5" ry="7" fill="${color}"/><circle cx="152" cy="133" r="2" fill="#fff"/><circle cx="193" cy="133" r="2" fill="#fff"/>`;
}
function faceMouth(o){return o.mouth==='sourire'?'<path d="M153 166q17 20 37-1" fill="none" stroke="#944c41" stroke-width="4" stroke-linecap="round"/>':o.mouth==='ferme'?'<path d="M155 171l31-3" fill="none" stroke="#944c41" stroke-width="4" stroke-linecap="round"/>':'<path d="M155 169q15 5 29 0" fill="none" stroke="#944c41" stroke-width="3" stroke-linecap="round"/>';}
function figure(input={}){
 const o=normalize(input),skin=choices.skin[o.skin],hair=choices.hairColor[o.hairColor];
 const shirt=choices.top[o.top],pants=choices.pants[o.pants];
 return `<svg class="cdm2-hero cdm2-pose-${o.pose}" viewBox="0 0 340 445" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Modèle humain neutre articulé, sans chapeau ni arme">
 <defs>
  <linearGradient id="cdm2-skin" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff4d7"/><stop offset=".5" stop-color="${skin}"/><stop offset="1" stop-color="#865641"/></linearGradient>
  <linearGradient id="cdm2-top" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#e7dfcd"/><stop offset=".45" stop-color="${shirt}"/><stop offset="1" stop-color="#36445a"/></linearGradient>
  <linearGradient id="cdm2-pants" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#d4cbb9"/><stop offset=".45" stop-color="${pants}"/><stop offset="1" stop-color="#30374c"/></linearGradient>
 </defs>
 <ellipse cx="170" cy="410" rx="58" ry="10" fill="#0715249c"/>
 <g class="cdm2-body" data-bone="root">
  <g class="cdm2-leg-left" data-bone="left-thigh"><path d="M131 272q-10 34-10 79l27 8 12-77z" fill="url(#cdm2-pants)" stroke="#292e3c" stroke-width="3"/>
   <g class="cdm2-shin-left" data-bone="left-shin"><path d="M121 350l-3 45 23 6 9-43z" fill="url(#cdm2-pants)" stroke="#292e3c" stroke-width="3"/><path d="M118 391q-15 6-14 16l43 1-5-14z" fill="#806f60" stroke="#3b2d30" stroke-width="3"/></g>
  </g>
  <g class="cdm2-leg-right" data-bone="right-thigh"><path d="M165 282l14 78 27-8q-2-47-12-80z" fill="url(#cdm2-pants)" stroke="#292e3c" stroke-width="3"/>
   <g class="cdm2-shin-right" data-bone="right-shin"><path d="M180 359l10 40 22-8-5-40z" fill="url(#cdm2-pants)" stroke="#292e3c" stroke-width="3"/><path d="M187 393l-2 15 48-1q-2-12-22-17z" fill="#806f60" stroke="#3b2d30" stroke-width="3"/></g>
  </g>
  <g class="cdm2-hair-back" fill="${hair}" stroke="#272432" stroke-width="3">${hairBack(o.hair,hair)}</g>
  <g class="cdm2-arm-left" data-bone="left-shoulder">
    <path d="M130 207q-25-10-38 14l-18 51 25 9 28-54z" fill="url(#cdm2-top)" stroke="#3b3641" stroke-width="3"/>
    <g class="cdm2-forearm-left" data-bone="left-elbow"><path d="M77 267q-11 17-8 35l21 5 11-31z" fill="url(#cdm2-skin)" stroke="#80594b" stroke-width="3"/><path d="M70 295q-8 12 1 23 12 8 21-4l-2-12z" fill="${skin}" stroke="#80594b" stroke-width="3"/></g>
  </g>
  <g class="cdm2-arm-right" data-bone="right-shoulder">
    <path d="M202 207q24-10 37 14l18 51-25 9-28-54z" fill="url(#cdm2-top)" stroke="#3b3641" stroke-width="3"/>
    <g class="cdm2-forearm-right" data-bone="right-elbow"><path d="M231 277l12 30 21-6q2-19-9-34z" fill="url(#cdm2-skin)" stroke="#80594b" stroke-width="3"/><path d="M243 301l-2 12q9 13 21 5 9-11 1-23z" fill="${skin}" stroke="#80594b" stroke-width="3"/></g>
  </g>
  <g class="cdm2-torso" data-bone="torso">
   <path d="M150 175l40 1-6 32-34 0z" fill="url(#cdm2-skin)" stroke="#80594b" stroke-width="2"/>
   <path d="M131 206q39-17 75 0l13 74q-47 19-97 0z" fill="url(#cdm2-top)" stroke="#3d3641" stroke-width="3.5"/>
   <path d="M153 207q13 19 18 19l14-19" fill="none" stroke="#e4d8bd" stroke-width="4"/>
   <path d="M124 272q48 11 93 0l-2 12q-41 15-91-1z" fill="#82664c" stroke="#3d3434" stroke-width="2"/>
  </g>
  <g class="cdm2-head" data-bone="head">
   <path d="M122 120q-13-8-14 11 0 18 17 21m94-31q13-8 14 11 0 19-17 21" fill="url(#cdm2-skin)" stroke="#855c4b" stroke-width="3"/>
   <path d="M120 109q8-43 51-43 45 0 51 43l-6 48q-13 39-44 39-36 0-49-40z" fill="url(#cdm2-skin)" stroke="#855c4b" stroke-width="3.5"/>
   <path d="M137 119l21-4m29 0 19 4" fill="none" stroke="#534039" stroke-width="3"/>
   ${faceEyes(o)}${o.nose==='droit'?'<path d="M172 142l-3 16 7 2" fill="none" stroke="#a77054" stroke-width="2.6"/>':'<path d="M172 148q-5 7 1 9" fill="none" stroke="#a77054" stroke-width="2.6"/>'}${faceMouth(o)}
   <g class="cdm2-hair-front" fill="${hair}" stroke="#26222d" stroke-width="3">${hairFront(o.hair)}</g>
   <path class="cdm2-blink" d="M138 135h23m18 0h23" fill="none" stroke="#463333" stroke-width="4.5" stroke-linecap="round"/>
  </g>
 </g></svg>`;
}
const item=(key,value,label)=>`<button type="button" data-v2-key="${key}" data-v2-value="${value}" aria-pressed="${draft[key]===value?'true':'false'}">${label}</button>`;
function select(key,label){
 const values=labels[key]||Object.fromEntries(Object.keys(choices[key]).map(x=>[x,x==='epis'?'Ébouriffés':x==='longs'?'Mi-longs':x.charAt(0).toUpperCase()+x.slice(1)]));
 return `<fieldset class="cdm2-field"><legend>${label}</legend><div class="cdm2-options">${Object.entries(values).map(([v,l])=>item(key,v,l)).join('')}</div></fieldset>`;
}
function editor(){
 if(tab==='race')return `<h2>Race</h2><p>Notre première silhouette de travail est un <strong>Humain</strong>. Nous déciderons ensemble des autres races et de leurs modèles.</p><div class="cdm2-race-selected">Humain <span>Race de départ du créateur</span></div>`;
 if(tab==='class')return `<h2>Classe</h2><p>Choix de test parmi les trois classes déjà présentes dans le jeu. Les armes resteront absentes du modèle neutre.</p><div class="cdm2-class-options">${Object.entries(CLASSES).map(([key,[label,desc]])=>`<button type="button" data-v2-key="classId" data-v2-value="${key}" aria-pressed="${draft.classId===key?'true':'false'}"><strong>${label}</strong><small>${desc}</small></button>`).join('')}</div>`;
 if(tab==='face')return `<h2>Visage</h2>${select('eyes','Yeux')}${select('mouth','Bouche')}${select('nose','Nez')}${select('eyeColor','Couleur des yeux')}${select('skin','Peau')}`;
 if(tab==='hair')return `<h2>Cheveux</h2>${select('hair','Coiffure')}${select('hairColor','Couleur')}`;
 return `<h2>Tenue simple</h2><p>La silhouette de base ne porte ni chapeau ni arme. Les vêtements sont des pièces qui peuvent changer.</p>${select('top','Haut')}${select('pants','Bas')}`;
}
function render(){
 const tabs=[['race','Race'],['class','Classe'],['face','Visage'],['hair','Cheveux'],['clothes','Tenue']];
 return `<main class="cdm2-workshop">
 <header class="cdm2-header"><button type="button" data-action="back-lobby">← Accueil</button><div><span>LES CHRONIQUES DES MERS · ATELIER DE PERSONNAGES</span><h1>Création de personnage</h1></div><strong>PROTOTYPE · SANS SAUVEGARDE</strong></header>
 <div class="cdm2-layout">
 <section class="cdm2-panel cdm2-preview"><h2>Aperçu animé · Humain</h2><div id="cdm2-character" class="cdm2-model-holder">${figure(draft)}</div><p>Un modèle de base sans chapeau ni équipement.</p><div class="cdm2-pose-buttons">${[['idle','Repos'],['wave','Salut'],['walk','Marche']].map(([id,label])=>`<button type="button" data-v2-pose="${id}" aria-pressed="${draft.pose===id?'true':'false'}">${label}</button>`).join('')}</div></section>
 <section class="cdm2-panel cdm2-custom"><nav class="cdm2-tabs" aria-label="Catégories du personnage">${tabs.map(([id,label])=>`<button type="button" data-v2-tab="${id}" aria-pressed="${tab===id?'true':'false'}">${label}</button>`).join('')}</nav><div id="cdm2-editor" class="cdm2-editor">${editor()}</div></section>
 <aside class="cdm2-panel cdm2-summary"><h2>Identité de travail</h2><div>Race <strong>Humain</strong></div><div>Classe <strong>${CLASSES[draft.classId][0]}</strong></div><div>Chapeau <strong>Aucun</strong></div><div>Arme portée <strong>Aucune</strong></div><div>Sauvegarde <strong>Aucune</strong></div><button type="button" data-v2-random>🎲 Personnage aléatoire</button><p>On valide les modèles avant d'autoriser la création définitive de personnages.</p></aside>
 </div></main>`;
}
function randomize(){
 const pick=k=>Object.keys(choices[k])[Math.floor(Math.random()*Object.keys(choices[k]).length)];
 for(const key of Object.keys(choices))draft[key]=pick(key);
 draft.pose='idle';
 return {...draft};
}
function update(){
 const app=document.getElementById('app');
 if(app&&app.querySelector('.cdm2-workshop'))app.innerHTML=render();
}
if(typeof document!=='undefined'&&document.addEventListener){
 document.addEventListener('click',event=>{
  const target=event.target?.closest?.('[data-v2-tab],[data-v2-key],[data-v2-pose],[data-v2-random]');
  if(!target||!target.closest('.cdm2-workshop'))return;
  if(target.dataset.v2Tab){tab=target.dataset.v2Tab;update();return;}
  if(target.dataset.v2Key){
   const key=target.dataset.v2Key, value=target.dataset.v2Value;
   const validated=normalize({...draft,[key]:value});
   if(validated[key]===value){draft=validated;update();}
   return;
  }
  if(target.dataset.v2Pose){draft.pose=['idle','wave','walk'].includes(target.dataset.v2Pose)?target.dataset.v2Pose:'idle';update();return;}
  if(target.hasAttribute('data-v2-random')){randomize();update();}
 });
}
if(typeof window!=='undefined')window.ChroniquesCharacterV2=Object.freeze({
 render,figure,normalize,randomize,reset(){draft={...DEFAULT};tab='race';},
 getDraft(){return {...draft}},getRace(){return RACE}
});
})();

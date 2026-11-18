/* Les Chroniques des Mers — chibi d'illustration en plusieurs pièces animables.
   Les WebP existantes sont découpées en pièces SVG indépendantes : rendu identique
   à l'illustration source au repos, mouvements articulés par région.
   Pas d'écrasement de l'apparence historique ni des sauvegardes.
   API: window.ChroniquesCaptainRig.render(look, mode). */
(function () {
  'use strict';
  const looks = new Set(['azur', 'flamme', 'brume']);
  // Polygones de découpe des pièces sur l'illustration source 460 x 550.
  // Aucun bitmap supplémentaire dans le paquet : chaque pièce réutilise son WebP.
  const pieces = [
    {name:'cape-left',pivot:[111,320],path:'M0 313 L105 313 L158 342 L164 409 L93 480 L0 475Z'},
    {name:'cape-right',pivot:[329,305],path:'M315 302 L460 300 L460 490 L337 484 L301 411Z'},
    {name:'leg-left',pivot:[172,433],path:'M108 411 L245 411 L231 550 L86 550Z'},
    {name:'leg-right',pivot:[296,431],path:'M248 411 L385 402 L396 550 L227 550Z'},
    {name:'arm-left',pivot:[174,230],path:'M104 203 L214 200 L250 329 L205 382 L98 351Z'},
    {name:'arm-right',pivot:[330,231],path:'M295 200 L410 198 L422 431 L308 417 L278 300Z'},
    {name:'head',pivot:[237,194],path:'M0 0H460V190 L368 190 L345 222 L288 233 L173 233 L130 218 L0 216Z'}
  ];
  const imageFor=(look)=>window.ChroniquesSpritePaths?.[look] || `assets/chibi-capitaine-${look}.webp`;
  const ribbons = new Set(['origine','bleu','rouge','vert','violet']);
  const accessories = new Set(['aucun','boucle','lunettes','aviateur']);
  function normalizeOptions(options) {
    const o=options&&typeof options==='object'&&!Array.isArray(options)?options:{};
    return {ribbon:ribbons.has(o.ribbon)?o.ribbon:'origine',accessory:accessories.has(o.accessory)?o.accessory:'aucun'};
  }
  const accessoriesMarkup = {
    aucun:'',
    boucle:'<g class="v142-accessory" fill="none" stroke="#f2c563" stroke-width="5"><circle cx="167" cy="181" r="9"/><circle cx="165" cy="173" r="2" fill="#ffea9f" stroke="none"/></g>',
    lunettes:'<g class="v142-accessory" fill="none" stroke="#4f2d27" stroke-width="5" stroke-linecap="round"><circle cx="204" cy="145" r="21"/><circle cx="271" cy="144" r="21"/><path d="M225 137Q237 130 250 138M182 140L170 135M293 142L305 134"/></g>',
    aviateur:'<g class="v142-accessory" stroke="#9a632f" stroke-width="5" fill="#72cce061"><ellipse cx="202" cy="53" rx="24" ry="16"/><ellipse cx="251" cy="50" rx="24" ry="16"/><path d="M226 49L228 45M178 51L158 48M275 50L292 47" fill="none" stroke="#e9c47e" stroke-width="6"/></g>'
  };
  let renderSerial = 0;
  function render(appearance='azur',mode='stage',customization) {
    const look = looks.has(appearance) ? appearance : 'azur';
    const portrait = mode === 'portrait';
    const custom = normalizeOptions(customization);
    const source = imageFor(look);
    const key = `chibi-${look}-${++renderSerial}`;
    const masks = pieces.map(p=>`<path d="${p.path}" fill="black"/>`).join('');
    const clipDefs=pieces.map(p=>`<clipPath id="${key}-${p.name}" clipPathUnits="userSpaceOnUse"><path d="${p.path}"/></clipPath>`).join('');
    // Découpe uniquement les zones bleues du ruban et du nœud du chapeau.
    const ribbonClip=`<clipPath id="${key}-hat-ribbon" clipPathUnits="userSpaceOnUse">
      <path d="M27 72L149 54L165 84L156 185L12 198Z"/>
      <path d="M122 28Q201 7 307 29L301 59Q220 40 125 78Z"/>
    </clipPath>`;
    const maskImage = window.ChroniquesRibbonMasks?.[look];
    const ribbonMask=maskImage?`<mask id="${key}-ribbon-mask" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" style="mask-type:alpha" x="0" y="0" width="460" height="550"><image href="${maskImage}" width="460" height="550" /></mask>`:'';
    const ribbonTint=custom.ribbon==='origine'?'':`<image class="v142-ribbon-tint v142-ribbon-${custom.ribbon}" href="${source}" width="460" height="550" ${maskImage?`mask="url(#${key}-ribbon-mask)"`:`clip-path="url(#${key}-hat-ribbon)"`} preserveAspectRatio="xMidYMid meet"/>`;
    const faceAccessory=accessoriesMarkup[custom.accessory];
    const limb=(p)=>{
      const [x,y]=p.pivot;
      return `<g transform="translate(${x} ${y})"><g class="v141-rig-${p.name}"><g transform="translate(${-x} ${-y})"><image href="${source}" width="460" height="550" preserveAspectRatio="xMidYMid meet" clip-path="url(#${key}-${p.name})"/></g></g></g>`;
    };
    const head=pieces.find(p=>p.name==='head');
    return `<svg xmlns="http://www.w3.org/2000/svg" class="v141-rig v141-rig-${look} ${portrait?'v141-rig-portrait v136-avatar-image':'v141-rig-stage'}"
      viewBox="${portrait?'74 0 314 252':'0 0 460 550'}"
      role="${portrait?'img':'button'}" tabindex="${portrait?'-1':'0'}"
      aria-label="${portrait?'Portrait du capitaine':'Faire saluer le capitaine'}" preserveAspectRatio="xMidYMid meet">
      <defs>
        ${clipDefs}
        ${ribbonClip}
        ${ribbonMask}
        <mask id="${key}-body-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="460" height="550"><rect width="460" height="550" fill="white"/>${masks}</mask>
      </defs>
      <ellipse cx="231" cy="545" rx="113" ry="5" opacity=".2" fill="#071827"/>
      <!-- Le torse et les jonctions restent fixes. Les regions mobiles sont absentes de ce socle. -->
      <g class="v141-rig-breath">
        <image href="${source}" width="460" height="550" preserveAspectRatio="xMidYMid meet" mask="url(#${key}-body-mask)"/>
      </g>
      <g class="v141-rig-cape">${pieces.filter(p=>p.name.startsWith('cape')).map(limb).join('')}</g>
      ${pieces.filter(p=>p.name.startsWith('leg')).map(limb).join('')}
      ${pieces.filter(p=>p.name.startsWith('arm')).map(limb).join('')}
      ${portrait?'':`<g class="v146-wind-lines" aria-hidden="true"><path d="M56 295q26-14 60-11M44 315q35-6 70-4M344 278q28-11 59-5"/></g>`}
      <g transform="translate(${head.pivot[0]} ${head.pivot[1]})"><g class="v141-rig-head"><g transform="translate(${-head.pivot[0]} ${-head.pivot[1]})">
        <image href="${source}" width="460" height="550" preserveAspectRatio="xMidYMid meet" clip-path="url(#${key}-head)"/>
        ${ribbonTint}
        ${faceAccessory}
        <!-- Une paupière est un élément indépendant : le dessin source ne disparaît pas. -->
        <g class="v141-rig-eyes">
          <path d="M192 138 Q209 128 237 138 L236 159 Q209 169 192 155Z" fill="#f2ba82"/>
          <path d="M252 139 Q271 127 288 138 L291 158 Q274 168 253 158Z" fill="#f2ba82"/>
          <path d="M197 146 Q216 155 236 145M255 145 Q273 154 289 144" stroke="#382529" stroke-width="4" fill="none" stroke-linecap="round"/>
        </g>
      </g></g></g>
    </svg>`;
  }
  // Emote volontaire déclenchée par clic / Entrée / espace, sans sauvegarder d'état.
  function greet(svg) {
    if (!svg || !svg.classList?.contains('v141-rig-stage')) return;
    svg.classList.remove('v141-greet');
    svg.getBoundingClientRect(); // Réarme l'animation lors d'un second clic.
    svg.classList.add('v141-greet');
  }
  if (typeof document !== 'undefined') {
    document.addEventListener('click', event => greet(event.target?.closest?.('svg.v141-rig-stage')));
    document.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        const svg = event.target?.closest?.('svg.v141-rig-stage');
        if (svg) { event.preventDefault(); greet(svg); }
      }
    });
    document.addEventListener('animationend', event => {
      if (event.animationName === 'cdm-greet') event.target.closest('svg.v141-rig-stage')?.classList.remove('v141-greet');
    });
  }
  window.ChroniquesCaptainRig = Object.freeze({ render, normalizeOptions });
})();
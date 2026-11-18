/* Les Chroniques des Mers — laboratoire de chibi 3D V1.4.9.
 * Véritable scène WebGL (géométrie, caméra, volumes et articulations).
 * Maquette de validation visuelle NON sauvegardée ; aucun profil n'est modifié.
 * Three.js MIT © Three.js Authors, fourni localement avec sa licence.
 */
import * as THREE from './vendor/three.module.js';

const game = window.ChroniquesCharacterV2;
const palette = {
  skin:{clair:0xe9ba99,dore:0xcb946a,brun:0x936047},
  hairColor:{noir:0x242b38,brun:0x724b37,roux:0xa95b37,blond:0xe0bc75},
  eyeColor:{brun:0x935c39,bleu:0x438dbf,vert:0x478b70},
  top:{ecru:0xe4d7be,bleu:0x4685a0,rouge:0xb75c55},
  pants:{gris:0x5f6573,sable:0xb69b75,marine:0x304e6c}
};
const G = new THREE.SphereGeometry(1,24,16);
const eyeGeo = new THREE.SphereGeometry(1,24,16);
const gradients = new THREE.DataTexture(new Uint8Array([
  110,110,110,255, 168,168,168,255, 224,224,224,255, 255,255,255,255
]),4,1,THREE.RGBAFormat);
gradients.magFilter = THREE.NearestFilter;
gradients.minFilter = THREE.NearestFilter;
gradients.needsUpdate = true;
gradients.colorSpace = THREE.SRGBColorSpace;
const mats = new Map();
function mat(c,metalness=0){
  const k=c+'_'+metalness;if(!mats.has(k))mats.set(k,new THREE.MeshToonMaterial({color:c,gradientMap:gradients,transparent:false}));
  return mats.get(k);
}
const black=mat(0x2a2433), white=mat(0xfffaf4), shine=mat(0xffffff);
const gold=mat(0xe2bb78), leather=mat(0x715449), boot=mat(0x343c4d);
function ell(parent,m,x,y,z,a,b,c){
  const ob=new THREE.Mesh(G,m);ob.position.set(x,y,z);ob.scale.set(a,b,c);parent.add(ob);return ob;
}
function cyl(parent,m,x,y,z,a,b,h,rx=0,rz=0){
  const o=new THREE.Mesh(new THREE.CylinderGeometry(a,b,h,14),m);o.position.set(x,y,z);o.rotation.x=rx;o.rotation.z=rz;parent.add(o);return o;
}
function stroke(parent,m,points,thick=.015){
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
  const o=new THREE.Mesh(new THREE.TubeGeometry(curve,18,thick,6,false),m);
  parent.add(o);return o;
}
function buildPerson(raw){
  const d=raw||{}, root=new THREE.Group(), body=new THREE.Group();
  root.add(body);
  const skin=mat(palette.skin[d.skin]||palette.skin.clair);
  const hair=mat(palette.hairColor[d.hairColor]||palette.hairColor.noir);
  const iris=mat(palette.eyeColor[d.eyeColor]||palette.eyeColor.brun);
  const top=mat(palette.top[d.top]||palette.top.ecru);
  const pants=mat(palette.pants[d.pants]||palette.pants.gris);
  const details=mat(0xb48573), blush=mat(0xe39c96);
  // Silhouette chibi : tronc compact, grande tête, pieds robustes.
  ell(body,top,0,1.30,0,.50,.47,.31);
  ell(body,skin,0,1.74,0,.18,.23,.19);
  ell(body,top,0,1.53,.27,.43,.17,.11); // encolure
  ell(body,leather,0,.97,0,.50,.075,.31);
  cyl(body,gold,.04,.98,.32,.09,.09,.025,Math.PI/2);
  const arms=[];
  for(const side of [-1,1]){
    const pivot=new THREE.Group();pivot.position.set(side*.53,1.56,0);body.add(pivot);
    ell(pivot,top,side*.08,-.20,0,.22,.29,.23);
    ell(pivot,skin,side*.11,-.51,.01,.135,.17,.13);
    ell(pivot,skin,side*.12,-.65,.05,.15,.13,.145);
    ell(pivot,gold,side*.11,-.42,.00,.155,.035,.155);
    arms.push(pivot);
  }
  const legs=[];
  for(const side of [-1,1]){
    const pivot=new THREE.Group();pivot.position.set(side*.245,.95,0);body.add(pivot);
    ell(pivot,pants,0,-.25,.015,.23,.36,.25);
    ell(pivot,boot,0,-.58,.06,.245,.20,.245);
    ell(pivot,boot,0,-.685,.145,.265,.105,.36);
    ell(pivot,gold,0,-.49,.22,.23,.033,.035);
    legs.push(pivot);
  }
  const head=new THREE.Group();head.position.set(0,1.86,0);body.add(head);
  ell(head,skin,0,.35,0,.81,.73,.68);
  // Oreilles et détails réels en relief.
  for(const side of [-1,1]){
    ell(head,skin,side*.805,.27,.03,.17,.23,.14);
    ell(head,details,side*.925,.27,.115,.043,.125,.022);
    ell(head,blush,side*.49,.08,.566,.19,.09,.023);
    stroke(head,hair,[[side*.14,.71,.61],[side*.26,.73,.61],[side*.38,.69,.60]],.017);
  }
  // Yeux anime avec cornée, iris, pupille ET deux reflets : pas deux pixels.
  const eyes=[];
  for(const side of [-1,1]){
    const e=new THREE.Group();e.position.set(side*.292,.40,.625);head.add(e);
    ell(e,black,0,0,0,.203,.245,.066);
    ell(e,white,0,0,.033,.174,.213,.060);
    ell(e,iris,side*.012,-.037,.089,.105,.144,.034);
    ell(e,black,side*.009,-.044,.118,.052,.101,.021);
    ell(e,shine,-.043,.045,.135,.049,.058,.014);
    ell(e,shine,.057,-.075,.133,.020,.024,.009);
    if(d.eyes==='fins')e.scale.y=.70;
    if(d.eyes==='vifs')e.scale.set(1.10,1.08,1);
    eyes.push(e);
  }
  // Nez et sourire avec géométrie visible selon le profil.
  ell(head,skin,0,.135,.692,d.nose==='droit'?.095:.065,.08,.091);
  const smile=d.mouth==='sourire', serious=d.mouth==='ferme';
  const my=smile?-.06:-.095;
  stroke(head,mat(0x873f4a),[[-.14,my,.672],[-.07,my-(smile?.045:0),.713],[0,my-(smile?.07:0),.728],[.08,my-(smile?.045:0),.712],[.145,my,.663]],serious?.012:.017);
  if(smile)ell(head,mat(0xd18887),0,-.16,.670,.105,.03,.013);
  // Coiffe volumétrique : calotte, côtés et mèches superposées.
  ell(head,hair,0,.86,-.10,.82,.36,.69);
  ell(head,hair,0,.65,-.48,.75,.37,.35);
  const style=d.hair||'courts';
  const bangs=style==='epis'?[[-.55,.91,.46],[-.27,1.03,.55],[.10,1.04,.57],[.44,.94,.51]]:
              style==='longs'?[[-.50,.86,.56],[-.25,.97,.60],[.13,.97,.57],[.48,.86,.55]]:
              [[-.46,.87,.54],[-.16,.93,.61],[.22,.93,.60],[.49,.83,.53]];
  bangs.forEach(([x,y,z],i)=>{
    const tuft=ell(head,hair,x,y,z,.22,style==='epis'?.27:.23,.235);
    tuft.rotation.z=(i-1.5)*-.20;tuft.rotation.x=-.20;
  });
  for(const side of [-1,1]){
    const s=ell(head,hair,side*.70,.64,.06,.21,.38,.40);s.rotation.z=side*.16;
    if(style==='longs'){
      const lock=ell(head,hair,side*.71,.21,.04,.21,.48,.25);lock.rotation.z=side*.12;
      ell(head,hair,side*.58,-.19,-.20,.18,.35,.23);
    }
    if(style==='epis'){
      const sp=ell(head,hair,side*.47,1.08,-.15,.19,.31,.21);sp.rotation.z=-side*.47;
    }
  }
  const faceGroup={eyes,head};
  return {root,body,head,arms,legs,faceGroup};
}
function stage(scene){
  const floor=mat(0x294a54), rim=mat(0xd4ae72), plank=mat(0x855e49);
  cyl(scene,floor,0,-.18,0,2.10,2.15,.34);
  cyl(scene,rim,0,-.025,0,2.02,2.02,.055);
  cyl(scene,plank,0,.005,0,1.91,1.91,.05);
  for(let i=0;i<9;i++){
    let a=i*Math.PI/9, r=1.66;
    let bar=new THREE.Mesh(new THREE.BoxGeometry(3.55,.012,.022),mat(0x5e493a));
    bar.rotation.y=a;bar.position.y=.036;scene.add(bar);
  }
  const shadow=new THREE.Mesh(new THREE.CircleGeometry(.75,42),
    new THREE.MeshBasicMaterial({color:0x061c28,transparent:true,opacity:.30,depthWrite:false}));
  shadow.rotation.x=-Math.PI/2;shadow.position.y=.05;scene.add(shadow);
  // Quelques détails 3D autour du podium, conservés hors silhouette.
  for(const s of [-1,1]){
    const x=s*1.49,z=-.82;
    cyl(scene,mat(0x684634),x,.23,z,.18,.24,.36);
    cyl(scene,gold,x,.25,z,.205,.205,.025);
  }
}
let current=null,yaw=-.18,zoom=5.5,lastId=null,pose='idle';
let stableDraft='';
function shutdown(){
  if(!current)return;
  cancelAnimationFrame(current.raf);
  current.renderer.dispose();
  current.renderer.domElement.remove();
  current=null;
}
function init(host){
  if(!game||!host||!host.isConnected||host.dataset.chibi3dReady)return;
  shutdown();
  host.dataset.chibi3dReady='yes';
  const preserve=host.querySelector('.cdm2-hero');
  const wrap=document.createElement('div');wrap.className='cdm3d-frame';
  host.appendChild(wrap);
  const note=document.createElement('span');note.className='cdm3d-hint';
  note.textContent='Glisser : tourner  ·  Molette : zoomer';host.appendChild(note);
  let renderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});}
  catch(err){wrap.remove();note.textContent='WebGL indisponible · aperçu 2D conservé';return;}
  if(preserve)preserve.hidden=true;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
  renderer.setSize(Math.max(240,host.clientWidth),Math.max(260,host.clientHeight),false);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000,0);
  renderer.domElement.setAttribute('aria-label','Personnage chibi en vraie 3D. Faire glisser pour tourner.');
  renderer.domElement.setAttribute('role','img');
  renderer.domElement.style.touchAction='none';
  wrap.appendChild(renderer.domElement);
  const scene=new THREE.Scene();
  stage(scene);
  scene.add(new THREE.HemisphereLight(0xd6f3ff,0x735344,2.0));
  const key=new THREE.DirectionalLight(0xfff0d2,2.35);key.position.set(-3.5,7.0,7);scene.add(key);
  const fill=new THREE.DirectionalLight(0x85beea,.75);fill.position.set(3,4,-4);scene.add(fill);
  const camera=new THREE.PerspectiveCamera(33,1,.1,100);
  const person=buildPerson(game.getDraft());
  scene.add(person.root);stableDraft=JSON.stringify(game.getDraft());
  const ro=new ResizeObserver(()=>{
    if(!host.isConnected)return;
    const w=Math.max(180,host.clientWidth),h=Math.max(230,host.clientHeight);
    camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);
  });ro.observe(host);
  let down=false,x0=0,y0=0;
  const canvas=renderer.domElement;
  canvas.addEventListener('pointerdown',e=>{down=true;x0=e.clientX;y0=e.clientY;canvas.setPointerCapture(e.pointerId)});
  canvas.addEventListener('pointerup',()=>{down=false});
  canvas.addEventListener('pointercancel',()=>{down=false});
  canvas.addEventListener('pointermove',e=>{
    if(!down)return;yaw+=(e.clientX-x0)*.012;zoom=THREE.MathUtils.clamp(zoom+(e.clientY-y0)*.009,3.8,8.0);x0=e.clientX;y0=e.clientY;
  });
  canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=THREE.MathUtils.clamp(zoom+Math.sign(e.deltaY)*.28,3.8,8.0)},{passive:false});
  let prev=performance.now(),clock=0,raf=0;
  function tick(now){
    if(!host.isConnected){ro.disconnect();shutdown();return;}
    const dt=Math.min((now-prev)/1000,.08);prev=now;clock+=dt;
    const d=game.getDraft();pose=d.pose||'idle';
    const signature=JSON.stringify(d);
    if(signature!==stableDraft){
      scene.remove(person.root);
      const next=buildPerson(d);Object.assign(person,next);
      scene.add(person.root);stableDraft=signature;
    }
    person.root.rotation.y=yaw;
    person.body.position.y=Math.sin(clock*2.15)*.023;
    person.head.rotation.z=Math.sin(clock*1.2)*.028;
    person.head.rotation.y=Math.sin(clock*.75)*.045;
    person.arms[0].rotation.z=Math.sin(clock*1.5)*.055;
    person.arms[1].rotation.z=-Math.sin(clock*1.7)*.055;
    person.legs.forEach(l=>l.rotation.x=0);
    if(pose==='walk'){
      person.body.position.y=Math.abs(Math.sin(clock*8))*.10;
      person.arms[0].rotation.x=Math.sin(clock*7)*-.62;
      person.arms[1].rotation.x=Math.sin(clock*7)*.62;
      person.legs[0].rotation.x=Math.sin(clock*7)*.52;
      person.legs[1].rotation.x=-Math.sin(clock*7)*.52;
    }else{
      person.arms[0].rotation.x=0;person.arms[1].rotation.x=0;
    }
    if(pose==='wave'){person.arms[1].rotation.z=2.3+Math.sin(clock*7)*.26;person.arms[1].rotation.x=.18;}
    const blink=(clock%5.2)<.12?.07:1;
    for(const eye of person.faceGroup.eyes)eye.scale.y=(d.eyes==='fins'?.70:d.eyes==='vifs'?1.08:1)*blink;
    camera.position.set(0,2.00,zoom);camera.lookAt(0,1.35,0);
    renderer.render(scene,camera);
    raf=requestAnimationFrame(tick);if(current)current.raf=raf;
  }
  current={renderer,raf:0,host};raf=requestAnimationFrame(tick);current.raf=raf;
}
function check(){
  const host=document.querySelector('.cdm2-workshop .cdm2-model-holder');
  if(host && !host.dataset.chibi3dReady)init(host);
  else if(!host && current)shutdown();
}
const app=document.getElementById('app');
if(app)new MutationObserver(()=>check()).observe(app,{childList:true,subtree:true});
check();
window.Chroniques3DPrototype=Object.freeze({version:'1.4.9',kind:'true-webgl-meshes',resetCamera(){yaw=-.18;zoom=5.5}});

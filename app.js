import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, collection, doc, onSnapshot, setDoc, deleteDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./config.js";
import { DAYS, PERIODS, PERIOD_NAME, INFO, OPT, SPRINTS, SPRINT_RULE, GYM, TESTS, TEST_NAMES, DATA, TEMPLATE_KEYS, mdLabel, sessionFor, weekLayout, planYear } from "./guide.js?v=1";

const COLS=['players','sessions','tests','injuries','routines','matches','mesos','micros','gymlogs','checkins'];
const NEW_COLS=['mesos','micros','gymlogs','checkins']; // necesitan las reglas nuevas de Firestore
const S={};COLS.forEach(c=>S[c]=[]);
let club={name:''}, access=null, members={}, me=null, tab='resumen', testFilter='', injFilter='activas', attRange='30', gymFilter='', unsubs=[], rulesOld=false;
const pubMatch=location.hash.match(/^#r-([A-Za-z0-9]{12,40})$/);
const plMatch=location.hash.match(/^#j-([A-Za-z0-9]{12,40})$/);
const publicMode=!!(pubMatch||plMatch);
let wellDate='', guideTab='year';
const $=s=>document.querySelector(s);

/* ---------- Firebase ---------- */
if(!firebaseConfig.apiKey||firebaseConfig.apiKey.startsWith('PEGAR')){
  gateScreen(`<img class="crest-lg" src="logo.png" alt="Escudo del club"><h1>Falta configurar</h1><p>Esta copia de la app todavía no está conectada a su base de datos. Completá <code>config.js</code> con los datos del proyecto de Firebase.</p>`);
  throw new Error('Sin configuración de Firebase');
}
const fb=initializeApp(firebaseConfig);
const auth=getAuth(fb);
let db;
try{db=initializeFirestore(fb,{localCache:persistentLocalCache({tabManager:persistentMultipleTabManager()})})}
catch(e){db=initializeFirestore(fb,{})}

/* ---------- utilidades ---------- */
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const parse=s=>{if(!s)return null;const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const daysBetween=(a,b)=>Math.round((parse(b)-parse(a))/864e5);
const DOW=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const fd=s=>{const d=parse(s);return d?String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0'):'—'};
const fdy=s=>{const d=parse(s);return d?fd(s)+'/'+String(d.getFullYear()).slice(2):'—'};
const dateCell=s=>{const d=parse(s);return `<div class="date">${d?DOW[d.getDay()]:''}<b>${fd(s)}</b></div>`};
const age=s=>{const d=parse(s);if(!d)return null;const n=new Date();let a=n.getFullYear()-d.getFullYear();if(n<new Date(n.getFullYear(),d.getMonth(),d.getDate()))a--;return a};
const ago=iso=>{if(!iso)return'';const m=Math.round((Date.now()-new Date(iso))/6e4);if(m<1)return'recién';if(m<60)return`hace ${m} min`;const h=Math.round(m/60);if(h<24)return`hace ${h} h`;const d=Math.round(h/24);return d<30?`hace ${d} d`:new Date(iso).toLocaleDateString('es-AR')};
const pl=id=>S.players.find(p=>p.id===id);
const plName=id=>{const p=pl(id);return p?p.name:'Jugador eliminado'};
const pname=id=>{if(!id)return'Alguien';if(me&&id===me.uid)return'Vos';const m=members[id];return (m&&m.name)||'Alguien del cuerpo técnico'};
const COLORS=['#1E6A44','#2563A8','#8A4FB0','#B5482A','#7A6A12','#0F7B7B','#A33B6B','#4B5BA6'];
const avatar=id=>{const m=members[id]||{};const n=(m.name||m.email||'?').trim();const ini=n.split(/\s+/).slice(0,2).map(w=>w[0]).join('').toUpperCase();let h=0;for(const c of String(id||n))h=(h*31+c.charCodeAt(0))>>>0;return `<span class="av" style="background:${COLORS[h%COLORS.length]}" aria-hidden="true">${esc(ini)}</span>`};
const isNum=v=>v!==''&&v!=null&&!isNaN(v);
const load=s=>{const d=sessDuration(s);return (isNum(s.rpe)&&d)?Math.round(s.rpe*d):null};
const byDateDesc=(a,b)=>(b.date||'').localeCompare(a.date||'')||(b.at||'').localeCompare(a.at||'');
const activeInj=()=>S.injuries.filter(i=>i.status!=='Alta');
const availability=id=>{const inj=activeInj().filter(i=>i.player===id);if(!inj.length)return['Disponible','ok'];return inj.some(i=>i.status==='Activa')?['Lesionado','warn']:['Readaptación','amber']};
const sortedPlayers=()=>[...S.players].sort((a,b)=>(+a.number||999)-(+b.number||999)||(a.name||'').localeCompare(b.name||''));
const isAdmin=()=>!!(access&&me&&access.owner===me.email.toLowerCase());
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const addDays=(s,n)=>{const d=parse(s);d.setDate(d.getDate()+n);return iso(d)};
const longDate=s=>{const d=parse(s);return d?d.toLocaleDateString('es-AR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}):'—'};
const lines=v=>String(v||'').split('\n').map(x=>x.trim()).filter(Boolean);
const memberName=id=>(members[id]&&members[id].name)||(me&&id===me.uid?(me.displayName||''):'');
const randId=n=>{const a='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';const r=crypto.getRandomValues(new Uint8Array(n));return [...r].map(x=>a[x%a.length]).join('')};

/* asistencia */
const ATT=[['P','Presente','ok'],['T','Llegó tarde','amber'],['JE','Justificada · enfermedad','acc'],['JT','Justificada · trabajo','acc'],['JS','Justificada · estudio','acc'],['JO','Justificada · otra','acc'],['I','Injustificada','warn'],['L','Lesionado','']];
const ATT_LABEL=Object.fromEntries(ATT.map(a=>[a[0],a[1]]));
const attMap=s=>{if(s.att&&typeof s.att==='object')return s.att;if(Array.isArray(s.attendance)){const m={};s.attendance.forEach(id=>m[id]='P');return m}return null};
const hasAtt=s=>{const m=attMap(s);return !!(m&&Object.keys(m).length)};
function attStats(pid,sessions){
 const c={P:0,T:0,JE:0,JT:0,JS:0,JO:0,I:0,L:0,n:0};
 sessions.forEach(s=>{const m=attMap(s);if(!m||!m[pid])return;c[m[pid]]=(c[m[pid]]||0)+1;c.n++});
 const base=c.n-c.L;c.pct=base>0?Math.round((c.P+c.T)/base*100):null;return c;
}
function sessGroupPct(s){const m=attMap(s);if(!m)return null;const v=Object.values(m);const base=v.filter(x=>x!=='L').length;if(!base)return null;return v.filter(x=>x==='P'||x==='T').length/base}
const inLastDays=(d,n)=>{const t=today();return d&&daysBetween(d,t)>=0&&daysBetween(d,t)<n};

/* planificación */
const sortStart=a=>[...a].sort((x,y)=>(x.start||'').localeCompare(y.start||''));
const inRange=(d,x)=>!!(d&&x.start&&x.end&&d>=x.start&&d<=x.end);
const microOf=d=>sortStart(S.micros).find(m=>inRange(d,m));
const mesoOf=d=>sortStart(S.mesos).find(m=>inRange(d,m));
const microNum=m=>m?sortStart(S.micros).findIndex(x=>x.id===m.id)+1:0;
const mesoNum=m=>m?sortStart(S.mesos).findIndex(x=>x.id===m.id)+1:0;
const sessOrder=()=>[...S.sessions].sort((a,b)=>((a.date||'')+(a.time||'')).localeCompare((b.date||'')+(b.time||''))||(a.at||'').localeCompare(b.at||''));
const sessNums=()=>{const m={};sessOrder().forEach((s,i)=>m[s.id]=i+1);return m};
const sessTasks=s=>(Array.isArray(s.tasks)?s.tasks:[]).filter(t=>t&&t.name);
const sessDuration=s=>{if(isNum(s.duration))return +s.duration;const t=sessTasks(s).reduce((a,x)=>a+(isNum(x.time)?+x.time:0),0);return t||null};
const isGym=r=>r.kind==='Gimnasio';

/* bienestar y RPE que carga cada jugador desde su link */
const WELL=[['sleep','Sueño','Dormí muy mal','Dormí muy bien'],['fatigue','Cansancio','Muy cansado','Muy fresco'],['soreness','Dolor muscular','Mucho dolor','Sin dolor'],['stress','Estrés','Muy estresado','Muy tranquilo']];
const wellTotal=c=>WELL.reduce((a,w)=>a+(isNum(c[w[0]])?+c[w[0]]:0),0);
const wellOf=(pid,date)=>S.checkins.filter(c=>c.kind==='well'&&c.player===pid&&c.date===date).sort((a,b)=>(b.at||'').localeCompare(a.at||''))[0];
const rpesOf=date=>S.checkins.filter(c=>c.kind==='rpe'&&c.date===date);
const gymAll=()=>[...S.gymlogs,...S.checkins.filter(c=>c.kind==='rpe'&&c.activity==='Gimnasio').map(c=>({...c,duration:c.minutes,done:c.note,self:true}))];
const playerUrl=t=>location.origin+location.pathname+'#j-'+t;

function toast(msg){const t=$('#toast');t.textContent=msg;t.hidden=false;clearTimeout(toast._t);toast._t=setTimeout(()=>t.hidden=true,2800)}
function errMsg(e){const c=e&&e.code;
 if(c==='permission-denied')return'No tenés permiso para hacer ese cambio.';
 if(c==='resource-exhausted')return'Se alcanzó el límite de uso de la base de datos por hoy.';
 return'No se pudo guardar. Revisá la conexión y probá de nuevo.'}
function authMsg(e){const c=(e&&e.code)||'';
 if(['auth/invalid-credential','auth/wrong-password','auth/user-not-found','auth/invalid-login-credentials'].includes(c))return'Mail o contraseña incorrectos.';
 if(c==='auth/email-already-in-use')return'Ese mail ya tiene una cuenta. Ingresá con tu contraseña o recuperala.';
 if(c==='auth/weak-password')return'La contraseña tiene que tener al menos 6 caracteres.';
 if(c==='auth/invalid-email')return'Ese mail no es válido.';
 if(c==='auth/too-many-requests')return'Demasiados intentos. Esperá unos minutos y probá de nuevo.';
 if(c==='auth/network-request-failed')return'Sin conexión. Revisá el wifi o los datos.';
 return'Algo falló. Probá de nuevo.'}

/* ---------- pantallas de ingreso ---------- */
function gateScreen(html){$('#app').hidden=true;$('#gate').hidden=false;$('#gateCard').innerHTML=html}
function showLogin(mode='login',msg=''){
 const reg=mode==='register', reset=mode==='reset';
 gateScreen(`<img class="crest-lg" src="logo.png" alt="Escudo del club">
 <div><div class="eyebrow">Cuaderno del cuerpo técnico</div><h1>${reg?'Crear cuenta':reset?'Recuperar contraseña':'Ingresar'}</h1></div>
 <p>${reg?'Usá el mail que le pasaste al administrador del equipo.':reset?'Te mandamos un mail con un link para elegir una contraseña nueva.':'Ingresá con el mail y la contraseña de tu cuenta.'}</p>
 <form id="authFrm" data-mode="${mode}" novalidate>
  ${reg?`<div class="fld"><label for="a_name">Nombre y apellido</label><input id="a_name" autocomplete="name" required></div>`:''}
  <div class="fld"><label for="a_mail">Mail</label><input id="a_mail" type="email" autocomplete="email" inputmode="email" autocapitalize="off" required></div>
  ${reset?'':`<div class="fld"><label for="a_pass">Contraseña</label><input id="a_pass" type="password" autocomplete="${reg?'new-password':'current-password'}" minlength="6" required>${reg?'<span class="hint">Mínimo 6 caracteres.</span>':''}</div>`}
  <p class="err" id="authErr" ${msg?'':'hidden'}>${esc(msg)}</p>
  <button class="btn primary block" type="submit">${reg?'Crear cuenta':reset?'Mandar mail':'Ingresar'}</button>
 </form>
 <div class="links">${mode==='login'?`<button class="linkbtn" type="button" data-act="mode" data-mode="register">Crear cuenta</button><button class="linkbtn" type="button" data-act="mode" data-mode="reset">Olvidé mi contraseña</button>`:`<button class="linkbtn" type="button" data-act="mode" data-mode="login">Volver a ingresar</button>`}</div>`);
}
function showVerify(){
 gateScreen(`<img class="crest-lg" src="logo.png" alt="Escudo del club"><h1>Confirmá tu mail</h1>
 <p>Te mandamos un mail a <b>${esc(me.email)}</b>. Abrí el link que llega (revisá también Spam) y después tocá el botón de abajo.</p>
 <button class="btn primary block" type="button" data-act="verified">Ya lo confirmé</button>
 <div class="links"><button class="linkbtn" type="button" data-act="resend">Reenviar mail</button><button class="linkbtn" type="button" data-act="logout">Salir</button></div>`);
}
function showDenied(){
 gateScreen(`<img class="crest-lg" src="logo.png" alt="Escudo del club"><h1>Sin acceso todavía</h1>
 <p>Tu cuenta <b>${esc(me.email)}</b> está creada, pero el administrador del equipo todavía no la habilitó. Pedile que agregue este mail en la sección Accesos.</p>
 <button class="btn primary block" type="button" data-act="retry">Volver a intentar</button>
 <div class="links"><button class="linkbtn" type="button" data-act="logout">Salir</button></div>`);
}

async function onAuthForm(e){
 e.preventDefault();const f=e.target, mode=f.dataset.mode, err=$('#authErr');
 const mail=$('#a_mail').value.trim(), pass=$('#a_pass')?$('#a_pass').value:'', name=$('#a_name')?$('#a_name').value.trim():'';
 const fail=m=>{err.textContent=m;err.hidden=false};
 if(!mail)return fail('Escribí tu mail.');
 if(mode==='register'&&!name)return fail('Escribí tu nombre.');
 const btn=f.querySelector('button[type=submit]');btn.disabled=true;
 try{
  if(mode==='login')await signInWithEmailAndPassword(auth,mail,pass);
  else if(mode==='register'){const c=await createUserWithEmailAndPassword(auth,mail,pass);await updateProfile(c.user,{displayName:name});await sendEmailVerification(c.user);showVerify()}
  else{await sendPasswordResetEmail(auth,mail);showLogin('login','');toast('Listo. Revisá tu mail para elegir una contraseña nueva.')}
 }catch(ex){btn.disabled=false;fail(authMsg(ex))}
}

/* ---------- sesión y datos ---------- */
function stopData(){unsubs.forEach(u=>{try{u()}catch(_){}});unsubs=[];access=null;members={};COLS.forEach(c=>S[c]=[]);club={name:''}}
onAuthStateChanged(auth,user=>{
 if(publicMode)return;
 stopData();me=user;
 if(!user)return showLogin();
 if(!user.emailVerified)return showVerify();
 startAccess();
});
function startAccess(){
 gateScreen(`<img class="crest-lg" src="logo.png" alt="Escudo del club"><h1>Cargando…</h1><p>Conectando con la base de datos del equipo.</p>`);
 const ref=doc(db,'config','access');
 let first=true;
 const u=onSnapshot(ref,snap=>{
  if(!snap.exists()){
   if(snap.metadata.fromCache)return;
   // Solo el administrador puede leer este documento cuando todavía no existe: lo crea.
   setDoc(ref,{owner:me.email.toLowerCase(),emails:[me.email.toLowerCase()]}).catch(()=>showDenied());
   return;
  }
  access=snap.data();
  if(first){first=false;startData()}
  render();
 },err=>{if(err.code==='permission-denied')showDenied();else gateScreen(`<h1>Sin conexión</h1><p>No se pudo conectar con la base de datos. Revisá la conexión.</p><button class="btn primary block" type="button" data-act="retry">Volver a intentar</button>`)});
 unsubs.push(u);
}
function startData(){
 $('#gate').hidden=true;$('#app').hidden=false;
 const nm=me.displayName||me.email.split('@')[0];
 setDoc(doc(db,'members',me.uid),{name:nm,email:me.email.toLowerCase(),seen:new Date().toISOString()}).catch(()=>{});
 rulesOld=false;
 COLS.forEach(col=>unsubs.push(onSnapshot(collection(db,col),s=>{S[col]=s.docs.map(d=>({...d.data(),id:d.id}));render()},err=>{if(err&&err.code==='permission-denied'&&NEW_COLS.includes(col)){rulesOld=true;render()}})));
 unsubs.push(onSnapshot(collection(db,'members'),s=>{members={};s.docs.forEach(d=>members[d.id]=d.data());render()},()=>{}));
 unsubs.push(onSnapshot(doc(db,'config','club'),s=>{club=s.exists()?s.data():{name:''};render()},()=>{}));
}
window.addEventListener('online',()=>render());window.addEventListener('offline',()=>render());

/* ---------- formularios: esquema ---------- */
const POS=['Arquero','Defensor central','Lateral derecho','Lateral izquierdo','Volante central','Volante interno','Enganche','Extremo','Delantero centro'];
const SCHEMA={
 players:{one:'jugador',fields:[
  {k:'name',l:'Nombre y apellido',t:'text',req:1,full:1},
  {k:'number',l:'Dorsal',t:'number',min:1,max:99},
  {k:'position',l:'Posición',t:'select',opts:POS},
  {k:'birth',l:'Fecha de nacimiento',t:'date'},
  {k:'foot',l:'Pie hábil',t:'select',opts:['Derecho','Izquierdo','Ambos']},
  {k:'height',l:'Altura (cm)',t:'number',min:120,max:230},
  {k:'weight',l:'Peso (kg)',t:'number',step:'0.1',min:30,max:150},
  {k:'contact',l:'Contacto',t:'text',full:1,ph:'Teléfono o contacto de un familiar'},
  {k:'gym',l:'¿Hace gimnasio?',t:'select',opts:['Sí','No']},
  {k:'gymDays',l:'Días de gimnasio por semana',t:'number',min:0,max:7},
  {k:'gymPlace',l:'Dónde hace gimnasio',t:'text',full:1,ph:'Gimnasio del club, gimnasio externo, en casa…'},
  {k:'notes',l:'Observaciones',t:'textarea',full:1}]},
 sessions:{one:'sesión',fields:[
  {k:'date',l:'Fecha',t:'date',req:1,def:'today'},
  {k:'time',l:'Hora',t:'time'},
  {k:'type',l:'Tipo',t:'select',opts:['Campo','Táctico','Técnico','Físico','Gimnasio','Regenerativo','Pre-partido','Amistoso'],req:1},
  {k:'duration',l:'Duración total (min)',t:'number',min:5,max:300,hint:'Si lo dejás vacío, se suma el tiempo de las tareas.'},
  {k:'space',l:'Espacio',t:'text',full:1,ph:'Ej: cancha 1 completa, media cancha, gimnasio'},
  {k:'focus',l:'Objetivo general',t:'text',full:1,ph:'Ej: salida desde el fondo ante presión alta'},
  {k:'objectives',l:'Objetivos específicos',t:'textarea',full:1,hint:'Uno por línea.',ph:'Mejorar la circulación por fuera\nAtaque al espacio del 9'},
  {k:'materials',l:'Materiales',t:'textarea',full:1,hint:'Uno por línea.',ph:'20 conos\n12 pelotas\n2 juegos de pecheras'},
  {k:'tasks',l:'Tareas',t:'rows',full:1},
  {k:'routine',l:'Rutina de campo vinculada',t:'routine'},
  {k:'notes',l:'Observaciones',t:'textarea',full:1}]},
 tests:{one:'medición',fields:[
  {k:'date',l:'Fecha',t:'date',req:1,def:'today'},
  {k:'player',l:'Jugador',t:'player',req:1},
  {k:'test',l:'Prueba',t:'text',req:1,list:TEST_NAMES,ph:'Elegí o escribí una'},
  {k:'value',l:'Marca',t:'number',step:'any',req:1},
  {k:'unit',l:'Unidad',t:'select',opts:['s','m','cm','kg','%','km/h','rep','mm','N','mmHg','grados','nivel']},
  {k:'notes',l:'Notas',t:'text',full:1}]},
 injuries:{one:'lesión',fields:[
  {k:'player',l:'Jugador',t:'player',req:1,full:1},
  {k:'date',l:'Fecha de la lesión',t:'date',req:1,def:'today'},
  {k:'context',l:'Ocurrió en',t:'select',opts:['Entrenamiento','Partido','Fuera del club']},
  {k:'zone',l:'Zona',t:'text',req:1,list:['Isquiotibiales','Cuádriceps','Aductores','Gemelo','Tobillo','Rodilla','Cadera','Espalda','Hombro','Pie','Cabeza'],ph:'Ej: Isquiotibiales'},
  {k:'side',l:'Lado',t:'select',opts:['Derecho','Izquierdo','No aplica']},
  {k:'kind',l:'Tipo',t:'select',opts:['Muscular','Ligamentaria','Tendinosa','Ósea','Contusión','Otra']},
  {k:'severity',l:'Gravedad',t:'select',opts:['Leve (1–7 días)','Moderada (8–28 días)','Grave (más de 28 días)']},
  {k:'status',l:'Estado',t:'select',opts:['Activa','En readaptación','Alta'],req:1},
  {k:'eta',l:'Vuelta estimada',t:'date'},
  {k:'returned',l:'Fecha de alta',t:'date'},
  {k:'notes',l:'Diagnóstico y tratamiento',t:'textarea',full:1}]},
 routines:{one:'rutina',fields:[
  {k:'name',l:'Nombre',t:'text',req:1,full:1,ph:'Ej: Prevención isquios – martes'},
  {k:'category',l:'Categoría',t:'select',opts:['Activación','Fuerza','Prevención','Velocidad','Resistencia','Movilidad','Técnico-táctico','Readaptación']},
  {k:'duration',l:'Duración (min)',t:'number',min:1,max:240},
  {k:'target',l:'Para',t:'text',full:1,ph:'Todo el plantel, arqueros, lesionados…'},
  {k:'content',l:'Ejercicios',t:'textarea',full:1,req:1,hint:'Un ejercicio por línea. Ej: Nordic 3×6'}]},
 gymroutines:{col:'routines',one:'rutina de gimnasio',fixed:{kind:'Gimnasio'},fields:[
  {k:'name',l:'Nombre',t:'text',req:1,full:1,ph:'Ej: Fuerza tren inferior – semana 1'},
  {k:'category',l:'Objetivo',t:'select',opts:['Fuerza','Hipertrofia','Potencia','Prevención','Core','Movilidad','Readaptación','Resistencia']},
  {k:'duration',l:'Duración (min)',t:'number',min:1,max:240},
  {k:'target',l:'Para',t:'text',full:1,ph:'Todo el plantel, defensores, jugadores en readaptación…'},
  {k:'indications',l:'Indicaciones generales',t:'textarea',full:1,ph:'Entrada en calor, técnica, cómo progresar la carga'},
  {k:'exercises',l:'Ejercicios',t:'rows',full:1},
  {k:'assigned',l:'Asignada a',t:'players',full:1}]},
 mesos:{one:'mesociclo',fields:[
  {k:'name',l:'Nombre',t:'text',req:1,full:1,ph:'Ej: Pretemporada 2027'},
  {k:'phase',l:'Etapa',t:'select',opts:['Pretemporada','Precompetitivo','Competitivo','Transición']},
  {k:'start',l:'Inicio',t:'date',req:1},
  {k:'end',l:'Fin',t:'date',req:1},
  {k:'objective',l:'Objetivos del mesociclo',t:'textarea',full:1},
  {k:'notes',l:'Notas',t:'textarea',full:1}]},
 micros:{one:'microciclo',fields:[
  {k:'start',l:'Inicio',t:'date',req:1},
  {k:'end',l:'Fin',t:'date',req:1},
  {k:'type',l:'Tipo',t:'select',opts:['Ordinario','Carga','Impacto','Recuperación','Competitivo','Ajuste']},
  {k:'match',l:'Partido o competencia',t:'text',ph:'Ej: vs Atlético Norte (local)'},
  {k:'focus',l:'Objetivo del microciclo',t:'text',full:1},
  {k:'notes',l:'Notas',t:'textarea',full:1}]},
 gymlogs:{one:'registro de gimnasio',fields:[
  {k:'date',l:'Fecha',t:'date',req:1,def:'today'},
  {k:'player',l:'Jugador',t:'player',req:1},
  {k:'routine',l:'Rutina de gimnasio',t:'routine',kind:'Gimnasio'},
  {k:'place',l:'Dónde',t:'select',opts:['Gimnasio del club','Gimnasio externo','En casa']},
  {k:'duration',l:'Duración (min)',t:'number',min:1,max:300},
  {k:'rpe',l:'RPE (1–10)',t:'number',min:1,max:10,step:'0.5'},
  {k:'done',l:'Qué hizo',t:'textarea',full:1,ph:'Ejercicios, cargas, sensaciones'}]},
 matches:{one:'partido',fields:[
  {k:'date',l:'Fecha',t:'date',req:1,def:'today'},
  {k:'time',l:'Hora',t:'time'},
  {k:'rival',l:'Rival',t:'text',req:1,full:1},
  {k:'venue',l:'Condición',t:'select',opts:['Local','Visitante','Neutral']},
  {k:'competition',l:'Competencia',t:'text',ph:'Liga, copa, amistoso'},
  {k:'gf',l:'Goles a favor',t:'number',min:0,max:30},
  {k:'ga',l:'Goles en contra',t:'number',min:0,max:30},
  {k:'squad',l:'Convocados',t:'players',full:1},
  {k:'notes',l:'Notas del partido',t:'textarea',full:1,ph:'Goleadores, cambios, observaciones'}]}
};
const TABS=[['resumen','Resumen'],['players','Plantel'],['plan','Planificación'],['guide','Guía'],['sessions','Sesiones'],['att','Asistencia'],['well','Bienestar'],['gym','Gimnasio'],['routines','Rutinas'],['tests','Tests'],['injuries','Lesiones'],['matches','Partidos']];
const PARTS=['Entrada en calor','Parte principal','Vuelta a la calma'];
const ROWDEF={
 tasks:{add:'+ Agregar tarea',label:'Tarea',cols:[
  {c:'part',l:'Parte',t:'select',opts:PARTS},
  {c:'time',l:'Tiempo (min)',t:'number'},
  {c:'name',l:'Nombre de la tarea',t:'text',w:'full',ph:'Ej: Rondo 4v2'},
  {c:'space',l:'Espacio',t:'text',ph:'Ej: 30×20 m'},
  {c:'org',l:'Organización',t:'text',ph:'Ej: 3 grupos de 6'},
  {c:'mat',l:'Materiales',t:'text',w:'full',ph:'Ej: 12 conos, 6 pecheras'},
  {c:'desc',l:'Desarrollo y consignas',t:'textarea',w:'full'}]},
 exercises:{add:'+ Agregar ejercicio',label:'Ejercicio',cols:[
  {c:'name',l:'Ejercicio',t:'text',w:'full',ph:'Ej: Sentadilla búlgara'},
  {c:'sets',l:'Series',t:'text',w:'q',ph:'4'},
  {c:'reps',l:'Reps o tiempo',t:'text',w:'q',ph:'8 c/pierna'},
  {c:'load',l:'Carga',t:'text',w:'q',ph:'20 kg / 70%'},
  {c:'rest',l:'Pausa',t:'text',w:'q',ph:'90 s'},
  {c:'notes',l:'Indicaciones',t:'text',w:'full',ph:'Técnica, tempo, progresión'}]}
};

/* ---------- render ---------- */
let raf=0; function render(){cancelAnimationFrame(raf);raf=requestAnimationFrame(doRender)}
function doRender(){
 if($('#app').hidden)return;
 $('#clubName').textContent=club.name||'Mi equipo';
 const tabs=[...TABS,['config','Configuración']];
 if(!tabs.some(t=>t[0]===tab))tab='resumen';
 $('#menuCur').textContent=(tabs.find(t=>t[0]===tab)||tabs[0])[1];
 const cnt=k=>k==='routines'?S.routines.filter(r=>!isGym(r)).length:['players','sessions','tests','injuries','matches'].includes(k)?S[k].length:null;
 $('#tabs').innerHTML=tabs.map(([k,l])=>{const c=cnt(k);return `<button class="tab" role="tab" type="button" aria-selected="${tab===k}" data-act="tab" data-k="${k}">${l}${c!=null?`<span class="c">${c}</span>`:''}</button>`}).join('');
 const conn=navigator.onLine?'<span class="pill ok"><span class="dot"></span>En línea</span>':'<span class="pill amber"><span class="dot"></span>Sin conexión · se guarda y sincroniza después</span>';
 $('#who').innerHTML=`${conn}<button class="btn ghost sm me-btn" type="button" data-act="tab" data-k="config" aria-label="Abrir configuración">${me?avatar(me.uid):''}<span>${esc(me?(me.displayName||me.email):'')}</span></button>`;
 // No re-dibujar Configuración mientras se escribe en uno de sus campos.
 if(tab==='config'&&document.activeElement&&document.activeElement.closest('#view form'))return;
 const banner=rulesOld&&['plan','gym','well','resumen'].includes(tab)?`<div class="banner">Falta actualizar las reglas de Firebase para usar Planificación, Gimnasio, Bienestar y los links de los jugadores. Pedile al administrador que las actualice.</div>`:'';
 $('#view').innerHTML=banner+({resumen:vResumen,players:vPlayers,plan:vPlan,guide:vGuide,sessions:vSessions,att:vAtt,well:vWell,gym:vGym,tests:vTests,injuries:vInjuries,routines:vRoutines,matches:vMatches,config:vConfig}[tab])();
}
const addBtn=(key,label,extra='')=>`<button class="btn primary" type="button" data-act="add" data-col="${key}" ${extra}>+ ${label}</button>`;
const colOf=key=>(SCHEMA[key]&&SCHEMA[key].col)||key;
const rowActs=(key,id)=>`<div class="acts"><button class="btn ghost sm" type="button" data-act="edit" data-col="${key}" data-id="${id}">Editar</button><button class="btn ghost sm danger" type="button" data-act="del" data-col="${colOf(key)}" data-id="${id}">Borrar</button></div>`;
const empty=(title,text,col,label)=>`<div class="empty"><strong>${title}</strong><p>${text}</p>${col?addBtn(col,label):''}</div>`;
const byline=d=>`<span>${d.editBy?'Editado por ':'Cargado por '}${esc(pname(d.editBy||d.by))} · ${ago(d.editAt||d.at)}</span>`;

function vResumen(){
 const n=S.players.length, inj=activeInj(), injPlayers=[...new Set(inj.map(i=>i.player))].filter(id=>pl(id));
 const t=today(); const wk=S.sessions.filter(s=>s.date&&daysBetween(s.date,t)>=0&&daysBetween(s.date,t)<7);
 const wkLoad=wk.reduce((a,s)=>a+(load(s)||0),0);
 const prev=S.sessions.filter(s=>s.date&&daysBetween(s.date,t)>=7&&daysBetween(s.date,t)<14).reduce((a,s)=>a+(load(s)||0),0);
 const next=[...S.matches].filter(m=>m.date>=t&&!isNum(m.gf)).sort((a,b)=>(a.date+(a.time||'')).localeCompare(b.date+(b.time||'')))[0];
 const last=[...S.matches].filter(m=>isNum(m.gf)&&isNum(m.ga)).sort(byDateDesc)[0];
 const lastS=sessOrder().filter(s=>s.date<=t).pop();
 const nextS=sessOrder().find(s=>s.date>=t&&!hasAtt(s));
 const att=wk.map(sessGroupPct).filter(x=>x!=null);
 const attPct=att.length?Math.round(att.reduce((a,b)=>a+b,0)/att.length*100):null;
 const NUM=sessNums();
 const trend=prev?Math.round((wkLoad-prev)/prev*100):null;
 let h=`<div class="bar"><div><h2>Resumen</h2><p>Estado del plantel al ${new Date().toLocaleDateString('es-AR',{weekday:'long',day:'numeric',month:'long'})}.</p></div></div>
 <div class="stats">
  <div class="stat"><div class="k">Plantel</div><div class="v">${n}</div><div class="s">jugadores cargados</div></div>
  <div class="stat"><div class="k">Disponibles</div><div class="v">${n-injPlayers.length}</div><div class="s">${attPct!=null?`asistencia semanal ${attPct}%`:'sin sesiones esta semana'}</div></div>
  <div class="stat"><div class="k">Lesionados</div><div class="v ${injPlayers.length?'warn':''}">${injPlayers.length}</div><div class="s">${inj.filter(i=>i.status==='En readaptación').length} en readaptación</div></div>
  <div class="stat"><div class="k">Carga 7 días</div><div class="v">${wkLoad.toLocaleString('es-AR')}</div><div class="s">UA${trend!=null?` · ${trend>0?'+':''}${trend}% vs semana anterior`:''}</div></div>
 </div><div class="cols"><div style="display:grid;gap:18px;min-width:0">`;
 h+=`<div class="panel"><h3>Próximo partido</h3><div class="body">${next?`<div class="match-card"><span class="eyebrow">${esc(next.competition||'Partido')} · ${esc(next.venue||'')}</span><div class="rival">vs ${esc(next.rival)}</div><div class="mono" style="color:var(--muted);font-size:13px">${DOW[parse(next.date).getDay()]} ${fdy(next.date)}${next.time?' · '+esc(next.time)+' h':''} · ${daysBetween(t,next.date)===0?'hoy':'faltan '+daysBetween(t,next.date)+' días'}</div></div>`:`<p style="margin:0;color:var(--muted)">No hay partidos próximos cargados.</p>`}
 ${last?`<div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--line);display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap"><span><span class="eyebrow">Último resultado</span><br>vs ${esc(last.rival)} · ${fd(last.date)}</span><span class="score">${+last.gf} – ${+last.ga}</span></div>`:''}</div></div>`;
 h+=`<div class="panel"><h3>Fuera por lesión <small>${inj.length} activas</small></h3><div class="body">${inj.length?`<div class="mini">${[...inj].sort((a,b)=>(a.eta||'9').localeCompare(b.eta||'9')).map(i=>`<div><span><b>${esc(plName(i.player))}</b> · ${esc(i.zone||'')}</span><span class="pill ${i.status==='Activa'?'warn':'amber'}">${i.eta?'Vuelve '+fd(i.eta):esc(i.status)}</span></div>`).join('')}</div>`:`<p style="margin:0;color:var(--muted)">Todo el plantel está disponible.</p>`}</div></div>`;
 const sessBox=(s,label)=>`<div style="display:grid;gap:8px"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><span><span class="eyebrow">${label} · Sesión N° ${NUM[s.id]}</span><br><b>${esc(s.type||'Sesión')}</b> · ${DOW[parse(s.date).getDay()]} ${fdy(s.date)}${s.time?' · '+esc(s.time)+' h':''}<br><span style="color:var(--muted)">${esc(s.focus||'Sin objetivo cargado')}</span></span><span class="mono">${sessDuration(s)?sessDuration(s)+' min':''}${load(s)!=null?' · '+load(s)+' UA':''}</span></div>
  <div class="tools"><button class="btn sm" type="button" data-act="sheet" data-id="${s.id}">Hoja de sesión</button><button class="btn sm" type="button" data-act="big" data-id="${s.id}">Pantalla grande</button><button class="btn sm" type="button" data-act="att" data-id="${s.id}">Asistencia</button></div></div>`;
 h+=`<div class="panel"><h3>Sesiones</h3><div class="body" style="display:grid;gap:14px">${nextS?sessBox(nextS,nextS.date===t?'Hoy':'Próxima'):''}${lastS&&lastS!==nextS?(nextS?'<div style="border-top:1px solid var(--line)"></div>':'')+sessBox(lastS,'Última'):''}${!nextS&&!lastS?`<p style="margin:0;color:var(--muted)">Todavía no hay sesiones cargadas.</p>`:''}</div></div>`;
 {const ans=sortedPlayers().map(p=>({p,w:wellOf(p.id,t)})).filter(r=>r.w);const al=ans.filter(r=>WELL.some(w=>+r.w[w[0]]<=2));
 h+=`<div class="panel"><h3>Bienestar de hoy <small>${ans.length} de ${n} respondieron</small></h3><div class="body">${al.length?`<div class="mini">${al.map(r=>`<div><span><b>${esc(r.p.name)}</b>${r.w.painZone?' · dolor: '+esc(r.w.painZone):''}</span><span class="pill warn">${WELL.filter(w=>+r.w[w[0]]<=2).map(w=>w[1]).join(', ')}</span></div>`).join('')}</div>`:`<p style="margin:0;color:var(--muted)">${ans.length?'Sin alertas: nadie marcó valores bajos.':'Todavía nadie cargó cómo llegó. Mandales su link desde la pestaña Bienestar.'}</p>`}</div></div>`}
 h+=`</div><div class="panel"><h3>Actividad del cuerpo técnico</h3><div class="body">${feed()}</div></div></div>`;
 if(!n)h=empty('Empecemos por el plantel','Cargá los jugadores primero. Después vas a poder registrar asistencia, tests, lesiones y convocatorias para cada uno.','players','Agregar jugador')+h;
 return h;
}
function feed(){
 const L={players:'agregó a',sessions:'cargó la sesión',tests:'registró un test de',injuries:'registró una lesión de',routines:'creó la rutina',matches:'cargó el partido vs',mesos:'creó el mesociclo',micros:'creó el microciclo del',gymlogs:'registró gimnasio de'};
 const E={players:'editó a',sessions:'editó la sesión',tests:'editó un test de',injuries:'actualizó la lesión de',routines:'editó la rutina',matches:'editó el partido vs',mesos:'editó el mesociclo',micros:'editó el microciclo del',gymlogs:'editó el gimnasio de'};
 const items=[];COLS.filter(c=>L[c]).forEach(c=>S[c].forEach(d=>{const ed=!!d.editAt;const when=d.editAt||d.at;if(!when)return;
  const obj=c==='players'||c==='routines'||c==='mesos'?d.name:c==='tests'||c==='injuries'||c==='gymlogs'?plName(d.player):c==='matches'?d.rival:c==='micros'?fd(d.start):(d.type||'')+' del '+fd(d.date);
  items.push({when,by:d.editBy||d.by,txt:(ed?E:L)[c],obj})}));
 items.sort((a,b)=>b.when.localeCompare(a.when));
 if(!items.length)return`<p style="margin:0;color:var(--muted)">Acá vas a ver quién cargó o cambió cada dato.</p>`;
 return `<div class="feed">${items.slice(0,14).map(i=>`<div class="it">${avatar(i.by)}<div><b>${esc(pname(i.by))}</b> ${i.txt} <b>${esc(i.obj||'')}</b><div class="when">${ago(i.when)}</div></div></div>`).join('')}</div>`;
}
function attPctFor(id){return attStats(id,S.sessions.filter(s=>inLastDays(s.date,30))).pct}
function vPlayers(){
 const ps=sortedPlayers();
 const h=`<div class="bar"><div><h2>Plantel</h2><p>Tocá un jugador para ver su historial completo.</p></div><div class="tools">${addBtn('players','Jugador')}</div></div>`;
 if(!ps.length)return h+empty('Sin jugadores todavía','Cargá nombre, dorsal y posición. Con eso ya podés tomar asistencia en los entrenamientos.','players','Agregar jugador');
 return h+`<div class="list">${ps.map(p=>{const [st,cl]=availability(p.id);const a=age(p.birth);const ap=attPctFor(p.id);
  return `<div class="row r-player click" data-act="player" data-id="${p.id}"><div class="dorsal">${isNum(p.number)?+p.number:'–'}</div>
  <div class="main"><div class="t">${esc(p.name)}</div><div class="m">${p.position?`<span>${esc(p.position)}</span>`:''}${a!=null?`<span>${a} años</span>`:''}${ap!=null?`<span>Asistencia 30 d: ${ap}%</span>`:''}</div></div>
  <span class="pill ${cl}"><span class="dot"></span>${st}</span>${rowActs('players',p.id)}</div>`}).join('')}</div>`;
}
function sessRow(s,NUM){
 const L=load(s);const m=attMap(s);const v=m?Object.values(m):[];const pres=v.filter(x=>x==='P'||x==='T').length;const mc=microOf(s.date);const dur=sessDuration(s);const nt=sessTasks(s).length;
 return `<div class="row r-std click" data-act="sheet" data-id="${s.id}">${dateCell(s.date)}<div class="main"><div class="t"><span class="snum">N° ${NUM[s.id]}</span> ${esc(s.type||'Sesión')}${s.time?` <span class="mono" style="color:var(--muted);font-weight:400">${esc(s.time)}</span>`:''}</div><div class="m">${s.focus?`<span>${esc(s.focus)}</span>`:''}${mc?`<span>MC ${microNum(mc)}${mc.type?' · '+esc(mc.type):''}</span>`:''}${nt?`<span>${nt} tarea${nt>1?'s':''}</span>`:''}${byline(s)}</div></div>
 <div class="side"><div class="figs">${dur?`<div class="fig"><div class="n">${dur}</div><div class="l">min</div></div>`:''}${isNum(s.rpe)?`<div class="fig"><div class="n">${+s.rpe}</div><div class="l">RPE</div></div>`:''}${L!=null?`<div class="fig"><div class="n">${L}</div><div class="l">UA</div></div>`:''}${v.length?`<div class="fig"><div class="n">${pres}/${v.length}</div><div class="l">presentes</div></div>`:''}</div>
 <div class="acts"><button class="btn ghost sm" type="button" data-act="att" data-id="${s.id}">Asistencia</button><button class="btn ghost sm" type="button" data-act="big" data-id="${s.id}">Pantalla grande</button></div></div></div>`;
}
function vSessions(){
 const t=today();const NUM=sessNums();
 const h=`<div class="bar"><div><h2>Sesiones</h2><p>Tocá una sesión para ver la hoja, descargarla o editarla. Carga = RPE × minutos (UA).</p></div><div class="tools">${addBtn('sessions','Sesión')}</div></div>`;
 if(!S.sessions.length)return h+empty('Sin sesiones cargadas','Planificá la sesión con objetivos, materiales y tareas. El día del entrenamiento la proyectás en pantalla grande y después tomás asistencia.','sessions','Crear sesión');
 const next=sessOrder().filter(s=>s.date>=t&&!hasAtt(s));
 const past=sessOrder().filter(s=>!(s.date>=t&&!hasAtt(s))).reverse();
 return h+(next.length?`<div class="panel"><h3>Próximas <small>${next.length}</small></h3><div class="list" style="border:0;border-radius:0 0 12px 12px">${next.map(s=>sessRow(s,NUM)).join('')}</div></div>`:'')
  +(past.length?`<div class="panel"><h3>Realizadas <small>${past.length}</small></h3><div class="list" style="border:0;border-radius:0 0 12px 12px">${past.map(s=>sessRow(s,NUM)).join('')}</div></div>`:'');
}
function vTests(){
 const types=[...new Set(S.tests.map(t=>t.test).filter(Boolean))].sort();
 if(testFilter&&!types.includes(testFilter))testFilter='';
 let h=`<div class="bar"><div><h2>Tests y tiempos</h2><p>Mediciones físicas por jugador. Filtrá una prueba para ver el ranking.</p></div><div class="tools">${types.length?`<select class="flt" id="testFilter" aria-label="Filtrar prueba"><option value="">Todas las pruebas</option>${types.map(t=>`<option ${t===testFilter?'selected':''}>${esc(t)}</option>`).join('')}</select>`:''}${addBtn('tests','Medición')}</div></div>`;
 if(!S.tests.length)return h+empty('Sin mediciones','Cargá sprints, saltos, Yo-Yo o peso. Cada marca queda guardada con fecha para ver la evolución.','tests','Cargar medición');
 if(testFilter){
  const rows=S.tests.filter(t=>t.test===testFilter);const latest={};[...rows].sort(byDateDesc).forEach(t=>{if(!latest[t.player])latest[t.player]=t});
  const unit=rows[0]&&rows[0].unit;const lowBetter=unit==='s'||/sprint|agilidad|grasa|rsa/i.test(testFilter);
  const rk=Object.values(latest).sort((a,b)=>lowBetter?a.value-b.value:b.value-a.value);
  h+=`<div class="panel"><h3>Ranking · última marca <small>${lowBetter?'menor es mejor':'mayor es mejor'}</small></h3><div class="tablewrap" style="border:0;border-radius:0 0 12px 12px"><table><thead><tr><th>#</th><th>Jugador</th><th class="r">Marca</th><th>Fecha</th></tr></thead><tbody>${rk.map((t,i)=>`<tr><td><span class="rk">${i+1}</span></td><td>${esc(plName(t.player))}</td><td class="r num">${esc(t.value)} ${esc(t.unit||'')}</td><td class="num">${fdy(t.date)}</td></tr>`).join('')}</tbody></table></div></div>`;
 }
 const list=S.tests.filter(t=>!testFilter||t.test===testFilter).sort(byDateDesc);
 return h+`<div class="tablewrap"><table><thead><tr><th>Fecha</th><th>Jugador</th><th>Prueba</th><th class="r">Marca</th><th>Notas</th><th>Cargó</th><th></th></tr></thead><tbody>${list.map(t=>`<tr><td class="num">${fdy(t.date)}</td><td>${esc(plName(t.player))}</td><td>${esc(t.test)}</td><td class="r num">${esc(t.value)} ${esc(t.unit||'')}</td><td style="white-space:normal;min-width:120px">${esc(t.notes||'')}</td><td style="color:var(--muted)">${esc(pname(t.editBy||t.by))}</td><td>${rowActs('tests',t.id)}</td></tr>`).join('')}</tbody></table></div>`;
}
function vInjuries(){
 const h=`<div class="bar"><div><h2>Lesiones</h2><p>Seguimiento médico: días de baja, vuelta estimada y alta.</p></div><div class="tools"><select class="flt" id="injFilter" aria-label="Filtrar lesiones"><option value="activas" ${injFilter==='activas'?'selected':''}>Activas y en readaptación</option><option value="todas" ${injFilter==='todas'?'selected':''}>Todo el historial</option></select>${addBtn('injuries','Lesión')}</div></div>`;
 const list=S.injuries.filter(i=>injFilter==='todas'||i.status!=='Alta').sort((a,b)=>(a.status==='Alta')-(b.status==='Alta')||byDateDesc(a,b));
 if(!list.length)return h+empty(S.injuries.length?'No hay lesionados':'Sin lesiones registradas',S.injuries.length?'Todo el plantel está disponible. Cambiá el filtro para ver el historial.':'Cuando un jugador se lesione, registrá zona, tipo y gravedad. Los días de baja se cuentan solos.','injuries','Registrar lesión');
 const t=today();
 return h+`<div class="list">${list.map(i=>{const end=i.status==='Alta'&&i.returned?i.returned:t;const days=i.date?Math.max(0,daysBetween(i.date,end)):null;const cl=i.status==='Activa'?'warn':i.status==='Alta'?'ok':'amber';
  return `<div class="row r-std">${dateCell(i.date)}<div class="main"><div class="t">${esc(plName(i.player))}</div><div class="m"><span>${esc([i.zone,i.side&&i.side!=='No aplica'?i.side.toLowerCase():''].filter(Boolean).join(' '))}${i.kind?' · '+esc(i.kind):''}</span>${i.severity?`<span>${esc(i.severity)}</span>`:''}${i.context?`<span>En ${esc(i.context.toLowerCase())}</span>`:''}${byline(i)}</div></div>
  <div class="side"><div class="figs"><span class="pill ${cl}"><span class="dot"></span>${esc(i.status||'Activa')}</span>${days!=null?`<div class="fig"><div class="n">${days}</div><div class="l">días</div></div>`:''}${i.status!=='Alta'&&i.eta?`<div class="fig"><div class="n">${fd(i.eta)}</div><div class="l">vuelta est.</div></div>`:''}${i.status==='Alta'&&i.returned?`<div class="fig"><div class="n">${fd(i.returned)}</div><div class="l">alta</div></div>`:''}</div>${rowActs('injuries',i.id)}</div>
  ${i.notes?`<div class="notes">${esc(i.notes)}</div>`:''}</div>`}).join('')}</div>`;
}
function vRoutines(){
 const h=`<div class="bar"><div><h2>Rutinas de campo</h2><p>Activaciones, prevención y trabajos que se vinculan a las sesiones. Las de gimnasio están en la pestaña Gimnasio.</p></div><div class="tools">${addBtn('routines','Rutina')}</div></div>`;
 const rs=S.routines.filter(r=>!isGym(r));
 if(!rs.length)return h+empty('Sin rutinas','Guardá las rutinas de activación o prevención para reutilizarlas y que todo el cuerpo técnico use la misma.','routines','Crear rutina');
 return h+`<div class="grid-cards">${[...rs].sort((a,b)=>(a.category||'').localeCompare(b.category||'')||(a.name||'').localeCompare(b.name||'')).map(r=>{const used=S.sessions.filter(s=>s.routine===r.id).length;
  return `<article class="rcard"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap">${r.category?`<span class="pill acc">${esc(r.category)}</span>`:'<span></span>'}${isNum(r.duration)?`<span class="mono" style="color:var(--muted)">${+r.duration} min</span>`:''}</div>
  <h4>${esc(r.name)}</h4>${r.target?`<div style="font-size:13px;color:var(--muted)">Para: ${esc(r.target)}</div>`:''}
  <ol>${String(r.content||'').split('\n').map(x=>x.trim()).filter(Boolean).map(x=>`<li>${esc(x)}</li>`).join('')}</ol>
  <div class="foot"><span>${used?`Usada en ${used} sesión${used>1?'es':''} · `:''}${esc(pname(r.editBy||r.by))}</span>${rowActs('routines',r.id)}</div></article>`}).join('')}</div>`;
}
function vMatches(){
 let h=`<div class="bar"><div><h2>Partidos</h2><p>Fixture, resultados y convocados.</p></div><div class="tools">${addBtn('matches','Partido')}</div></div>`;
 if(!S.matches.length)return h+empty('Sin partidos','Cargá el fixture con rival y fecha. Después del partido completá el resultado y los convocados.','matches','Cargar partido');
 const t=today();const played=S.matches.filter(m=>isNum(m.gf)&&isNum(m.ga));
 const w=played.filter(m=>+m.gf>+m.ga).length,d=played.filter(m=>+m.gf===+m.ga).length,l=played.length-w-d;
 const gf=played.reduce((a,m)=>a+ +m.gf,0),ga=played.reduce((a,m)=>a+ +m.ga,0);
 if(played.length)h+=`<div class="stats"><div class="stat"><div class="k">Jugados</div><div class="v">${played.length}</div></div><div class="stat"><div class="k">G · E · P</div><div class="v">${w}·${d}·${l}</div></div><div class="stat"><div class="k">Goles</div><div class="v">${gf}:${ga}</div><div class="s">diferencia ${gf-ga>0?'+':''}${gf-ga}</div></div><div class="stat"><div class="k">Puntos</div><div class="v">${w*3+d}</div><div class="s">de ${played.length*3} posibles</div></div></div>`;
 return h+`<div class="list">${[...S.matches].sort(byDateDesc).map(m=>{const has=isNum(m.gf)&&isNum(m.ga);const res=has?(+m.gf>+m.ga?['Ganado','ok']:+m.gf===+m.ga?['Empate','amber']:['Perdido','warn']):m.date>=t?['Próximo','acc']:['Sin resultado',''];
  return `<div class="row r-std">${dateCell(m.date)}<div class="main"><div class="t">vs ${esc(m.rival)}</div><div class="m">${m.venue?`<span>${esc(m.venue)}</span>`:''}${m.competition?`<span>${esc(m.competition)}</span>`:''}${m.time?`<span class="mono">${esc(m.time)} h</span>`:''}${Array.isArray(m.squad)&&m.squad.length?`<span>${m.squad.length} convocados</span>`:''}${byline(m)}</div></div>
  <div class="side"><div class="figs">${has?`<span class="score">${+m.gf} – ${+m.ga}</span>`:''}<span class="pill ${res[1]}">${res[0]}</span></div>${rowActs('matches',m.id)}</div>
  ${m.notes?`<div class="notes">${esc(m.notes)}</div>`:''}</div>`}).join('')}</div>`;
}
function vConfig(){
 const admin=isAdmin();
 let h=`<div class="bar"><div><h2>Configuración</h2><p>${admin?'Datos del equipo, accesos del cuerpo técnico y tu cuenta.':'Tu cuenta y datos del equipo.'}</p></div></div>`;
 // Equipo
 h+=`<div class="panel"><h3>Equipo</h3><div class="body">${admin
  ?`<form id="clubFrm" class="form" novalidate><div class="fld full"><label for="clubIn">Nombre del equipo o categoría</label><input id="clubIn" value="${esc(club.name)}" placeholder="Ej: Primera división" required><span class="hint">Es el nombre que aparece arriba, al lado del escudo.</span></div><div class="formacts"><button class="btn primary" type="submit">Guardar nombre</button></div></form>`
  :`<div class="mini"><div><span style="color:var(--muted)">Nombre</span><span>${esc(club.name||'Mi equipo')}</span></div></div><p class="hint" style="margin:8px 0 0;font-size:13px;color:var(--muted)">Solo el administrador puede cambiar los datos del equipo.</p>`}</div></div>`;
 // Accesos
 if(admin){
  const emails=(access&&access.emails)||[];const byMail={};Object.entries(members).forEach(([id,m])=>{if(m.email)byMail[m.email]={id,...m}});
  h+=`<div class="panel"><h3>Accesos del cuerpo técnico <small>${emails.length} habilitados</small></h3><div class="body" style="display:grid;gap:14px">
  <p style="margin:0;color:var(--muted);font-size:14px">Solo los mails de esta lista pueden ver y cargar datos. Esta parte la ves únicamente vos.</p>
  <form id="accFrm" class="form" novalidate><div class="fld full"><label for="accMail">Habilitar un mail</label><input id="accMail" type="email" inputmode="email" autocapitalize="off" placeholder="nombre@gmail.com" required><span class="hint">Después pasale el link de la app: entra con "Crear cuenta" usando ese mismo mail.</span></div><div class="formacts"><button class="btn primary" type="submit">Habilitar</button></div></form>
  <div class="list">${emails.map(e=>{const m=byMail[e];const owner=e===access.owner;
   return `<div class="row r-mail"><div class="main"><div class="t">${esc(m?m.name:e)}${owner?' <span class="pill acc">Administrador</span>':''}</div><div class="m"><span>${esc(e)}</span><span>${m?'Cuenta creada · último ingreso '+ago(m.seen):'Todavía no creó su cuenta'}</span></div></div>
   ${owner?'':`<div class="acts"><button class="btn ghost sm danger" type="button" data-act="unmail" data-mail="${esc(e)}">Quitar acceso</button></div>`}</div>`}).join('')}</div></div></div>`;
 }
 // Mi cuenta
 h+=`<div class="panel"><h3>Mi cuenta</h3><div class="body" style="display:grid;gap:14px">
  <form id="meFrm" class="form" novalidate><div class="fld"><label for="meName">Tu nombre</label><input id="meName" value="${esc(me.displayName||'')}" autocomplete="name" required><span class="hint">Así te ven los demás en la actividad.</span></div><div class="fld"><span class="lb">Mail</span><input value="${esc(me.email)}" disabled aria-label="Mail"></div><div class="formacts"><button class="btn primary" type="submit">Guardar nombre</button></div></form>
  <div class="formacts" style="justify-content:flex-start;border-top:1px solid var(--line);padding-top:14px"><button class="btn" type="button" data-act="pwreset">Cambiar contraseña</button><button class="btn danger" type="button" data-act="logout">Cerrar sesión</button></div>
 </div></div>`;
 // Instalar
 h+=`<div class="panel"><h3>Instalar en el teléfono</h3><div class="body"><ol style="margin:0;padding-left:20px;display:grid;gap:4px;font-size:14px"><li>Abrí la app en <b>Safari</b> (en Android, en Chrome).</li><li>Tocá el botón <b>Compartir</b> (en Android, el menú ⋮).</li><li>Elegí <b>Agregar a inicio</b>.</li></ol></div></div>`;
 return h;
}

/* ---------- detalle de jugador ---------- */
function openPlayer(id){
 const p=pl(id);if(!p)return;const [st,cl]=availability(id);const a=age(p.birth);const ap=attPctFor(id);
 const tests=S.tests.filter(t=>t.player===id).sort(byDateDesc);const inj=S.injuries.filter(i=>i.player===id).sort(byDateDesc);
 const matches=S.matches.filter(m=>Array.isArray(m.squad)&&m.squad.includes(id)).length;
 const facts=[['Posición',p.position],['Edad',a!=null?a+' años ('+fdy(p.birth)+')':''],['Pie hábil',p.foot],['Altura',isNum(p.height)?p.height+' cm':''],['Peso',isNum(p.weight)?p.weight+' kg':''],['Contacto',p.contact],['Asistencia últimos 30 días',ap!=null?ap+'%':'Sin registros'],['Convocatorias',String(matches)],['Gimnasio',p.gym==='Sí'?['Sí',isNum(p.gymDays)?p.gymDays+' días/semana':'',p.gymPlace].filter(Boolean).join(' · '):p.gym]].filter(x=>x[1]);
 const as=attStats(id,S.sessions.filter(s=>inLastDays(s.date,30)));
 const gl=gymAll().filter(g=>g.player===id).sort(byDateDesc).slice(0,6);
 const gr=S.routines.filter(r=>isGym(r)&&Array.isArray(r.assigned)&&r.assigned.includes(id));
 $('#mTitle').textContent='Ficha del jugador';
 $('#mBody').innerHTML=`<div class="det-head"><div class="dorsal">${isNum(p.number)?+p.number:'–'}</div><div><div style="font-family:var(--f-display);font-size:28px;font-weight:700;text-transform:uppercase;line-height:1.05">${esc(p.name)}</div><span class="pill ${cl}"><span class="dot"></span>${st}</span></div></div>
 <div class="det-sec"><h4>Datos</h4><div class="mini">${facts.map(f=>`<div><span style="color:var(--muted)">${f[0]}</span><span>${esc(f[1])}</span></div>`).join('')}</div></div>
 ${p.notes?`<div class="det-sec"><h4>Observaciones</h4><div style="white-space:pre-wrap">${esc(p.notes)}</div></div>`:''}
 <div class="det-sec"><h4>Asistencia últimos 30 días</h4>${as.n?`<div class="att-sum">${ATT.filter(x=>as[x[0]]).map(x=>`<span class="pill ${x[2]}">${x[1]}: ${as[x[0]]}</span>`).join('')}</div>`:'<div style="color:var(--muted)">Sin registros de asistencia.</div>'}</div>
 <div class="det-sec"><h4>Bienestar y RPE (lo carga el jugador)</h4>${(()=>{const wl=S.checkins.filter(c=>c.player===id).sort(byDateDesc).slice(0,6);return wl.length?`<div class="mini">${wl.map(c=>c.kind==='well'?`<div><span>${fdy(c.date)} · Bienestar${c.painZone?' · dolor: '+esc(c.painZone):''}</span><span class="num">${WELL.map(w=>w[1][0]+(c[w[0]]??'–')).join(' ')} · ${wellTotal(c)}/20</span></div>`:`<div><span>${fdy(c.date)} · ${esc(c.activity||'')}</span><span class="num">RPE ${esc(c.rpe)}${isNum(c.minutes)?' · '+c.minutes+' min · '+Math.round(c.rpe*c.minutes)+' UA':''}</span></div>`).join('')}</div>`:'<div style="color:var(--muted)">Todavía no cargó nada. Mandale su link.</div>'})()}</div>
 <div class="det-sec"><h4>Gimnasio</h4>${gr.length?`<div style="margin-bottom:8px;font-size:14px">Rutinas asignadas: ${gr.map(r=>`<button class="linkbtn" type="button" data-act="rsheet" data-id="${r.id}">${esc(r.name)}</button>`).join(' · ')}</div>`:''}${gl.length?`<div class="mini">${gl.map(g=>{const r=S.routines.find(x=>x.id===g.routine);return `<div><span>${fdy(g.date)} · ${esc(r?r.name:(g.done||'Gimnasio').split('\n')[0])}</span><span class="num" style="color:var(--muted)">${[isNum(g.duration)?g.duration+' min':'',isNum(g.rpe)?'RPE '+g.rpe:''].filter(Boolean).join(' · ')}</span></div>`}).join('')}</div>`:'<div style="color:var(--muted)">Sin registros de gimnasio.</div>'}</div>
 <div class="det-sec"><h4>Tests (${tests.length})</h4>${tests.length?`<div class="mini">${tests.map(t=>`<div><span>${esc(t.test)} · <span class="num" style="color:var(--muted)">${fdy(t.date)}</span></span><span class="num">${esc(t.value)} ${esc(t.unit||'')}</span></div>`).join('')}</div>`:'<div style="color:var(--muted)">Sin mediciones.</div>'}</div>
 <div class="det-sec"><h4>Lesiones (${inj.length})</h4>${inj.length?`<div class="mini">${inj.map(i=>`<div><span>${esc(i.zone||'')} ${i.kind?'· '+esc(i.kind):''} · <span class="num" style="color:var(--muted)">${fdy(i.date)}</span></span><span class="pill ${i.status==='Activa'?'warn':i.status==='Alta'?'ok':'amber'}">${esc(i.status||'')}</span></div>`).join('')}</div>`:'<div style="color:var(--muted)">Sin lesiones registradas.</div>'}</div>
 <div class="formacts"><button class="btn" type="button" data-act="add" data-col="tests" data-pre="${id}">+ Test</button><button class="btn" type="button" data-act="add" data-col="injuries" data-pre="${id}">+ Lesión</button><button class="btn" type="button" data-act="add" data-col="gymlogs" data-pre="${id}">+ Gimnasio</button><button class="btn" type="button" data-act="plink" data-id="${id}">Link del jugador</button><button class="btn primary" type="button" data-act="edit" data-col="players" data-id="${id}">Editar ficha</button></div>`;
 showModal();
}

/* ---------- formularios ---------- */
function fieldHTML(f,v){
 const id='f_'+f.k, req=f.req?'required':'', full=f.full?' full':'';
 let inp='';
 if(f.t==='textarea')inp=`<textarea id="${id}" name="${f.k}" ${req} placeholder="${esc(f.ph||'')}">${esc(v)}</textarea>`;
 else if(f.t==='select')inp=`<select id="${id}" name="${f.k}" ${req}><option value="">—</option>${f.opts.map(o=>`<option ${o===v?'selected':''}>${esc(o)}</option>`).join('')}</select>`;
 else if(f.t==='player')inp=`<select id="${id}" name="${f.k}" ${req}><option value="">Elegí un jugador</option>${sortedPlayers().map(p=>`<option value="${p.id}" ${p.id===v?'selected':''}>${isNum(p.number)?+p.number+' · ':''}${esc(p.name)}</option>`).join('')}</select>`;
 else if(f.t==='routine')inp=`<select id="${id}" name="${f.k}"><option value="">Ninguna</option>${S.routines.filter(r=>f.kind==='Gimnasio'?isGym(r):!isGym(r)).map(r=>`<option value="${r.id}" ${r.id===v?'selected':''}>${esc(r.name)}</option>`).join('')}</select>`;
 else if(f.t==='rows'){const def=ROWDEF[f.k];const rows=Array.isArray(v)&&v.length?v:[{}];
  return `<div class="fld full"><span class="lb">${f.l}</span><div class="rows" data-rows="${f.k}">${rows.map((r,i)=>rowCard(f.k,r,i)).join('')}</div><div><button type="button" class="btn sm" data-act="rowadd" data-k="${f.k}">${def.add}</button></div></div>`;}
 else if(f.t==='players'){const sel=new Set(Array.isArray(v)?v:[]);const ps=sortedPlayers();
  if(!ps.length)return `<div class="fld full"><span class="lb">${f.l}</span><div class="hint">Primero cargá jugadores en Plantel.</div></div>`;
  return `<div class="fld full"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><span class="lb">${f.l} · <span id="cnt_${f.k}">${sel.size}</span>/${ps.length}</span><span style="display:flex;gap:4px"><button type="button" class="btn ghost sm" data-act="chk" data-k="${f.k}" data-mode="avail">Disponibles</button><button type="button" class="btn ghost sm" data-act="chk" data-k="${f.k}" data-mode="all">Todos</button><button type="button" class="btn ghost sm" data-act="chk" data-k="${f.k}" data-mode="none">Ninguno</button></span></div>
  <div class="checks" data-group="${f.k}">${ps.map(p=>`<label><input type="checkbox" id="c_${f.k}_${p.id}" value="${p.id}" ${sel.has(p.id)?'checked':''}><span class="n">${isNum(p.number)?+p.number:''}</span>${esc(p.name)}</label>`).join('')}</div></div>`;}
 else {const list=f.list?`list="dl_${f.k}"`:'';
  inp=`<input id="${id}" name="${f.k}" type="${f.t}" ${req} ${list} value="${esc(v)}" ${f.min!=null?`min="${f.min}"`:''} ${f.max!=null?`max="${f.max}"`:''} ${f.step?`step="${f.step}"`:''} placeholder="${esc(f.ph||'')}" ${f.t==='number'?'inputmode="decimal"':''}>${f.list?`<datalist id="dl_${f.k}">${f.list.map(o=>`<option value="${esc(o)}">`).join('')}</datalist>`:''}`;}
 return `<div class="fld${full}"><label for="${id}">${f.l}${f.req?' *':''}</label>${inp}${f.hint?`<span class="hint">${f.hint}</span>`:''}</div>`;
}
function rowCard(key,r,i){
 const def=ROWDEF[key];const uid=randId(6);
 return `<div class="rowcard" data-row><div class="rc-head"><b>${def.label} <span class="rc-n">${i+1}</span></b><span class="tools" style="gap:2px"><button type="button" class="btn ghost sm" data-act="rowup" aria-label="Subir">↑</button><button type="button" class="btn ghost sm" data-act="rowdown" aria-label="Bajar">↓</button><button type="button" class="btn ghost sm danger" data-act="rowdel">Quitar</button></span></div>
 <div class="rc-grid">${def.cols.map(c=>{const id=`r_${key}_${uid}_${c.c}`;const v=r[c.c]??'';const w=c.w==='full'?' full':c.w==='q'?' q':'';
  let inp;if(c.t==='select')inp=`<select id="${id}" data-c="${c.c}">${c.opts.map(o=>`<option ${o===v?'selected':''}>${esc(o)}</option>`).join('')}</select>`;
  else if(c.t==='textarea')inp=`<textarea id="${id}" data-c="${c.c}" rows="3">${esc(v)}</textarea>`;
  else inp=`<input id="${id}" data-c="${c.c}" type="${c.t==='number'?'number':'text'}" ${c.t==='number'?'inputmode="numeric" min="0"':''} value="${esc(v)}" placeholder="${esc(c.ph||'')}">`;
  return `<div class="fld${w}"><label for="${id}">${c.l}</label>${inp}</div>`}).join('')}</div></div>`;
}
function renumRows(box){box.querySelectorAll('[data-row] .rc-n').forEach((n,i)=>n.textContent=i+1)}
let editing=null;
function openForm(key,id,o={}){
 const sc=SCHEMA[key];const col=colOf(key);const src=id?S[col].find(x=>x.id===id):(o.copy?S[col].find(x=>x.id===o.copy):null);const d=id?src:null;
 if(['tests','injuries','gymlogs'].includes(col)&&!S.players.length){toast('Primero cargá al menos un jugador en Plantel.');return}
 editing={key,col,id};
 const defs={};
 if(!d){
  if(o.pre)defs.player=o.pre;
  if(o.date)defs.date=o.date;
  if(col==='injuries')defs.status='Activa';
  if(col==='tests')defs.unit='s';
  if(key==='sessions')defs.tasks=PARTS.map(p=>({part:p}));
  if(key==='mesos'){defs.start=today();defs.end=addDays(today(),27)}
  if(key==='micros'){const last=sortStart(S.micros).pop();const st=o.date||(last&&last.end?addDays(last.end,1):today());defs.start=st;defs.end=addDays(st,6)}
  if(o.tpl){Object.assign(defs,o.tpl);defs.time=gset().time}
  if(src){Object.assign(defs,src);['date','att','attendance','rpe','shareId','id','by','at','editBy','editAt'].forEach(k=>delete defs[k]);defs.date=o.date||today()}
 }
 $('#mTitle').textContent=(id?'Editar ':o.copy?'Duplicar ':'Nuevo ')+sc.one;
 $('#mBody').innerHTML=`<form class="form" id="frm" novalidate>${sc.fields.map(f=>{let v=d?d[f.k]:(f.k in defs?defs[f.k]:(f.def==='today'?today():''));return fieldHTML(f,v??'')}).join('')}
 <div class="formacts"><button type="button" class="btn" data-act="close">Cancelar</button><button type="submit" class="btn primary">${id?'Guardar cambios':'Guardar'}</button></div></form>`;
 showModal();
}
function readForm(){
 const {key}=editing;const out={};const frm=$('#frm');
 for(const f of SCHEMA[key].fields){
  if(f.t==='players'){out[f.k]=[...frm.querySelectorAll(`[data-group="${f.k}"] input:checked`)].map(c=>c.value);continue}
  if(f.t==='rows'){const def=ROWDEF[f.k];out[f.k]=[...frm.querySelectorAll(`[data-rows="${f.k}"] [data-row]`)].map(card=>{const r={};def.cols.forEach(c=>{let v=card.querySelector(`[data-c="${c.c}"]`).value.trim();if(c.t==='number'&&v!==''){v=Number(v.replace(',','.'));if(isNaN(v))v=''}r[c.c]=v});return r}).filter(r=>r.name);continue}
  const el=frm.elements[f.k];if(!el)continue;let v=el.value.trim();
  if(f.req&&!v){el.focus();toast(`Completá “${f.l}”.`);return null}
  if(f.t==='number'&&v!==''){v=Number(v.replace(',','.'));if(isNaN(v)){el.focus();toast(`“${f.l}” tiene que ser un número.`);return null}}
  out[f.k]=v;
 }
 if(editing.col==='injuries'&&out.status==='Alta'&&!out.returned)out.returned=today();
 if(out.start&&out.end&&out.end<out.start){toast('La fecha de fin tiene que ser posterior al inicio.');return null}
 return out;
}
function submitForm(e){
 e.preventDefault();if(!editing)return;const vals=readForm();if(!vals)return;
 const now=new Date().toISOString();const {key,col,id}=editing;const fixed=SCHEMA[key].fixed||{};let p;
 if(id){const old=S[col].find(x=>x.id===id)||{};const body={...old,...vals,...fixed,editBy:me.uid,editAt:now};delete body.id;p=setDoc(doc(db,col,id),body);
  if(col==='routines'&&old.shareId)setDoc(doc(db,'public',old.shareId),publicRoutine(body)).catch(()=>{})}
 else p=setDoc(doc(collection(db,col)),{...vals,...fixed,by:me.uid,at:now});
 p.catch(err=>toast(err&&err.code==='permission-denied'&&NEW_COLS.includes(col)?'Falta actualizar las reglas de Firebase para guardar esto.':errMsg(err)));
 if(key==='gymroutines'){const old=id?S[col].find(x=>x.id===id):null;const ids=new Set([...(vals.assigned||[]),...((old&&old.assigned)||[])]);setTimeout(()=>ids.forEach(pid=>{const pp=pl(pid);if(pp&&pp.linkId)syncPlink(pp)}),600)}
 closeModal();toast(navigator.onLine?(id?'Cambios guardados':'Guardado'):'Guardado en el teléfono. Se sincroniza cuando vuelva la señal.');
}
function showModal(){$('#modal').hidden=false;document.body.style.overflow='hidden'}
function closeModal(){$('#modal').hidden=true;document.body.style.overflow='';editing=null}
function del(btn){
 if(!btn.classList.contains('armed')){btn.classList.add('armed');btn.textContent='¿Confirmar?';setTimeout(()=>{btn.classList.remove('armed');btn.textContent='Borrar'},4000);return}
 const {col,id}=btn.dataset;const old=S[col]&&S[col].find(x=>x.id===id);
 if(col==='routines'&&old&&old.shareId)deleteDoc(doc(db,'public',old.shareId)).catch(()=>{});
 if(col==='players'&&old&&old.linkId)deleteDoc(doc(db,'plinks',old.linkId)).catch(()=>{});
 deleteDoc(doc(db,col,id)).catch(err=>toast(errMsg(err)));toast('Borrado');closeDoc();
}

/* ---------- planificación ---------- */
function vPlan(){
 const h=`<div class="bar"><div><h2>Planificación</h2><p>Mesociclos, microciclos y sesiones. Cada sesión se ubica sola en su microciclo según la fecha.</p></div><div class="tools"><button class="btn" type="button" data-act="gyear">Armar con la guía</button><button class="btn" type="button" data-act="add" data-col="mesos">+ Mesociclo</button><button class="btn" type="button" data-act="add" data-col="micros">+ Microciclo</button>${addBtn('sessions','Sesión')}</div></div>`;
 const ms=sortStart(S.mesos), mcs=sortStart(S.micros);
 if(!ms.length&&!mcs.length)return h+`<div class="empty"><strong>Armá la temporada</strong><p>Empezá por un mesociclo (por ejemplo, la pretemporada) y dividilo en microciclos de una semana. Después creá las sesiones de cada microciclo.</p><div class="tools" style="justify-content:center"><button class="btn primary" type="button" data-act="gyear">Armar la temporada con la guía</button><button class="btn" type="button" data-act="add" data-col="mesos">+ Mesociclo</button><button class="btn" type="button" data-act="add" data-col="micros">+ Microciclo</button></div></div>`;
 const NUM=sessNums();
 const microBlock=c=>{const ss=sessOrder().filter(s=>inRange(s.date,c));const ld=ss.reduce((a,s)=>a+(load(s)||0),0);
  return `<div class="mc"><div class="k">MC ${microNum(c)}<small>${fd(c.start)}–${fd(c.end)}</small></div>
  <div class="main" style="min-width:0"><div class="t" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">${c.type?`<span class="pill acc">${esc(c.type)}</span>`:''}${c.match?`<span style="font-weight:600">${esc(c.match)}</span>`:''}</div>${c.focus?`<div style="font-size:14px;margin-top:2px">${esc(c.focus)}</div>`:''}
  <div class="chips">${ss.map(s=>`<button class="chip" type="button" data-act="sheet" data-id="${s.id}"><b>N° ${NUM[s.id]}</b>${DOW[parse(s.date).getDay()]} ${fd(s.date)} · ${esc(s.type||'Sesión')}${hasAtt(s)?' ✓':''}</button>`).join('')}<button class="chip add" type="button" data-act="add" data-col="sessions" data-date="${c.start}">+ Sesión</button><button class="chip add" type="button" data-act="gmicro" data-id="${c.id}">Sesiones guía</button></div>
  ${ld?`<div style="font-size:12px;color:var(--muted);margin-top:4px">${ss.length} sesi${ss.length===1?'ón':'ones'} · carga ${ld.toLocaleString('es-AR')} UA</div>`:''}</div>${rowActs('micros',c.id)}</div>`};
 let out=h;
 ms.forEach(m=>{const own=mcs.filter(c=>inRange(c.start,m));const weeks=Math.round((daysBetween(m.start,m.end)+1)/7);
  out+=`<div class="panel"><div class="meso-head"><div class="ttl"><div><div class="eyebrow">Mesociclo ${mesoNum(m)}${m.phase?' · '+esc(m.phase):''}</div><h4>${esc(m.name)}</h4><div class="mono" style="font-size:13px;color:var(--muted)">${fdy(m.start)} – ${fdy(m.end)} · ${weeks} semana${weeks!==1?'s':''} · ${own.length} microciclo${own.length!==1?'s':''}</div></div>${rowActs('mesos',m.id)}</div>${m.objective?`<div style="white-space:pre-wrap;font-size:14px">${esc(m.objective)}</div>`:''}</div>
  ${own.length?own.map(microBlock).join(''):`<div style="padding:12px 16px;color:var(--muted);font-size:14px">Sin microciclos todavía. <button class="linkbtn" type="button" data-act="add" data-col="micros" data-date="${m.start}">+ Microciclo</button></div>`}</div>`});
 const orphan=mcs.filter(c=>!ms.some(m=>inRange(c.start,m)));
 if(orphan.length)out+=`<div class="panel"><div class="meso-head"><h4>Microciclos sin mesociclo</h4><div style="font-size:13px;color:var(--muted)">Creá un mesociclo que cubra estas fechas para agruparlos.</div></div>${orphan.map(microBlock).join('')}</div>`;
 const loose=S.sessions.filter(s=>!microOf(s.date)).length;
 if(loose&&mcs.length)out+=`<p style="margin:0;font-size:13px;color:var(--muted)">${loose} sesión${loose>1?'es':''} con fecha fuera de los microciclos. Las ves en la pestaña Sesiones.</p>`;
 return out;
}

/* ---------- guía de planificación ---------- */
const GT=[['year','Año completo'],['week','Microciclo'],['sess','Sesiones guía'],['tasks','Trabajos por día'],['gym','Gimnasio'],['sprint','Sprint'],['tests','Evaluaciones'],['data','Datos a registrar']];
const gset=()=>({matchDay:0,match2:-1,trainDays:[1,2,3,4,5],time:'19:00',period:'C',...(club.guide||{})});
function saveGuide(patch){club={...club,guide:{...gset(),...patch}};setDoc(doc(db,'config','club'),{...club}).catch(()=>{});render()}
const WD=[1,2,3,4,5,6,0];
const dayOpts=(v,none)=>(none?`<option value="-1" ${v<0?'selected':''}>${none}</option>`:'')+WD.map(d=>`<option value="${d}" ${v===d?'selected':''}>${DAYS[d]}</option>`).join('');
const perOpts=v=>['PG','PE','C','T'].map(p=>`<option value="${p}" ${v===p?'selected':''}>${PERIOD_NAME[p]}</option>`).join('');
const dayChecks=(sel,attr)=>`<div class="g-days">${WD.map(d=>`<label><input type="checkbox" ${attr} value="${d}" id="${attr}_${d}" ${sel.includes(d)?'checked':''}><span>${DAYS[d].slice(0,3)}</span></label>`).join('')}</div>`;
const mdPill=e=>`<span class="pill ${e.code==='MD'?'warn':e.train?'acc':''}">${esc(mdLabel(e.code||'Libre'))}</span>`;
const gPeriodCtl=()=>`<div class="fld"><label for="gPeriod">Período</label><select class="flt" id="gPeriod">${perOpts(gset().period)}</select></div>`;
function vGuide(){
 return `<div class="bar"><div><h2>Guía</h2><p>Estructura de referencia para planificar el año. Los valores son puntos de partida: ajustalos a tu plantel y a tu criterio.</p></div><div class="tools"><button class="btn primary" type="button" data-act="gyear">Armar la temporada</button></div></div>
 <div class="subnav">${GT.map(([k,l])=>`<button class="sub ${guideTab===k?'on':''}" type="button" data-act="gtab" data-k="${k}">${l}</button>`).join('')}</div>`
 +({year:gYear,week:gWeek,sess:gSess,tasks:gTasks,gym:gGym,sprint:gSprint,tests:gTests,data:gData}[guideTab]||gYear)();
}
function gYear(){
 return `<div class="panel"><h3>Cómo usar la guía</h3><div class="body"><ol class="g-steps"><li><b>Armar la temporada:</b> ponés las fechas y el día de partido, y se crean los mesociclos y un microciclo por semana.</li><li><b>Sesiones guía:</b> en Planificación, cada microciclo tiene ese botón. Elegís si esa semana hay uno o dos partidos y qué día, y se arman las sesiones con objetivos, materiales y tareas.</li><li><b>Ajustar:</b> todo lo que se crea se puede editar, duplicar o borrar como cualquier sesión.</li></ol></div></div>
 ${PERIODS.map((p,i)=>`<div class="panel"><div class="meso-head"><div class="eyebrow">Etapa ${i+1} · ${esc(p.when)}</div><h4>${esc(p.name)}</h4></div><div class="body g-cols"><div><h5>Objetivos</h5><ul>${p.goals.map(v=>`<li>${esc(v)}</li>`).join('')}</ul></div><div class="g-kv">${[['Campo',p.field],['Gimnasio',p.gym],['Sprint',p.sprint],['Carga',p.load],['Evaluaciones',p.tests]].map(r=>`<div><span class="k">${r[0]}</span><span>${esc(r[1])}</span></div>`).join('')}</div></div></div>`).join('')}`;
}
function gWeek(){
 const g=gset(),per=g.period,hasM=per==='PE'||per==='C';
 const ctl=`<div class="g-ctl">${gPeriodCtl()}${hasM?`<div class="fld"><label for="gMatch">Día de partido</label><select class="flt" id="gMatch">${dayOpts(g.matchDay)}</select></div>`:''}${per==='C'?`<div class="fld"><label for="gMatch2">Segundo partido en la semana</label><select class="flt" id="gMatch2">${dayOpts(g.match2,'No hay')}</select></div>`:''}<div class="fld"><span class="lb">Días de entrenamiento</span>${dayChecks(g.trainDays,'data-gday')}</div></div>`;
 if(per==='T')return ctl+`<div class="panel"><h3>Transición</h3><div class="body"><div class="g-kv"><div><span class="k">Semanas 1 y 2</span><span>Descanso activo: sin entrenamientos de club. Otros deportes, caminatas, bicicleta.</span></div><div><span class="k">Desde la semana 3</span><span>Plan individual, 3 días por semana: 2 de gimnasio general y 1–2 de aeróbico suave de 20–30 min. En la última semana, progresiones de carrera.</span></div><div><span class="k">Gimnasio</span><span>Rutina “Guía · Transición (general)”, que podés mandarle a cada jugador desde Gimnasio.</span></div></div></div></div>`;
 const lay=weekLayout({period:per,matchDay:g.matchDay,match2:g.match2,trainDays:g.trainDays,gweek:2});
 const two=per==='C'&&g.match2>=0&&g.match2!==g.matchDay;
 const rows=lay.map(e=>{
  if(e.code==='MD')return `<tr><td><b>${DAYS[e.wd]}</b></td><td>${mdPill(e)}</td><td colspan="5"><b>${per==='PE'?'Amistoso':'Partido'}</b>. Datos del día: bienestar, convocados, minutos jugados y RPE después del partido.</td></tr>`;
  if(!e.train)return `<tr><td><b>${DAYS[e.wd]}</b></td><td>${e.code?mdPill(e):''}</td><td colspan="5" style="color:var(--muted)">Sin entrenamiento</td></tr>`;
  const i=INFO[e.key];
  return `<tr><td><b>${DAYS[e.wd]}</b></td><td>${mdPill(e)}</td><td><b>${esc(i.t)}</b>${e.last?' + previa del partido':''}<div class="g-sub">${esc(i.goal)}</div></td><td>${esc(i.field)}${e.last?' Como es el último entrenamiento antes del partido, se suman pelota parada y estrategia.':''}</td><td>${esc(e.key==='MD-4'&&e.gym?'Fuerza de tren inferior antes del campo, porque no hay sesión en MD-5.':i.gym)}</td><td>${esc(i.sprint)}</td><td><b>${esc(i.load)}</b><div class="g-sub">RPE ${esc(i.rpe)}</div></td></tr>`}).join('');
 return ctl+`<div class="tablewrap g-table"><table><thead><tr><th>Día</th><th>${per==='PG'?'Sesión':'MD'}</th><th>Qué se trabaja</th><th>Campo</th><th>Gimnasio</th><th>Sprint</th><th>Carga</th></tr></thead><tbody>${rows}</tbody></table></div>
 <p class="g-note">${per==='PG'?'En la pretemporada general no hay partido: la semana alterna días de carga física con días de pelota. En la semana 1, los dos primeros días son de evaluaciones.':two?'Con dos partidos por semana casi no hay días de carga: se recupera, se activa y se compite. Los que juegan poco necesitan el compensatorio de MD+1 y algo de fuerza para no perder forma.':'MD es el día de partido. MD-4 es cuatro días antes y MD+1 es el día siguiente. Si cambia el día de partido, cambia toda la semana: elegilo arriba y la tabla se reacomoda.'}</p>`;
}
const gPer=()=>{const p=gset().period;return p==='T'?'C':p};
function taskTable(tasks){return `<div class="tablewrap sh-table"><table><thead><tr><th>Parte</th><th>Tarea</th><th>Organización</th><th>Espacio</th><th class="r">Min</th></tr></thead><tbody>${tasks.map(t=>`<tr><td>${esc(t.part)}</td><td><div class="t-name">${esc(t.name)}</div>${t.desc?`<div class="t-desc">${esc(t.desc)}</div>`:''}</td><td>${esc(t.org||'')}</td><td>${esc(t.space||'')}</td><td class="r num">${esc(t.time)}</td></tr>`).join('')}</tbody></table></div>`}
function gSess(){
 const per=gPer();const keys=TEMPLATE_KEYS.filter(k=>per==='PG'?!k.startsWith('MD'):k.startsWith('MD'));
 return `<div class="g-ctl">${gPeriodCtl()}<p class="g-note" style="flex:1;min-width:200px">Sesiones modelo para cada día. Abrí una para ver las tareas, o creá una sesión nueva a partir de ella.</p></div>
 <div class="panel">${keys.map(k=>{const s=sessionFor({key:k},per);return `<details class="g-det"><summary><span class="pill acc">${esc(mdLabel(k))}</span><span>${esc(INFO[k].t)}</span><span class="num g-sub" style="margin-left:auto">${s.duration} min · RPE ${esc(INFO[k].rpe)}</span></summary><div class="in"><div class="g-kv"><div><span class="k">Objetivos</span><span>${esc(INFO[k].obj.join(' · '))}</span></div><div><span class="k">Materiales</span><span>${esc(INFO[k].mat.join(', '))}</span></div><div><span class="k">Espacio</span><span>${esc(INFO[k].space)}</span></div></div>${taskTable(s.tasks)}<div><button class="btn primary" type="button" data-act="gtpl" data-k="${k}">Crear una sesión con esta guía</button></div></div></details>`}).join('')}</div>`;
}
function gTasks(){
 return `<p class="g-note">Opciones de trabajos técnicos y con pelota para cada día, con cantidad de jugadores, espacio, tiempos y pausas. Espacio más chico y menos jugadores: más aceleraciones y frenos. Espacio más grande y más jugadores: más carrera a alta velocidad.</p>`
 +['MD+1','MD-5','MD-4','MD-3','MD-2','MD-1'].map(k=>`<div class="panel"><h3>${k} · ${esc(INFO[k].t)} <small>${esc(INFO[k].load)}</small></h3><div class="tablewrap g-table" style="border:0;border-radius:0 0 12px 12px"><table><thead><tr><th>Trabajo</th><th>Jugadores</th><th>Espacio</th><th>Tiempo</th><th>Pausa</th><th>Claves</th></tr></thead><tbody>${OPT[k].map(p=>`<tr><td><b>${esc(p.name)}</b></td><td>${esc(p.players)}</td><td class="num">${esc(p.space)}</td><td class="num">${esc(p.work)}</td><td class="num">${esc(p.rest)}</td><td>${esc(p.notes)}</td></tr>`).join('')}</tbody></table></div></div>`).join('');
}
function gGym(){
 return `<p class="g-note">El gimnasio acompaña cada etapa. Cada rutina se puede agregar a tus rutinas de Gimnasio para editarla, asignarla y mandarla a los jugadores.</p>`
 +GYM.map((G,pi)=>`<div class="panel"><div class="meso-head"><h4>${esc(PERIOD_NAME[G.period])}</h4><div class="g-kv"><div><span class="k">Frecuencia</span><span>${esc(G.freq)}</span></div><div><span class="k">Cuándo</span><span>${esc(G.when)}</span></div><div><span class="k">Objetivo</span><span>${esc(G.goal)}</span></div></div></div>
 ${G.routines.map((r,ri)=>{const has=S.routines.some(q=>q.name===r.name);return `<details class="g-det"><summary><span>${esc(r.name.replace('Guía · ',''))}</span><span class="num g-sub" style="margin-left:auto">${r.duration} min · ${r.exercises.length} ejercicios</span></summary><div class="in"><div style="font-size:14px">${esc(r.indications)}</div><div class="tablewrap sh-table"><table><thead><tr><th>Ejercicio</th><th class="r">Series</th><th class="r">Reps</th><th>Carga</th><th>Pausa</th></tr></thead><tbody>${r.exercises.map(v=>`<tr><td><div class="t-name">${esc(v.name)}</div>${v.notes?`<div class="t-mat">${esc(v.notes)}</div>`:''}</td><td class="r num">${esc(v.sets)}</td><td class="r num">${esc(v.reps)}</td><td>${esc(v.load)}</td><td>${esc(v.rest)}</td></tr>`).join('')}</tbody></table></div><div>${has?`<span class="pill ok">Ya está en tus rutinas de Gimnasio</span>`:`<button class="btn primary" type="button" data-act="ggym" data-p="${pi}" data-i="${ri}">Agregar a mis rutinas de Gimnasio</button>`}</div></div></details>`}).join('')}</div>`).join('');
}
function gSprint(){
 return `<div class="banner" style="background:var(--accent-soft);color:var(--ink)">${esc(SPRINT_RULE)}</div>
 <div class="tablewrap g-table"><table><thead><tr><th>Sesión</th><th>Cuándo</th><th>Trabajo</th><th>Pausa</th><th>Total</th><th>Claves</th></tr></thead><tbody>${SPRINTS.map(s=>`<tr><td><b>${esc(s.name)}</b></td><td>${esc(s.when)}</td><td>${esc(s.work)}</td><td class="num">${esc(s.rest)}</td><td class="num">${esc(s.total)}</td><td>${esc(s.notes)}</td></tr>`).join('')}</tbody></table></div>
 <p class="g-note">Las sesiones guía ya incluyen el bloque de sprint que corresponde a cada día: aceleración en MD-4, velocidad máxima en MD-2 y compensatorio en MD+1.</p>`;
}
function gTests(){
 const cal=[['Semana 1 de la pretemporada','Batería completa'],['Última semana de la pretemporada','Saltos, velocidad y resistencia, para comparar'],['Todas las semanas','CMJ y aductores (MD-5 o MD-4)'],['Cada 6–8 semanas','Sprint 10 y 30 m, saltos y composición corporal'],['Mitad de temporada o receso','Fuerza y resistencia'],['Última semana de competencia','Evaluación final']];
 return `<div class="panel"><h3>Cuándo evaluar</h3><div class="body"><div class="g-kv">${cal.map(c=>`<div><span class="k" style="grid-column:auto">${c[0]}</span><span>${c[1]}</span></div>`).join('')}</div><p class="g-note" style="margin-top:10px">Los resultados se cargan en la pestaña Tests: estas pruebas ya aparecen en la lista para elegir.</p></div></div>`
 +TESTS.map(t=>`<div class="panel"><h3>${esc(t.g)} <small>${esc(t.when)}</small></h3><div class="tablewrap g-table" style="border:0;border-radius:0 0 12px 12px"><table><thead><tr><th>Prueba</th><th>Unidad</th><th>Para qué sirve</th></tr></thead><tbody>${t.items.map(i=>`<tr><td><b>${esc(i[0])}</b></td><td class="num">${esc(i[1])}</td><td>${esc(i[2])}</td></tr>`).join('')}</tbody></table></div></div>`).join('');
}
function gData(){
 return `<p class="g-note">Qué conviene registrar y en qué parte de la app va cada dato. Mejor pocos datos tomados siempre que muchos tomados a veces.</p>`
 +DATA.map(d=>`<div class="panel"><h3>${esc(d.g)}</h3><div class="body"><div class="mini">${d.items.map(i=>`<div><span style="flex:1;min-width:180px">${esc(i[0])}</span>${i[1]?`<span class="pill acc">${esc(i[1])}</span>`:`<span class="pill">Fuera de la app</span>`}</div>`).join('')}</div></div></div>`).join('')
 +`<p class="g-note">Por ahora, los minutos jugados, los goles y los cambios se anotan en las notas del partido.</p>`;
}
/* armar la temporada completa */
function openGuideYear(){
 const g=gset();let st=today();do{st=addDays(st,1)}while(parse(st).getDay()!==1);
 editing=null;$('#mTitle').textContent='Armar la temporada';
 $('#mBody').innerHTML=`<form class="form" id="gyFrm" novalidate>
 <div class="fld full"><span style="font-size:14px">Crea los mesociclos y un microciclo por semana para todo el año. Las semanas que ya tengan un microciclo no se tocan.</span></div>
 <div class="fld"><label for="gy_start">Inicio de la pretemporada</label><input id="gy_start" type="date" value="${st}"></div>
 <div class="fld"><label for="gy_pre">Semanas de pretemporada</label><input id="gy_pre" type="number" inputmode="numeric" min="2" max="12" value="6"></div>
 <div class="fld"><label for="gy_end">Último partido de la temporada</label><input id="gy_end" type="date" value="${addDays(st,7*44)}"></div>
 <div class="fld"><label for="gy_trans">Semanas de transición</label><input id="gy_trans" type="number" inputmode="numeric" min="0" max="8" value="4"></div>
 <div class="fld"><label for="gy_match">Día de partido</label><select id="gy_match">${dayOpts(g.matchDay)}</select></div>
 <div class="fld"><label for="gy_match2">Segundo partido en la semana</label><select id="gy_match2">${dayOpts(g.match2,'No hay')}</select></div>
 <div class="fld"><span class="lb">Días de entrenamiento</span>${dayChecks(g.trainDays,'data-gyday')}</div>
 <div class="fld"><label for="gy_time">Hora de entrenamiento</label><input id="gy_time" type="time" value="${esc(g.time)}"></div>
 <div class="fld full" id="gySum"></div>
 <div class="formacts"><button type="button" class="btn" data-act="close">Cancelar</button><button type="submit" class="btn primary">Crear temporada</button></div></form>`;
 showModal();gySum();
}
function gyRead(){const n=(id,lo,hi,d)=>{const v=parseInt($(id).value,10);return isNaN(v)?d:Math.min(hi,Math.max(lo,v))};
 return {start:$('#gy_start').value,preWeeks:n('#gy_pre',2,12,6),seasonEnd:$('#gy_end').value,transWeeks:n('#gy_trans',0,8,4),matchDay:+$('#gy_match').value,match2:+$('#gy_match2').value,trainDays:[...document.querySelectorAll('#gyFrm [data-gyday]:checked')].map(c=>+c.value),time:$('#gy_time').value||'19:00'}}
function gySum(){
 const el=$('#gySum');if(!el)return null;const p=gyRead();
 if(!p.start||!p.seasonEnd){el.innerHTML=`<p class="err" style="margin:0">Completá las dos fechas.</p>`;return null}
 const pl=planYear(p);
 if(!pl.compWeeks){el.innerHTML=`<p class="err" style="margin:0">El último partido tiene que ser posterior al final de la pretemporada (${fdy(pl.preEnd)}).</p>`;return null}
 const comp=pl.micros.filter(m=>m.gperiod==='C');
 el.innerHTML=`<span class="lb">Así queda</span><div class="mini"><div><span>Pretemporada</span><span class="num">${p.preWeeks} semanas · ${fdy(p.start)} al ${fdy(pl.preEnd)}</span></div><div><span>Primer partido oficial</span><span class="num">${DOW[parse(pl.firstMatch).getDay()]} ${fdy(pl.firstMatch)}</span></div><div><span>Competencia</span><span class="num">${pl.compWeeks} semanas · hasta el ${fdy(comp[comp.length-1].end)}</span></div><div><span>Transición</span><span class="num">${p.transWeeks} semanas</span></div><div><span>Se crean</span><span class="num">${pl.mesos.length} mesociclos y ${pl.micros.length} microciclos</span></div></div>`;
 return pl;
}
function createYear(e){
 e.preventDefault();const p=gyRead();if(!p.trainDays.length){toast('Elegí al menos un día de entrenamiento.');return}
 const pl=gySum();if(!pl){toast('Revisá las fechas.');return}
 let nm=0,nc=0,skip=0;const fail=err=>{if(err&&err.code==='permission-denied')toast('Falta actualizar las reglas de Firebase para guardar la planificación.')};
 pl.mesos.forEach(m=>{if(S.mesos.some(v=>v.start===m.start&&v.end===m.end))return;setDoc(doc(collection(db,'mesos')),{...m,notes:''}).catch(fail);nm++});
 pl.micros.forEach(c=>{if(S.micros.some(v=>v.start<=c.end&&v.end>=c.start)){skip++;return}setDoc(doc(collection(db,'micros')),{...c,notes:''}).catch(fail);nc++});
 closeModal();tab='plan';saveGuide({matchDay:p.matchDay,match2:p.match2,trainDays:p.trainDays,time:p.time});
 toast(`Temporada armada: ${nm} mesociclos y ${nc} microciclos.`+(skip?` ${skip} semanas ya tenían microciclo y no se tocaron.`:''));window.scrollTo({top:0});
}
/* sesiones guía de un microciclo */
let GM=null;
function periodOfMicro(c){if(c.gperiod)return c.gperiod;const m=S.mesos.find(v=>inRange(c.start,v));const map={Pretemporada:'PG',Precompetitivo:'PE',Competitivo:'C','Transición':'T'};return (m&&map[m.phase])||'C'}
function openGuideMicro(id){
 const c=S.micros.find(v=>v.id===id);if(!c)return;const g=gset();const per=periodOfMicro(c);
 GM={id,rows:[],per};editing=null;$('#mTitle').textContent='Sesiones guía · MC '+microNum(c);
 $('#mBody').innerHTML=`<form class="form" id="gmFrm" novalidate>
 <div class="fld full"><span style="font-size:14px">Semana del ${fd(c.start)} al ${fd(c.end)}. Elegí cómo viene la semana y se arman las sesiones con objetivos, materiales y tareas. Después las podés editar.</span></div>
 <div class="fld"><label for="gmPeriod">Período</label><select id="gmPeriod">${perOpts(per)}</select></div>
 <div class="fld"><label for="gmTime">Hora</label><input id="gmTime" type="time" value="${esc(g.time)}"></div>
 <div class="fld"><label for="gmMatch">Día de partido</label><select id="gmMatch">${dayOpts(g.matchDay,'Sin partido esta semana')}</select></div>
 <div class="fld"><label for="gmMatch2">Segundo partido</label><select id="gmMatch2">${dayOpts(per==='C'?g.match2:-1,'No hay')}</select></div>
 <div class="fld full" id="gmList"></div>
 <div class="formacts"><button type="button" class="btn" data-act="close">Cancelar</button><button type="submit" class="btn primary" id="gmGo">Crear sesiones</button></div></form>`;
 showModal();gmRender();
}
function gmRender(){
 const c=S.micros.find(v=>v.id===GM.id);const el=$('#gmList');if(!c||!el)return;
 const per=$('#gmPeriod').value,md=+$('#gmMatch').value,m2=+$('#gmMatch2').value;
 $('#gmMatch').disabled=per==='PG'||per==='T';$('#gmMatch2').disabled=per!=='C'||md<0;
 GM.rows=[];$('#gmGo').disabled=true;
 if(per==='T'){el.innerHTML=`<p class="g-note">En la transición no hay sesiones de club. Mandale a cada jugador la rutina “Guía · Transición (general)” desde Gimnasio.</p>`;return}
 const eff=md<0?'PG':per;GM.per=per;
 const lay=weekLayout({period:eff,matchDay:md,match2:m2,trainDays:gset().trainDays,gweek:per==='PG'&&c.gperiod==='PG'?c.gweek:2});
 for(let d=c.start,i=0;d<=c.end&&i<14;d=addDays(d,1),i++){const e=lay.find(v=>v.wd===parse(d).getDay());if(e&&e.key)GM.rows.push({date:d,e,has:S.sessions.some(s=>s.date===d)})}
 if(!GM.rows.length){el.innerHTML=`<p class="g-note">No hay días de entrenamiento en esta semana. Revisá los días de entrenamiento en Guía → Microciclo.</p>`;return}
 $('#gmGo').disabled=false;
 el.innerHTML=`<span class="lb">Sesiones que se crean</span><div class="list">${GM.rows.map((r,i)=>`<label class="gm-row" for="gm_${i}"><input type="checkbox" id="gm_${i}" data-gm="${i}" ${r.has?'':'checked'}><span class="num" style="min-width:74px">${DOW[parse(r.date).getDay()]} ${fd(r.date)}</span>${mdPill(r.e)}<span style="flex:1;min-width:140px">${esc(INFO[r.e.key].t)}${r.e.last?' + previa del partido':''}${r.has?`<span class="g-sub">Ya hay una sesión ese día</span>`:''}</span></label>`).join('')}</div>${per==='PG'&&md>=0?'':md<0&&per!=='PG'?`<p class="g-note">Sin partido: se arma como una semana de carga.</p>`:''}`;
}
function createGuideSessions(e){
 e.preventDefault();if(!GM)return;const now=new Date().toISOString();const time=$('#gmTime').value||'';let n=0;
 document.querySelectorAll('#gmFrm [data-gm]:checked').forEach(c=>{const r=GM.rows[+c.dataset.gm];if(!r)return;
  setDoc(doc(collection(db,'sessions')),{date:r.date,time,...sessionFor(r.e,GM.per==='T'?'C':GM.per),routine:'',notes:'',by:me.uid,at:now}).catch(err=>toast(errMsg(err)));n++});
 if(!n){toast('Marcá al menos una sesión.');return}
 closeModal();toast(n===1?'Se creó 1 sesión.':`Se crearon ${n} sesiones.`);
}

/* ---------- asistencia ---------- */
function attSessions(){const t=today();return S.sessions.filter(s=>{if(!hasAtt(s))return false;if(attRange==='30')return inLastDays(s.date,30);if(attRange==='mes')return s.date&&s.date.slice(0,7)===t.slice(0,7);if(attRange==='micro'){const m=microOf(t);return m?inRange(s.date,m):false}return true})}
function vAtt(){
 const opt=(v,l)=>`<option value="${v}" ${attRange===v?'selected':''}>${l}</option>`;
 const h=`<div class="bar"><div><h2>Asistencia</h2><p>Se carga desde cada sesión con el botón Asistencia. El % no cuenta los días de lesión.</p></div><div class="tools"><select class="flt" id="attRange" aria-label="Período">${opt('30','Últimos 30 días')}${opt('mes','Este mes')}${opt('micro','Microciclo actual')}${opt('todo','Toda la temporada')}</select></div></div>`;
 if(!S.players.length)return h+empty('Sin jugadores','Cargá el plantel para empezar a tomar asistencia.','players','Agregar jugador');
 const ss=attSessions();
 if(!ss.length)return h+`<div class="empty"><strong>Sin asistencias en este período</strong><p>Abrí una sesión y tocá <b>Asistencia</b> para marcar presentes, tardes, justificadas e injustificadas.</p></div>`;
 const rows=sortedPlayers().map(p=>({p,c:attStats(p.id,ss)})).sort((a,b)=>(a.c.pct??101)-(b.c.pct??101));
 const cell=v=>v?`<td class="r num">${v}</td>`:`<td class="r num" style="color:var(--muted)">–</td>`;
 return h+`<div class="att-sum">${ATT.map(a=>`<span class="pill ${a[2]}">${a[1]}</span>`).join('')}</div>
 <div class="tablewrap"><table><thead><tr><th>Jugador</th><th class="r">Ses.</th><th class="r">Pres.</th><th class="r">Tarde</th><th class="r">Enf.</th><th class="r">Trab.</th><th class="r">Est.</th><th class="r">Otra</th><th class="r">Injust.</th><th class="r">Lesión</th><th class="r">%</th></tr></thead><tbody>
 ${rows.map(({p,c})=>`<tr class="click" data-act="player" data-id="${p.id}"><td><span class="num" style="color:var(--muted)">${isNum(p.number)?+p.number:''}</span> ${esc(p.name)}</td>${cell(c.n)}${cell(c.P)}${cell(c.T)}${cell(c.JE)}${cell(c.JT)}${cell(c.JS)}${cell(c.JO)}${c.I?`<td class="r num" style="color:var(--warn);font-weight:600">${c.I}</td>`:cell(0)}${cell(c.L)}<td class="r"><span class="pill ${c.pct==null?'':c.pct>=85?'ok':c.pct>=70?'amber':'warn'}">${c.pct==null?'–':c.pct+'%'}</span></td></tr>`).join('')}
 </tbody></table></div><p style="margin:0;font-size:13px;color:var(--muted)">${ss.length} sesión${ss.length>1?'es':''} con asistencia en el período. Tocá un jugador para ver su ficha.</p>`;
}
function openAtt(sid){
 const s=S.sessions.find(x=>x.id===sid);if(!s)return;
 if(!S.players.length){toast('Primero cargá el plantel.');return}
 const m=attMap(s)||{};const NUM=sessNums();
 editing={key:'att',col:'sessions',id:sid};
 $('#mTitle').textContent='Asistencia · Sesión N° '+NUM[sid];
 $('#mBody').innerHTML=`<form class="form" id="attFrm" novalidate><div class="fld full" style="gap:8px"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:center"><span style="font-size:14px">${esc(s.type||'Sesión')} · ${DOW[parse(s.date).getDay()]} ${fdy(s.date)}</span><span class="tools" style="gap:4px"><button type="button" class="btn sm" data-act="attall">Todos presentes</button><button type="button" class="btn ghost sm" data-act="attclear">Limpiar</button></span></div>
 <div class="att-list">${sortedPlayers().map(p=>{let v=m[p.id]||'';if(!v&&!hasAtt(s)&&availability(p.id)[0]!=='Disponible')v='L';
  return `<div class="att-row"><span class="n">${isNum(p.number)?+p.number:''}</span><label for="att_${p.id}" style="min-width:0">${esc(p.name)}${availability(p.id)[0]!=='Disponible'?` <span class="pill ${availability(p.id)[1]}" style="font-size:11px">${availability(p.id)[0]}</span>`:''}</label><select id="att_${p.id}" data-att="${p.id}" class="s-${v}"><option value="">Sin cargar</option>${ATT.map(a=>`<option value="${a[0]}" ${a[0]===v?'selected':''}>${a[1]}</option>`).join('')}</select></div>`}).join('')}</div>
 <div id="attCount" style="font-size:13px;color:var(--muted)"></div></div>
 <div class="fld"><label for="att_rpe">RPE promedio del grupo (1–10)</label><input id="att_rpe" type="number" inputmode="decimal" min="1" max="10" step="0.5" value="${esc(s.rpe??'')}"><span class="hint">Carga = RPE × ${sessDuration(s)||'minutos'} min.${(()=>{const pr=rpesOf(s.date).filter(c=>c.activity==='Equipo'&&isNum(c.rpe));if(!pr.length)return'';const av=Math.round(pr.reduce((a,c)=>a+ +c.rpe,0)/pr.length*2)/2;return ` Promedio que cargaron los jugadores: <b>${av}</b> (${pr.length} respuesta${pr.length>1?'s':''}). <button type="button" class="linkbtn" data-act="userpe" data-v="${av}">Usar</button>`})()}</span></div>
 <div class="fld full"><label for="att_notes">Observaciones de la sesión</label><textarea id="att_notes">${esc(s.notes||'')}</textarea></div>
 <div class="formacts"><button type="button" class="btn" data-act="close">Cancelar</button><button type="submit" class="btn primary">Guardar asistencia</button></div></form>`;
 showModal();attCount();
}
function attCount(){const sel=[...document.querySelectorAll('[data-att]')];const c={};sel.forEach(x=>{c[x.value]=(c[x.value]||0)+1});const el=$('#attCount');if(el)el.textContent=`Presentes ${(c.P||0)+(c.T||0)} · Justificadas ${(c.JE||0)+(c.JT||0)+(c.JS||0)+(c.JO||0)} · Injustificadas ${c.I||0} · Lesionados ${c.L||0} · Sin cargar ${c['']||0}`}
function saveAtt(e){
 e.preventDefault();const sid=editing&&editing.id;const s=S.sessions.find(x=>x.id===sid);if(!s)return;
 const att={};document.querySelectorAll('[data-att]').forEach(x=>{if(x.value)att[x.dataset.att]=x.value});
 let rpe=$('#att_rpe').value.trim();if(rpe!==''){rpe=Number(rpe.replace(',','.'));if(isNaN(rpe)||rpe<1||rpe>10){toast('El RPE va de 1 a 10.');return}}
 const body={...s,att,rpe,notes:$('#att_notes').value.trim(),editBy:me.uid,editAt:new Date().toISOString()};delete body.id;delete body.attendance;
 setDoc(doc(db,'sessions',sid),body).catch(err=>toast(errMsg(err)));closeModal();toast('Asistencia guardada');
}

/* ---------- gimnasio ---------- */
function vGym(){
 const h=`<div class="bar"><div><h2>Gimnasio</h2><p>Rutinas para enviar a los jugadores y registro de lo que hace cada uno.</p></div><div class="tools"><button class="btn" type="button" data-act="add" data-col="gymlogs">+ Registro</button>${addBtn('gymroutines','Rutina de gimnasio')}</div></div>`;
 const doers=sortedPlayers().filter(p=>p.gym==='Sí');const wk=gymAll().filter(g=>inLastDays(g.date,7));
 let out=h+`<div class="stats"><div class="stat"><div class="k">Hacen gimnasio</div><div class="v">${doers.length}</div><div class="s">de ${S.players.length} jugadores</div></div><div class="stat"><div class="k">Registros 7 días</div><div class="v">${wk.length}</div><div class="s">${new Set(wk.map(g=>g.player)).size} jugador${new Set(wk.map(g=>g.player)).size===1?'':'es'}</div></div><div class="stat"><div class="k">Rutinas</div><div class="v">${S.routines.filter(isGym).length}</div><div class="s">de gimnasio</div></div><div class="stat"><div class="k">Minutos 7 días</div><div class="v">${wk.reduce((a,g)=>a+(isNum(g.duration)?+g.duration:0),0)}</div><div class="s">sumando todos</div></div></div>`;
 const rs=S.routines.filter(isGym).sort((a,b)=>(a.name||'').localeCompare(b.name||''));
 out+=rs.length?`<div class="grid-cards">${rs.map(r=>{const ex=(r.exercises||[]).filter(x=>x&&x.name);const asg=(r.assigned||[]).filter(pl);
  return `<article class="rcard"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap">${r.category?`<span class="pill acc">${esc(r.category)}</span>`:'<span></span>'}${isNum(r.duration)?`<span class="mono" style="color:var(--muted)">${+r.duration} min</span>`:''}</div>
  <h4>${esc(r.name)}</h4>${r.target?`<div style="font-size:13px;color:var(--muted)">Para: ${esc(r.target)}</div>`:''}
  <ol>${ex.map(x=>`<li>${esc(x.name)} <span class="mono" style="color:var(--muted);font-size:12px">${esc([x.sets&&x.reps?x.sets+'×'+x.reps:(x.sets||x.reps),x.load].filter(Boolean).join(' · '))}</span></li>`).join('')}</ol>
  ${asg.length?`<div style="font-size:12px;color:var(--muted)">Asignada a ${asg.length} jugador${asg.length>1?'es':''}</div>`:''}
  <div class="tools"><button class="btn sm primary" type="button" data-act="share" data-id="${r.id}">Enviar</button><button class="btn sm" type="button" data-act="rsheet" data-id="${r.id}">Ver / PDF</button></div>
  <div class="foot"><span>${esc(pname(r.editBy||r.by))}</span>${rowActs('gymroutines',r.id)}</div></article>`}).join('')}</div>`
  :`<div class="empty"><strong>Sin rutinas de gimnasio</strong><p>Armá la rutina con ejercicios, series, repeticiones y cargas. Después la mandás por WhatsApp: al jugador le llega un link para verla en el teléfono.</p>${addBtn('gymroutines','Rutina de gimnasio')}</div>`;
 if(doers.length)out+=`<div class="panel"><h3>Quiénes hacen gimnasio</h3><div class="body"><div class="mini">${doers.map(p=>{const last=gymAll().filter(g=>g.player===p.id).sort(byDateDesc)[0];return `<div><span><b>${esc(p.name)}</b>${p.gymPlace?' · '+esc(p.gymPlace):''}</span><span style="color:var(--muted);font-size:13px">${isNum(p.gymDays)?p.gymDays+' días/sem · ':''}${last?'último '+fd(last.date):'sin registros'}</span></div>`}).join('')}</div></div></div>`;
 const logs=gymAll().filter(g=>!gymFilter||g.player===gymFilter).sort(byDateDesc);
 out+=`<div class="bar"><div><h2 style="font-size:22px">Registro</h2></div><div class="tools"><select class="flt" id="gymFilter" aria-label="Filtrar jugador"><option value="">Todos los jugadores</option>${sortedPlayers().map(p=>`<option value="${p.id}" ${gymFilter===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select></div></div>`;
 out+=logs.length?`<div class="list">${logs.map(g=>{const r=S.routines.find(x=>x.id===g.routine);return `<div class="row r-std">${dateCell(g.date)}<div class="main"><div class="t">${esc(plName(g.player))}</div><div class="m">${r?`<span>${esc(r.name)}</span>`:''}${g.place?`<span>${esc(g.place)}</span>`:''}${g.self?'<span>Cargado por el jugador</span>':byline(g)}</div></div><div class="side"><div class="figs">${isNum(g.duration)?`<div class="fig"><div class="n">${+g.duration}</div><div class="l">min</div></div>`:''}${isNum(g.rpe)?`<div class="fig"><div class="n">${+g.rpe}</div><div class="l">RPE</div></div>`:''}</div>${g.self?`<div class="acts"><button class="btn ghost sm danger" type="button" data-act="del" data-col="checkins" data-id="${g.id}">Borrar</button></div>`:rowActs('gymlogs',g.id)}</div>${g.done?`<div class="notes">${esc(g.done)}</div>`:''}</div>`}).join('')}</div>`
  :`<div class="empty"><strong>Sin registros</strong><p>Anotá cada vez que un jugador hace gimnasio: qué rutina, cuánto tiempo, el RPE y qué hizo.</p><button class="btn primary" type="button" data-act="add" data-col="gymlogs">+ Registro</button></div>`;
 return out;
}
function publicRoutine(r){
 return {type:'routine',club:club.name||'',name:r.name||'',category:r.category||'',duration:r.duration??'',target:r.target||'',indications:r.indications||'',exercises:(r.exercises||[]).filter(x=>x&&x.name).map(x=>({name:x.name||'',sets:x.sets||'',reps:x.reps||'',load:x.load||'',rest:x.rest||'',notes:x.notes||''})),updatedAt:new Date().toISOString()};
}
function shareRoutine(id){
 const r=S.routines.find(x=>x.id===id);if(!r)return;
 let sid=r.shareId;
 if(!sid){sid=randId(20);const body={...r,shareId:sid};delete body.id;setDoc(doc(db,'routines',id),body).catch(()=>{})}
 setDoc(doc(db,'public',sid),publicRoutine(r)).catch(err=>toast(err&&err.code==='permission-denied'?'Falta actualizar las reglas de Firebase para enviar rutinas.':errMsg(err)));
 const url=location.origin+location.pathname+'#r-'+sid;
 const text=`${club.name?club.name+' · ':''}Rutina de gimnasio: ${r.name}`;
 editing=null;$('#mTitle').textContent='Enviar rutina';
 $('#mBody').innerHTML=`<p style="margin:0">Al jugador le llega un link para ver <b>${esc(r.name)}</b> en el teléfono, sin cuenta. No ve ningún otro dato del equipo. Si después editás la rutina, el link muestra la versión nueva.</p>
 <div class="fld"><label for="shareUrl">Link de la rutina</label><input id="shareUrl" value="${esc(url)}" readonly></div>
 <div class="formacts" style="justify-content:flex-start"><a class="btn primary" href="https://wa.me/?text=${encodeURIComponent(text+'\n'+url)}" target="_blank" rel="noopener">Enviar por WhatsApp</a>${navigator.share?`<button class="btn" type="button" data-act="nshare" data-url="${esc(url)}" data-text="${esc(text)}">Más opciones</button>`:''}<button class="btn" type="button" data-act="copylink">Copiar link</button><a class="btn ghost" href="${esc(url)}" target="_blank" rel="noopener">Ver como jugador</a></div>`;
 showModal();
}

/* ---------- hojas (sesión y rutina) ---------- */
function openDoc(html,bar){$('#docBar').innerHTML=bar;$('#docPage').innerHTML=html;$('#doc').hidden=false;$('#doc').scrollTop=0;document.body.style.overflow='hidden'}
function closeDoc(){if($('#doc').hidden)return;$('#doc').hidden=true;if($('#modal').hidden)document.body.style.overflow=''}
const sheetHead=(title,no)=>`<div class="sh-head"><img src="logo.png" alt="Escudo del club"><div style="min-width:0"><div class="sh-club">${esc(club.name||'Cuerpo técnico')}</div><div class="eyebrow">${title}</div></div>${no!=null?`<div class="sh-no"><div class="k">Sesión N°</div><div class="v">${no}</div></div>`:''}</div>`;
function sessionSheet(s){
 const NUM=sessNums();const mc=microOf(s.date), ms=mesoOf(s.date);const tasks=sessTasks(s);const dur=sessDuration(s);
 const resp=memberName(s.by);
 const meta=[['Fecha',longDate(s.date)],['Hora',s.time?s.time+' h':''],['Tipo',s.type],['Duración',dur?dur+' min':''],['Espacio',s.space],['Microciclo',mc?`MC ${microNum(mc)}${mc.type?' · '+mc.type:''}`:''],['Mesociclo',ms?ms.name:''],['Responsable',resp]].filter(x=>x[1]);
 let lastPart=null;const total=tasks.reduce((a,t)=>a+(isNum(t.time)?+t.time:0),0);
 return sheetHead('Hoja de sesión',NUM[s.id])
 +`<div class="sh-meta">${meta.map(m=>`<div><div class="k">${m[0]}</div><div class="v">${esc(m[1])}</div></div>`).join('')}</div>`
 +(s.focus?`<div class="sh-sec"><h3>Objetivo general</h3><div style="font-size:16px;font-weight:600">${esc(s.focus)}</div></div>`:'')
 +`<div class="sh-cols"><div class="sh-sec"><h3>Objetivos específicos</h3>${lines(s.objectives).length?`<ul>${lines(s.objectives).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'<div style="color:var(--muted)">—</div>'}</div><div class="sh-sec"><h3>Materiales</h3>${lines(s.materials).length?`<ul>${lines(s.materials).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'<div style="color:var(--muted)">—</div>'}</div></div>`
 +`<div class="sh-sec"><h3>Tareas</h3>${tasks.length?`<div class="tablewrap sh-table"><table><thead><tr><th>#</th><th>Tarea y consignas</th><th>Organización</th><th>Espacio</th><th class="r">Min</th></tr></thead><tbody>${tasks.map((t,i)=>{const ph=t.part&&t.part!==lastPart?`<tr class="sh-part"><td colspan="5">${esc(t.part)}</td></tr>`:'';lastPart=t.part;
  return ph+`<tr><td class="num">${i+1}</td><td><div class="t-name">${esc(t.name)}</div>${t.desc?`<div class="t-desc">${esc(t.desc)}</div>`:''}${t.mat?`<div class="t-mat">Materiales: ${esc(t.mat)}</div>`:''}</td><td>${esc(t.org||'')}</td><td>${esc(t.space||'')}</td><td class="r num">${isNum(t.time)?+t.time:''}</td></tr>`}).join('')}<tr class="sh-total"><td colspan="4">Tiempo total de tareas</td><td class="r num">${total||''}</td></tr></tbody></table></div>`:'<div style="color:var(--muted)">Todavía no se cargaron tareas. Tocá Editar para agregarlas.</div>'}</div>`
 +(s.notes?`<div class="sh-sec"><h3>Observaciones</h3><div style="white-space:pre-wrap">${esc(s.notes)}</div></div>`:'');
}
function openSessionDoc(sid){
 const s=S.sessions.find(x=>x.id===sid);if(!s)return;
 openDoc(sessionSheet(s),`<div class="wrap"><button class="btn ghost" type="button" data-act="docclose">← Volver</button><div class="tools"><button class="btn primary" type="button" data-act="big" data-id="${sid}">Pantalla grande</button><button class="btn" type="button" data-act="print">Descargar PDF</button><button class="btn" type="button" data-act="att" data-id="${sid}">Asistencia</button><button class="btn" type="button" data-act="dup" data-id="${sid}">Duplicar</button><button class="btn" type="button" data-act="edit" data-col="sessions" data-id="${sid}">Editar</button><button class="btn ghost sm danger" type="button" data-act="del" data-col="sessions" data-id="${sid}">Borrar</button></div></div>`);
}
function routineSheet(r){
 const ex=(r.exercises||[]).filter(x=>x&&x.name);
 const meta=[['Objetivo',r.category],['Duración',isNum(r.duration)&&r.duration!==''?r.duration+' min':''],['Para',r.target]].filter(x=>x[1]);
 return `<div class="sh-head"><img src="logo.png" alt="Escudo del club"><div style="min-width:0"><div class="sh-club">${esc(r.club||club.name||'Cuerpo técnico')}</div><div class="eyebrow">Rutina de gimnasio</div></div></div>
 <h1 class="sh-title">${esc(r.name)}</h1>
 ${meta.length?`<div class="sh-meta">${meta.map(m=>`<div><div class="k">${m[0]}</div><div class="v">${esc(m[1])}</div></div>`).join('')}</div>`:''}
 ${r.indications?`<div class="sh-sec"><h3>Indicaciones</h3><div style="white-space:pre-wrap">${esc(r.indications)}</div></div>`:''}
 <div class="sh-sec"><h3>Ejercicios</h3>${ex.length?`<div class="tablewrap sh-table ex-table"><table><thead><tr><th>#</th><th>Ejercicio</th><th class="r">Series</th><th class="r">Reps</th><th>Carga</th><th>Pausa</th></tr></thead><tbody>${ex.map((x,i)=>`<tr><td class="num">${i+1}</td><td><div class="t-name">${esc(x.name)}</div>${x.notes?`<div class="t-mat">${esc(x.notes)}</div>`:''}</td><td class="r num">${esc(x.sets)}</td><td class="r num">${esc(x.reps)}</td><td>${esc(x.load)}</td><td>${esc(x.rest)}</td></tr>`).join('')}</tbody></table></div>
 <div class="ex-cards">${ex.map((x,i)=>`<div class="ex-card"><div class="nm"><span class="num" style="color:var(--muted)">${i+1}.</span> ${esc(x.name)}</div><div class="rx">${esc([x.sets&&x.reps?x.sets+' × '+x.reps:(x.sets?x.sets+' series':x.reps),x.load,x.rest?'pausa '+x.rest:''].filter(Boolean).join(' · '))}</div>${x.notes?`<div style="font-size:14px;color:var(--muted)">${esc(x.notes)}</div>`:''}</div>`).join('')}</div>`:'<div style="color:var(--muted)">Sin ejercicios cargados.</div>'}</div>`;
}
function openRoutineDoc(rid){
 const r=S.routines.find(x=>x.id===rid);if(!r)return;closeModal();
 openDoc(routineSheet(r),`<div class="wrap"><button class="btn ghost" type="button" data-act="docclose">← Volver</button><div class="tools"><button class="btn primary" type="button" data-act="share" data-id="${rid}">Enviar</button><button class="btn" type="button" data-act="print">Descargar PDF</button><button class="btn" type="button" data-act="edit" data-col="gymroutines" data-id="${rid}">Editar</button></div></div>`);
}
async function showPublic(id){
 gateScreen(`<img class="crest-lg" src="logo.png" alt="Escudo del club"><h1>Cargando…</h1><p>Abriendo la rutina.</p>`);
 try{const snap=await getDoc(doc(db,'public',id));
  if(!snap.exists())return gateScreen(`<img class="crest-lg" src="logo.png" alt="Escudo del club"><h1>Rutina no disponible</h1><p>Este link ya no existe o la rutina fue borrada. Pedile al cuerpo técnico que te la vuelva a enviar.</p>`);
  const r=snap.data();document.title=r.name+' · Rutina';$('#gate').hidden=true;
  openDoc(routineSheet(r),`<div class="wrap"><span class="eyebrow">Rutina de gimnasio</span><div class="tools"><button class="btn" type="button" data-act="print">Descargar PDF</button></div></div>`);
 }catch(e){gateScreen(`<img class="crest-lg" src="logo.png" alt="Escudo del club"><h1>Sin conexión</h1><p>No se pudo abrir la rutina. Revisá la conexión y volvé a abrir el link.</p>`)}
}

/* ---------- pantalla grande ---------- */
let BIG=null;
function openBig(sid){
 const s=S.sessions.find(x=>x.id===sid);if(!s)return;
 closeModal();BIG={sid,i:0,left:null,run:false,iv:null,lock:null,ctx:null};
 const el=$('#big');el.hidden=false;document.body.style.overflow='hidden';
 try{const p=el.requestFullscreen&&el.requestFullscreen();p&&p.catch&&p.catch(()=>{})}catch(_){}
 try{navigator.wakeLock&&navigator.wakeLock.request('screen').then(l=>{if(BIG)BIG.lock=l}).catch(()=>{})}catch(_){}
 bigRender();
}
function closeBig(){
 if(!BIG)return;clearInterval(BIG.iv);try{BIG.lock&&BIG.lock.release()}catch(_){}
 try{document.fullscreenElement&&document.exitFullscreen()}catch(_){}
 BIG=null;$('#big').hidden=true;if($('#doc').hidden&&$('#modal').hidden)document.body.style.overflow='';
}
const mmss=n=>{n=Math.max(0,n);return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0')};
function bigRender(){
 const s=S.sessions.find(x=>x.id===BIG.sid);if(!s)return closeBig();
 const tasks=sessTasks(s),n=sessNums()[s.id],i=BIG.i,t=tasks[i-1];
 if(t&&BIG.left==null)BIG.left=isNum(t.time)?Math.round(+t.time*60):0;
 let main;
 if(!t){const objs=lines(s.objectives),mats=lines(s.materials);
  main=`<div class="big-eyebrow">${esc(s.type||'Sesión')} · ${sessDuration(s)?sessDuration(s)+' min':''}${s.space?' · '+esc(s.space):''}</div><h1 class="big-title">${esc(s.focus||'Sesión N° '+n)}</h1>
  <div class="big-cols">${objs.length?`<div><h3>Objetivos</h3><ul class="big-list">${objs.map(o=>`<li>${esc(o)}</li>`).join('')}</ul></div>`:''}<div><h3>Tareas</h3><ul class="big-list">${tasks.map((x,k)=>`<li><span class="tm">${isNum(x.time)?x.time+"'":''}</span><span>${k+1}. ${esc(x.name)}</span></li>`).join('')||'<li>Sin tareas cargadas</li>'}</ul></div>${mats.length?`<div><h3>Materiales</h3><ul class="big-list">${mats.map(o=>`<li>${esc(o)}</li>`).join('')}</ul></div>`:''}</div>`}
 else main=`<div class="big-eyebrow">${esc(t.part||'')} · Tarea ${i} de ${tasks.length}</div><h1 class="big-title">${esc(t.name)}</h1>
  <div class="big-meta">${isNum(t.time)?`<span>⏱ ${+t.time} min</span>`:''}${t.space?`<span>Espacio: ${esc(t.space)}</span>`:''}${t.org?`<span>${esc(t.org)}</span>`:''}${t.mat?`<span>Materiales: ${esc(t.mat)}</span>`:''}</div>${t.desc?`<div class="big-desc">${esc(t.desc)}</div>`:''}`;
 $('#big').innerHTML=`<div class="big-top"><div class="l"><img src="logo.png" alt=""><div style="min-width:0"><div class="t">Sesión N° ${n}</div><div class="s">${esc(longDate(s.date))}${s.time?' · '+esc(s.time)+' h':''}</div></div></div><button class="big-x" type="button" data-act="bexit">Salir</button></div>
 <div class="big-prog">${[0,...tasks.map((_,k)=>k+1)].map(k=>`<i class="${k<=i?'on':''}"></i>`).join('')}</div>
 <div class="big-main">${main}</div>
 <div class="big-bot"><button class="big-nav" type="button" data-act="bprev" ${i===0?'disabled':''}>← Anterior</button>
 <div class="big-timer">${t?`<span class="big-time ${BIG.left===0&&isNum(t.time)?'done':''}" id="bigTime">${mmss(BIG.left)}</span><button class="big-tbtn" type="button" data-act="btimer">${BIG.run?'Pausar':'Iniciar'}</button><button class="big-tbtn" type="button" data-act="breset">Reiniciar</button>`:`<span class="big-hint">Tocá Siguiente para empezar con la primera tarea</span>`}</div>
 <button class="big-nav" type="button" data-act="bnext" ${i>=tasks.length?'disabled':''}>Siguiente →</button></div>`;
}
function bigGo(d){if(!BIG)return;const s=S.sessions.find(x=>x.id===BIG.sid);const max=sessTasks(s).length;const ni=Math.min(max,Math.max(0,BIG.i+d));if(ni===BIG.i)return;clearInterval(BIG.iv);BIG.run=false;BIG.i=ni;BIG.left=null;bigRender()}
function bigBeep(){try{const ctx=BIG.ctx;if(!ctx)return;[0,.4,.8].forEach(t=>{const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=880;o.connect(g);g.connect(ctx.destination);const at=ctx.currentTime+t;g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(.5,at+.02);g.gain.exponentialRampToValueAtTime(.0001,at+.3);o.start(at);o.stop(at+.32)})}catch(_){}}
function bigToggle(){
 if(!BIG)return;
 if(!BIG.ctx){try{const C=window.AudioContext||window.webkitAudioContext;BIG.ctx=C?new C():null}catch(_){}}
 if(BIG.run){clearInterval(BIG.iv);BIG.run=false;bigRender();return}
 if(!BIG.left)return toast('Esta tarea no tiene tiempo cargado.');
 BIG.run=true;bigRender();
 BIG.iv=setInterval(()=>{if(!BIG)return;BIG.left--;const el=$('#bigTime');if(el)el.textContent=mmss(BIG.left);if(BIG.left<=0){clearInterval(BIG.iv);BIG.run=false;bigBeep();bigRender()}},1000);
}

/* ---------- bienestar y RPE de los jugadores ---------- */
function vWell(){
 const d=wellDate||today();
 const h=`<div class="bar"><div><h2>Bienestar y RPE</h2><p>Lo carga cada jugador desde su link personal, sin cuenta. Escala de 1 (mal) a 5 (muy bien).</p></div><div class="tools"><input class="flt" type="date" id="wellDate" value="${d}" max="${today()}" aria-label="Fecha"><button class="btn primary" type="button" data-act="links">Links de los jugadores</button></div></div>`;
 if(!S.players.length)return h+empty('Sin jugadores','Cargá el plantel para generar el link de cada jugador.','players','Agregar jugador');
 const ps=sortedPlayers();const rows=ps.map(p=>({p,w:wellOf(p.id,d)}));const ans=rows.filter(r=>r.w);
 const alerts=ans.filter(r=>WELL.some(w=>+r.w[w[0]]<=2));const rp=rpesOf(d);
 const avg=ans.length?(ans.reduce((a,r)=>a+wellTotal(r.w),0)/ans.length).toFixed(1):'–';
 const v=x=>`<td class="r"><span class="wv ${+x<=2?'lo':+x>=4?'hi':''}">${esc(x??'–')}</span></td>`;
 const delBtn=id=>`<button class="btn ghost sm danger" type="button" data-act="del" data-col="checkins" data-id="${id}">Borrar</button>`;
 let out=h+`<div class="stats"><div class="stat"><div class="k">Respondieron</div><div class="v">${ans.length}/${ps.length}</div><div class="s">${d===today()?'hoy':fdy(d)}</div></div><div class="stat"><div class="k">Bienestar promedio</div><div class="v">${avg}</div><div class="s">sobre 20</div></div><div class="stat"><div class="k">Alertas</div><div class="v ${alerts.length?'warn':''}">${alerts.length}</div><div class="s">con algún valor en 1 o 2</div></div><div class="stat"><div class="k">RPE cargados</div><div class="v">${rp.length}</div><div class="s">ese día</div></div></div>`;
 out+=`<div class="tablewrap"><table><thead><tr><th>Jugador</th>${WELL.map(w=>`<th class="r">${w[1]}</th>`).join('')}<th class="r">Total</th><th>Dolor / comentario</th><th></th></tr></thead><tbody>${[...rows].sort((a,b)=>(a.w?wellTotal(a.w):99)-(b.w?wellTotal(b.w):99)).map(({p,w})=>w?`<tr class="click" data-act="player" data-id="${p.id}"><td><span class="num" style="color:var(--muted)">${isNum(p.number)?+p.number:''}</span> ${esc(p.name)}</td>${WELL.map(x=>v(w[x[0]])).join('')}<td class="r num"><b>${wellTotal(w)}</b>/20</td><td style="white-space:normal;min-width:140px">${esc([w.painZone,w.note].filter(Boolean).join(' · '))}</td><td>${delBtn(w.id)}</td></tr>`:`<tr class="click" data-act="player" data-id="${p.id}"><td><span class="num" style="color:var(--muted)">${isNum(p.number)?+p.number:''}</span> ${esc(p.name)}</td><td colspan="${WELL.length+3}" style="color:var(--muted)">Sin responder</td></tr>`).join('')}</tbody></table></div>`;
 out+=`<div class="bar"><div><h2 style="font-size:22px">Esfuerzo (RPE) del día</h2><p>Carga individual = RPE × minutos.</p></div></div>`;
 out+=rp.length?`<div class="tablewrap"><table><thead><tr><th>Jugador</th><th>Actividad</th><th class="r">RPE</th><th class="r">Min</th><th class="r">Carga</th><th>Comentario</th><th></th></tr></thead><tbody>${rp.sort((a,b)=>(b.rpe||0)-(a.rpe||0)).map(c=>`<tr><td>${esc(plName(c.player))}</td><td>${esc(c.activity||'')}</td><td class="r"><span class="wv ${+c.rpe>=8?'lo':''}">${esc(c.rpe)}</span></td><td class="r num">${esc(c.minutes??'')}</td><td class="r num">${isNum(c.minutes)?Math.round(c.rpe*c.minutes):''}</td><td style="white-space:normal;min-width:140px">${esc(c.note||'')}</td><td>${delBtn(c.id)}</td></tr>`).join('')}</tbody></table></div>`:`<div class="empty"><strong>Sin RPE ese día</strong><p>Después de entrenar, cada jugador carga su esfuerzo del 1 al 10 y los minutos desde su link.</p></div>`;
 return out;
}
function ensureShare(r){
 let sid=r.shareId;
 if(!sid){sid=randId(20);r.shareId=sid;const body={...r};delete body.id;setDoc(doc(db,'routines',r.id),body).catch(()=>{})}
 setDoc(doc(db,'public',sid),publicRoutine(r)).catch(()=>{});return sid;
}
function syncPlink(p){
 let t=p.linkId;
 if(!t){t=randId(20);p.linkId=t;const body={...p};delete body.id;setDoc(doc(db,'players',p.id),body).catch(()=>{})}
 const routines=S.routines.filter(r=>isGym(r)&&Array.isArray(r.assigned)&&r.assigned.includes(p.id)).map(r=>({name:r.name||'',sid:ensureShare(r)}));
 setDoc(doc(db,'plinks',t),{player:p.id,name:p.name||'',club:club.name||'',routines,updatedAt:new Date().toISOString()}).catch(()=>{});
 return t;
}
function openLinks(pid){
 if(!S.players.length){toast('Primero cargá el plantel.');return}
 const ps=pid?[pl(pid)].filter(Boolean):sortedPlayers();if(!ps.length)return;
 const msg=(p,url)=>`Hola ${String(p.name||'').trim().split(/\s+/)[0]}! Este es tu link personal${club.name?' de '+club.name:''}. Antes de entrenar cargá cómo llegaste y después tu esfuerzo (RPE). Guardalo en favoritos.\n${url}`;
 editing=null;$('#mTitle').textContent=pid?'Link del jugador':'Links de los jugadores';
 $('#mBody').innerHTML=`<p style="margin:0">Cada jugador tiene su link personal. Desde ahí carga cómo llegó (sueño, cansancio, dolor, estrés), su esfuerzo después de entrenar y lo que hizo en el gimnasio, y ve las rutinas que tiene asignadas. No necesita cuenta y no ve ningún dato del equipo.</p>
 <div class="list">${ps.map(p=>{const url=playerUrl(syncPlink(p));return `<div class="row r-mail"><div class="main"><div class="t">${esc(p.name)}</div><div class="m"><span style="overflow-wrap:anywhere">${esc(url)}</span></div></div><div class="acts"><a class="btn sm primary" href="https://wa.me/?text=${encodeURIComponent(msg(p,url))}" target="_blank" rel="noopener">WhatsApp</a><button class="btn sm" type="button" data-act="copyurl" data-url="${esc(url)}">Copiar</button>${pid?`<a class="btn ghost sm" href="${esc(url)}" target="_blank" rel="noopener">Ver</a>`:''}</div></div>`}).join('')}</div>
 <p style="margin:0;font-size:13px;color:var(--muted)">El link es personal: quien lo tenga puede cargar datos a nombre de ese jugador, así que mandáselo solo a él.</p>`;
 showModal();
}

/* página del jugador (se abre con su link, sin cuenta) */
let PL=null;
async function showPlayer(tok){
 const crest=`<img class="crest-lg" src="logo.png" alt="Escudo del club">`;
 gateScreen(`${crest}<h1>Cargando…</h1><p>Abriendo tu página.</p>`);
 let L;
 try{const snap=await getDoc(doc(db,'plinks',tok));if(!snap.exists())return gateScreen(`${crest}<h1>Link no disponible</h1><p>Este link ya no existe. Pedile al cuerpo técnico que te mande uno nuevo.</p>`);L=snap.data()}
 catch(e){return gateScreen(`${crest}<h1>No se pudo abrir</h1><p>${navigator.onLine?'El link todavía no está habilitado. Avisale al cuerpo técnico.':'Revisá la conexión y volvé a abrir el link.'}</p>`)}
 PL={tok,L};document.title=(L.club?L.club+' · ':'')+L.name;$('#gate').hidden=true;
 const seg=(name,n,lo,hi)=>`<div class="seg n${n}" role="radiogroup" aria-label="${name}">${Array.from({length:n},(_,i)=>`<label><input type="radio" name="${name}" value="${i+1}" id="${name}_${i+1}"><span>${i+1}</span></label>`).join('')}</div><div class="seg-ends"><span>${lo}</span><span>${hi}</span></div>`;
 const rts=(L.routines||[]).filter(r=>r&&r.sid);
 openDoc(`<div class="sh-head"><img src="logo.png" alt="Escudo del club"><div style="min-width:0"><div class="sh-club">${esc(L.club||'Cuerpo técnico')}</div><div class="eyebrow">Mi registro</div></div></div>
 <h1 class="sh-title">Hola, ${esc(String(L.name||'').trim().split(/\s+/)[0])}</h1>
 <form class="pcard" id="wellFrm" novalidate><div><div class="eyebrow">Antes de entrenar</div><h3>Cómo llegué hoy</h3></div>
  ${WELL.map(w=>`<div class="fld"><span class="lb">${w[1]}</span>${seg(w[0],5,w[2],w[3])}</div>`).join('')}
  <div class="fld"><label for="w_zone">¿Te duele algo? ¿Dónde?</label><input id="w_zone" maxlength="80" placeholder="Opcional. Ej: isquiotibial derecho"></div>
  <div class="fld"><label for="w_note">Comentario</label><textarea id="w_note" maxlength="400" placeholder="Opcional"></textarea></div>
  <p class="err" id="wellErr" hidden></p><button class="btn primary block" type="submit">Enviar cómo llegué</button><p class="sent" id="wellOk" hidden></p></form>
 <form class="pcard" id="rpeFrm" novalidate><div><div class="eyebrow">Después de entrenar</div><h3>Mi esfuerzo</h3></div>
  <div class="form"><div class="fld"><label for="r_act">¿Qué hiciste?</label><select id="r_act"><option value="Equipo">Entrenamiento con el equipo</option><option value="Gimnasio">Gimnasio</option><option value="Partido">Partido</option><option value="Otro">Otro, por mi cuenta</option></select></div>
  <div class="fld"><label for="r_date">Fecha</label><input id="r_date" type="date" value="${today()}" max="${today()}"></div></div>
  <div class="fld"><span class="lb">Esfuerzo (RPE)</span>${seg('rpe',10,'Muy suave','Máximo')}</div>
  <div class="fld"><label for="r_min">Duración (minutos)</label><input id="r_min" type="number" inputmode="numeric" min="1" max="300" placeholder="Ej: 90"></div>
  <div class="fld"><label for="r_note">Qué hiciste</label><textarea id="r_note" maxlength="400" placeholder="Opcional. En gimnasio: ejercicios y cargas"></textarea></div>
  <p class="err" id="rpeErr" hidden></p><button class="btn primary block" type="submit">Enviar mi esfuerzo</button><p class="sent" id="rpeOk" hidden></p></form>
 ${rts.length?`<div class="pcard"><div><div class="eyebrow">Gimnasio</div><h3>Mis rutinas</h3></div><div class="list">${rts.map(r=>`<a class="row click" style="text-decoration:none;color:inherit" href="#r-${esc(r.sid)}"><span class="t">${esc(r.name)}</span><span style="color:var(--accent);font-weight:600">Ver →</span></a>`).join('')}</div></div>`:''}
 <p style="margin:0;font-size:13px;color:var(--muted)">Tus respuestas las ve solo el cuerpo técnico. Guardá esta página en favoritos o en la pantalla de inicio.</p>`,
 `<div class="wrap"><span class="eyebrow">${esc(L.name||'')}</span></div>`);
}
async function sendCheckin(kind){
 if(!PL)return;const pre=kind==='well'?'well':'rpe';const errEl=$('#'+pre+'Err'),okEl=$('#'+pre+'Ok'),btn=$('#'+pre+'Frm button[type=submit]');
 const pick=n=>{const el=document.querySelector(`input[name="${n}"]:checked`);return el?+el.value:null};
 const fail=m=>{errEl.textContent=m;errEl.hidden=false;okEl.hidden=true};errEl.hidden=true;
 const data={token:PL.tok,player:PL.L.player,kind,at:new Date().toISOString()};
 if(kind==='well'){
  for(const w of WELL){const v=pick(w[0]);if(!v)return fail(`Elegí un valor en “${w[1]}”.`);data[w[0]]=v}
  data.date=today();data.painZone=$('#w_zone').value.trim().slice(0,80);data.note=$('#w_note').value.trim().slice(0,400);
 }else{
  const r=pick('rpe');if(!r)return fail('Elegí tu esfuerzo del 1 al 10.');
  const m=Number($('#r_min').value);if(!m||m<1||m>300)return fail('Escribí cuántos minutos duró (de 1 a 300).');
  const d=$('#r_date').value||today();if(d>today())return fail('La fecha no puede ser futura.');
  data.rpe=r;data.minutes=Math.round(m);data.date=d;data.activity=$('#r_act').value;data.note=$('#r_note').value.trim().slice(0,400);
 }
 if(!navigator.onLine)return fail('Sin conexión. Probá de nuevo cuando tengas señal.');
 btn.disabled=true;
 try{
  await Promise.race([setDoc(doc(collection(db,'checkins')),data),new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),15000))]);
  okEl.textContent='Enviado a las '+new Date().toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit',hour12:false})+' h. ¡Gracias!';okEl.hidden=false;
  if(kind==='rpe'){document.querySelectorAll('input[name="rpe"]').forEach(x=>x.checked=false);$('#r_min').value='';$('#r_note').value=''}
 }catch(e){fail('No se pudo enviar. Probá de nuevo en un momento; si sigue fallando, avisale al cuerpo técnico.')}
 btn.disabled=false;
}

/* ---------- eventos ---------- */
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-act]');
 if(!b){if(e.target.id==='modal')closeModal();return}
 const a=b.dataset.act;
 if(a==='menu'){const o=$('#nav').classList.toggle('open');b.setAttribute('aria-expanded',o);$('#menuLbl').textContent=o?'Cerrar':'Menú'}
 else if(a==='tab'){$('#nav').classList.remove('open');$('#menuLbl').textContent='Menú';tab=b.dataset.k;try{localStorage.setItem('ct_tab',tab)}catch(_){};render();window.scrollTo({top:0})}
 else if(a==='add'){e.stopPropagation();openForm(b.dataset.col,null,{pre:b.dataset.pre,date:b.dataset.date})}
 else if(a==='edit'){e.stopPropagation();let key=b.dataset.col;if(key==='routines'){const r=S.routines.find(x=>x.id===b.dataset.id);if(r&&isGym(r))key='gymroutines'}closeDoc();openForm(key,b.dataset.id)}
 else if(a==='dup'){closeDoc();openForm('sessions',null,{copy:b.dataset.id})}
 else if(a==='del'){e.stopPropagation();del(b)}
 else if(a==='sheet'){if(e.target.closest('.acts')&&b.classList.contains('row'))return;openSessionDoc(b.dataset.id)}
 else if(a==='rsheet'){openRoutineDoc(b.dataset.id)}
 else if(a==='att'){e.stopPropagation();openAtt(b.dataset.id)}
 else if(a==='big'){e.stopPropagation();openBig(b.dataset.id)}
 else if(a==='docclose')closeDoc();
 else if(a==='print'){try{window.print()}catch(_){toast('No se pudo abrir la descarga. Usá Compartir → Imprimir del navegador.')}}
 else if(a==='share'){e.stopPropagation();shareRoutine(b.dataset.id)}
 else if(a==='nshare'){navigator.share({title:b.dataset.text,text:b.dataset.text,url:b.dataset.url}).catch(()=>{})}
 else if(a==='copylink'){const i=$('#shareUrl');const done=()=>toast('Link copiado');navigator.clipboard?navigator.clipboard.writeText(i.value).then(done).catch(()=>{i.select();document.execCommand('copy');done()}):(i.select(),document.execCommand('copy'),done())}
 else if(a==='rowadd'){const box=document.querySelector(`[data-rows="${b.dataset.k}"]`);const last=box.querySelector('[data-row]:last-child [data-c="part"]');box.insertAdjacentHTML('beforeend',rowCard(b.dataset.k,last?{part:last.value}:{},0));renumRows(box);const nw=box.lastElementChild.querySelector('[data-c="name"]');nw&&nw.focus()}
 else if(a==='rowdel'){const card=b.closest('[data-row]');const box=card.parentElement;card.remove();renumRows(box)}
 else if(a==='rowup'){const card=b.closest('[data-row]');if(card.previousElementSibling){card.parentElement.insertBefore(card,card.previousElementSibling);renumRows(card.parentElement)}}
 else if(a==='rowdown'){const card=b.closest('[data-row]');if(card.nextElementSibling){card.parentElement.insertBefore(card.nextElementSibling,card);renumRows(card.parentElement)}}
 else if(a==='attall'){document.querySelectorAll('[data-att]').forEach(x=>{x.value=availability(x.dataset.att)[0]!=='Disponible'?'L':'P';x.className='s-'+x.value});attCount()}
 else if(a==='attclear'){document.querySelectorAll('[data-att]').forEach(x=>{x.value='';x.className='s-'});attCount()}
 else if(a==='gtab'){guideTab=b.dataset.k;render()}
 else if(a==='gyear')openGuideYear();
 else if(a==='gmicro'){e.stopPropagation();openGuideMicro(b.dataset.id)}
 else if(a==='gtpl'){openForm('sessions',null,{tpl:sessionFor({key:b.dataset.k},gPer())})}
 else if(a==='ggym'){const r=GYM[+b.dataset.p].routines[+b.dataset.i];if(S.routines.some(q=>q.name===r.name)){toast('Esa rutina ya está en Gimnasio.');return}setDoc(doc(collection(db,'routines')),{...r,kind:'Gimnasio',target:'Todo el plantel',assigned:[],by:me.uid,at:new Date().toISOString()}).catch(err=>toast(errMsg(err)));toast('Rutina agregada. La encontrás en Gimnasio.')}
 else if(a==='links')openLinks();
 else if(a==='plink')openLinks(b.dataset.id);
 else if(a==='copyurl'){const done=()=>toast('Link copiado');navigator.clipboard?navigator.clipboard.writeText(b.dataset.url).then(done).catch(()=>toast('No se pudo copiar. Mantené apretado el link para copiarlo.')):toast('No se pudo copiar.')}
 else if(a==='userpe'){$('#att_rpe').value=b.dataset.v}
 else if(a==='bexit')closeBig();
 else if(a==='bprev')bigGo(-1);
 else if(a==='bnext')bigGo(1);
 else if(a==='btimer')bigToggle();
 else if(a==='breset'){if(BIG){clearInterval(BIG.iv);BIG.run=false;BIG.left=null;bigRender()}}
 else if(a==='player'){if(e.target.closest('.acts'))return;openPlayer(b.dataset.id)}
 else if(a==='close')closeModal();
 else if(a==='pwreset'){if(me)sendPasswordResetEmail(auth,me.email).then(()=>toast('Te mandamos un mail para elegir una contraseña nueva.')).catch(ex=>toast(authMsg(ex)))}
 else if(a==='chk'){const g=document.querySelector(`[data-group="${b.dataset.k}"]`);g.querySelectorAll('input').forEach(c=>{c.checked=b.dataset.mode==='all'||(b.dataset.mode==='avail'&&availability(c.value)[0]==='Disponible')});updCount(b.dataset.k)}
 else if(a==='mode')showLogin(b.dataset.mode);
 else if(a==='logout'){signOut(auth)}
 else if(a==='resend'){if(me)sendEmailVerification(me).then(()=>toast('Mail reenviado.')).catch(ex=>toast(authMsg(ex)))}
 else if(a==='verified'){if(!me)return;b.disabled=true;me.reload().then(()=>me.getIdToken(true)).then(()=>{if(auth.currentUser.emailVerified){me=auth.currentUser;stopData();startAccess()}else{b.disabled=false;toast('Todavía no figura confirmado. Abrí el link del mail y volvé a tocar.')}}).catch(ex=>{b.disabled=false;toast(authMsg(ex))})}
 else if(a==='retry'){if(me){stopData();startAccess()}}
 else if(a==='unmail'){
  if(!b.classList.contains('armed')){b.classList.add('armed');b.textContent='¿Confirmar?';setTimeout(()=>{b.classList.remove('armed');b.textContent='Quitar acceso'},4000);return}
  const mail=b.dataset.mail;setDoc(doc(db,'config','access'),{...access,emails:access.emails.filter(x=>x!==mail)}).then(()=>toast('Acceso quitado')).catch(err=>toast(errMsg(err)));
 }
});
function updCount(k){const g=document.querySelector(`[data-group="${k}"]`);const c=$('#cnt_'+k);if(g&&c)c.textContent=g.querySelectorAll('input:checked').length}
document.addEventListener('change',e=>{
 if(e.target.id==='testFilter'){testFilter=e.target.value;render()}
 if(e.target.id==='injFilter'){injFilter=e.target.value;render()}
 if(e.target.id==='attRange'){attRange=e.target.value;render()}
 if(e.target.id==='wellDate'){wellDate=e.target.value;render()}
 if(e.target.id==='gPeriod')saveGuide({period:e.target.value});
 if(e.target.id==='gMatch')saveGuide({matchDay:+e.target.value});
 if(e.target.id==='gMatch2')saveGuide({match2:+e.target.value});
 if(e.target.matches&&e.target.matches('#view [data-gday]'))saveGuide({trainDays:[...document.querySelectorAll('#view [data-gday]:checked')].map(c=>+c.value)});
 if(e.target.closest('#gyFrm'))gySum();
 if(e.target.closest('#gmFrm')&&e.target.tagName==='SELECT')gmRender();
 if(e.target.id==='gymFilter'){gymFilter=e.target.value;render()}
 if(e.target.dataset&&e.target.dataset.att!==undefined){e.target.className='s-'+e.target.value;attCount()}
 const g=e.target.closest('[data-group]');if(g)updCount(g.dataset.group);
});
document.addEventListener('submit',e=>{
 const id=e.target.id;
 if(id==='authFrm')return onAuthForm(e);
 if(id==='frm')return submitForm(e);
 if(id==='attFrm')return saveAtt(e);
 if(id==='gyFrm')return createYear(e);
 if(id==='gmFrm')return createGuideSessions(e);
 if(id==='wellFrm'){e.preventDefault();return sendCheckin('well')}
 if(id==='rpeFrm'){e.preventDefault();return sendCheckin('rpe')}
 if(id==='clubFrm'){e.preventDefault();const name=$('#clubIn').value.trim();if(!name){toast('Escribí el nombre del equipo.');return}
  document.activeElement&&document.activeElement.blur();
  setDoc(doc(db,'config','club'),{...club,name,editBy:me.uid,editAt:new Date().toISOString()}).catch(err=>toast(errMsg(err)));toast('Nombre del equipo actualizado')}
 if(id==='meFrm'){e.preventDefault();const name=$('#meName').value.trim();if(!name){toast('Escribí tu nombre.');return}
  document.activeElement&&document.activeElement.blur();
  updateProfile(auth.currentUser,{displayName:name}).then(()=>{me=auth.currentUser;return setDoc(doc(db,'members',me.uid),{name,email:me.email.toLowerCase(),seen:new Date().toISOString()})}).then(()=>{toast('Nombre actualizado');render()}).catch(err=>toast(errMsg(err)))}
 if(id==='accFrm'){e.preventDefault();const mail=$('#accMail').value.trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)){toast('Escribí un mail válido.');return}
  if(access.emails.includes(mail)){toast('Ese mail ya tiene acceso.');return}
  setDoc(doc(db,'config','access'),{...access,emails:[...access.emails,mail]}).then(()=>toast('Mail habilitado')).catch(err=>toast(errMsg(err)));$('#accMail').value=''}
});
document.addEventListener('keydown',e=>{
 if(BIG){if(e.key==='ArrowRight'||e.key==='PageDown'){e.preventDefault();bigGo(1)}else if(e.key==='ArrowLeft'||e.key==='PageUp'){e.preventDefault();bigGo(-1)}else if(e.key===' '&&!e.target.closest('button')){e.preventDefault();bigToggle()}else if(e.key==='Escape')closeBig();return}
 if(e.key!=='Escape')return;
 if(!$('#modal').hidden)closeModal();else if(!publicMode)closeDoc();
});
let tx=null;
document.addEventListener('touchstart',e=>{if(BIG&&e.touches.length===1)tx=e.touches[0].clientX},{passive:true});
document.addEventListener('touchend',e=>{if(!BIG||tx==null)return;const dx=e.changedTouches[0].clientX-tx;tx=null;if(e.target.closest('button'))return;if(Math.abs(dx)>70)bigGo(dx<0?1:-1)},{passive:true});
try{const t=localStorage.getItem('ct_tab');if(t)tab=t}catch(_){}
window.addEventListener('hashchange',()=>{if(/^#[rj]-/.test(location.hash)||publicMode)location.reload()});
if(pubMatch)showPublic(pubMatch[1]);else if(plMatch)showPlayer(plMatch[1]);

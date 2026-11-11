const store=window.__store||(window.__store={});const subs=[];
const get=p=>{const [c,id]=p.split('/');return store[c]&&store[c][id]};
let n=0;
export const initializeFirestore=()=>({});export const persistentLocalCache=()=>({});export const persistentMultipleTabManager=()=>({});
export const collection=(db,c)=>({kind:'col',path:c});
export const doc=(a,c,id)=>{if(a&&a.kind==='col')return{kind:'doc',path:a.path+'/auto'+(++n),id:'auto'+n};return{kind:'doc',path:c+'/'+id,id}};
function fire(){subs.forEach(s=>s.run())}
export function onSnapshot(ref,cb,err){const s={run(){if(ref.kind==='col'){if(window.__deny&&window.__deny.includes(ref.path))return err&&err({code:'permission-denied'});const m=store[ref.path]||{};cb({docs:Object.entries(m).map(([id,d])=>({id,data:()=>JSON.parse(JSON.stringify(d))})),metadata:{fromCache:false}})}else{const d=get(ref.path);cb({exists:()=>!!d,data:()=>d&&JSON.parse(JSON.stringify(d)),metadata:{fromCache:false}})}}};subs.push(s);setTimeout(()=>s.run(),0);return()=>{subs.splice(subs.indexOf(s),1)}}
export async function setDoc(ref,data){const [c,id]=ref.path.split('/');(store[c]=store[c]||{})[id]=JSON.parse(JSON.stringify(data));setTimeout(fire,0)}
export async function deleteDoc(ref){const [c,id]=ref.path.split('/');if(store[c])delete store[c][id];setTimeout(fire,0)}
export async function getDoc(ref){const d=get(ref.path);return{exists:()=>!!d,data:()=>d}}

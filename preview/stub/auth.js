// Vista previa: usuario de ejemplo, sin Firebase.
const user={uid:'u1',email:'ejemplo@cuaderno.app',emailVerified:true,displayName:'Entrenador Ejemplo',reload:async()=>{},getIdToken:async()=>''};
export const getAuth=()=>({currentUser:user});
export const onAuthStateChanged=(a,cb)=>setTimeout(()=>cb(user),0);
export const signInWithEmailAndPassword=async()=>{};export const createUserWithEmailAndPassword=async()=>({user});
export const sendEmailVerification=async()=>{};export const sendPasswordResetEmail=async()=>{};export const signOut=async()=>{};
export const updateProfile=async(u,p)=>{Object.assign(user,p)};

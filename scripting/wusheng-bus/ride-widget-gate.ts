import CryptoJS from './vendor/crypto-js.js'
import type {Account} from './account'

export const TAP_MS=30000, WARN_AFTER_MS=20000
export const supportedRideFamily=(family:string)=>['systemSmall','systemMedium','systemLarge','systemExtraLarge'].includes(family)
export const sessionTag=(a:Account|undefined):string=>a?CryptoJS.SHA256(a.userId+'\n'+a.authorization+'\n'+(a.widgetSession||'')).toString():''
const unique=()=>Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)+'-'+Math.random().toString(36).slice(2)
type Row={version:string;owner:string;tapped:number;claim:string}
export function rideGate(family:string,root=FileManager.appGroupDocumentsDirectory+'/wusheng-ride-widget-v1'){
 if(!supportedRideFamily(family))throw Error('不支持的组件尺寸')
 const dir=root+'/'+family,f=FileManager,path=dir+'/state'
 f.createDirectorySync(dir,true)
 const empty=():Row=>({version:unique(),owner:'',tapped:0,claim:''})
 const write=(r:Row)=>{f.writeAsStringSync(path,JSON.stringify(r));return r}
 const read=():Row=>f.existsSync(path)?JSON.parse(f.readAsStringSync(path)):write(empty())
 // Exclusive filesystem creation serializes extensions. No network work under lock;
 // a failed acquisition must never authorize a request.
 function locked<T>(fn:()=>T):T{
  const lock=dir+'/lock';f.createLinkSync(lock,path)
  try{return fn()}finally{f.removeSync(lock)}
 }
 return {row:()=>locked(read),show(version:string,owner:string,now=Date.now()){locked(()=>{if(owner&&read().version===version)write({version:unique(),owner,tapped:now,claim:''})})},
  hide(clear?:()=>void){locked(()=>{write(empty());clear?.()})},
  commit(claim:string,owner:string,save:()=>void){locked(()=>{const r=read(),age=Date.now()-r.tapped;if(claim&&r.claim===claim&&r.owner===owner&&age>=0&&age<TAP_MS)save()})},
  take(owner:string,now=Date.now()){return locked(()=>{const r=read();if(!owner||r.owner!==owner||r.claim||now<r.tapped||now-r.tapped>=TAP_MS)return undefined;return write({...r,claim:unique()})})}}
}

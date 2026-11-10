import CryptoJS from './vendor/crypto-js.js'
const KEY='wusheng.bus.auth.v1'
export type Account={authorization:string;userId:string}
export function readAccount():Account|undefined{try{const a=JSON.parse(Keychain.get(KEY)||'null');return /^Bearer [^\r\n]{16,32768}$/.test(a?.authorization)&&/^\d{1,24}$/.test(a?.userId)?a:undefined}catch{return undefined}}
export function forgetAccount(){Keychain.remove(KEY);Storage.set('wusheng.bus.balance',null)}
export function decodeAccount(raw:string,password:string):Account{
 try{
  if(raw.length>65536)throw Error();const e=JSON.parse(raw)
  if(e.version!=='WB1'||e.iterations!==100000||!['salt','iv','ciphertext','mac'].every(k=>typeof e[k]==='string')||!/^[0-9a-f]{32}$/.test(e.salt)||!/^[0-9a-f]{32}$/.test(e.iv)||!/^[0-9a-f]{64}$/.test(e.mac))throw Error()
  const all=CryptoJS.PBKDF2(password,CryptoJS.enc.Hex.parse(e.salt),{keySize:16,iterations:100000,hasher:CryptoJS.algo.SHA256})
  const aes=CryptoJS.lib.WordArray.create(all.words.slice(0,8),32),macKey=CryptoJS.lib.WordArray.create(all.words.slice(8,16),32)
  const signature=CryptoJS.HmacSHA256('WB1|'+e.salt+'|'+e.iv+'|'+e.ciphertext,macKey).toString()
  let diff=0;for(let i=0;i<64;i++)diff|=signature.charCodeAt(i)^e.mac.charCodeAt(i);if(diff)throw Error()
  const plain=CryptoJS.AES.decrypt({ciphertext:CryptoJS.enc.Base64.parse(e.ciphertext)},aes,{iv:CryptoJS.enc.Hex.parse(e.iv),mode:CryptoJS.mode.CBC,padding:CryptoJS.pad.Pkcs7}).toString(CryptoJS.enc.Utf8)
  const a=JSON.parse(plain)
  if(!/^Bearer [^\r\n]{16,32768}$/.test(a.authorization)||!/^\d{1,24}$/.test(a.userId))throw Error()
  return {authorization:a.authorization,userId:a.userId}
 }catch{throw Error('账号文件或导入口令不正确')}
}
export function saveAccount(a:Account){Keychain.set(KEY,JSON.stringify(a));Storage.set('wusheng.bus.balance',null)}

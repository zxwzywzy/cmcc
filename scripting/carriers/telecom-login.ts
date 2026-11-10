import { fetch } from 'scripting'
import JSEncrypt from './vendor/jsencrypt.js'
import { normalize } from './normalizers.js'
import type { Metrics } from './hub'
const KEY='carrier.hub.telecom.login.v1'
const LOGIN='https://appgologin.189.cn:9031/login/client/userLoginNormal'
const QUERY='https://appfuwu.189.cn:9021/query/qryImportantData'
type Credentials={phone:string;password:string;deviceID:string;token?:string;provinceCode?:string;cityCode?:string}
const PUB=`-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDBkLT15ThVgz6/NOl6s8GNPofd
WzWbCkWnkaAm7O2LjkM1H7dMvzkiqdxU02jamGRHLX/ZNMCXHnPcW/sDhiFCBN18
qFvy8g6VYb9QtroI09e176s+ZCtiv7hbin2cCTj99iUpnEloZm19lwHyo69u5UMi
PMpq0/XKBO8lYhN/gwIDAQAB
-----END PUBLIC KEY-----`
function read():Credentials|undefined{try{const c=JSON.parse(Keychain.get(KEY)||'null');return c&&/^1\d{10}$/.test(c.phone)&&typeof c.password==='string'?c:undefined}catch{return undefined}}
export function telecomLoginInfo(){const c=read();return c?{phoneTail:c.phone.slice(-4)}:undefined}
export function telecomAccountMatches(phone:string){return read()?.phone===phone.trim()}
export function removeTelecomLogin(){Keychain.remove(KEY)}
export function beijingTimestamp(time=Date.now()){
 const d=new Date(time+8*3600000),pad=(n:number)=>String(n).padStart(2,'0')
 return `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`
}
const trans=(v:string)=>[...v].map(x=>String.fromCharCode((x.charCodeAt(0)+2)&65535)).join('')
function header(c:Credentials,code:string){return {code,clientType:'#12.2.0#channel50#iPhone 14 Pro#',timestamp:beijingTimestamp(),shopId:'20002',source:'110003',sourcePassword:'Sid98s',userLoginName:trans(c.phone),...(c.token?{token:c.token}:{})}}
async function post(url:string,body:any){
 try{const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json; charset=UTF-8'},body:JSON.stringify(body),redirect:'error'});if(!r.ok)throw Error();return await r.json() as any}
 catch{throw Error('电信网络请求失败，请稍后重试')}
}
async function login(c:Credentials):Promise<Credentials>{
 const h=header(c,'userLoginNormal'),uuid=String(Math.floor(Math.random()*9e15+1e15))
 const rsa=new JSEncrypt();rsa.setPublicKey(PUB)
 const encrypted=rsa.encrypt(`iPhone 14 15.4.0${c.deviceID||uuid.slice(0,12)}${c.phone}${h.timestamp}${c.password}0$$$0.`)
 if(!encrypted)throw Error('电信登录加密失败，请检查设备 ID 和密码长度')
 const data=await post(LOGIN,{content:{fieldData:{loginType:'4',accountType:'',isChinatelecom:'',systemVersion:'15.4.0',deviceUid:uuid.slice(0,16),phoneNum:trans(c.phone),authentication:trans(c.password),androidId:c.deviceID?trans(c.deviceID):'',loginAuthCipherAsymmertric:encrypted},attach:'iPhone'},headerInfos:h})
 const r=data?.responseData,s=r?.data?.loginSuccessResult
 if(r?.resultCode!=='0000'||typeof s?.token!=='string'||!s.token)throw Error('电信登录未成功，请核对登录密码或在官方 App 完成安全验证')
 return {...c,token:s.token,provinceCode:typeof s.provinceCode==='string'?s.provinceCode:'',cityCode:typeof s.cityCode==='string'?s.cityCode:''}
}
async function query(c:Credentials){return post(QUERY,{content:{fieldData:{provinceCode:c.provinceCode||'',cityCode:c.cityCode||'',shopId:'20002',isChinatelecom:'0',account:trans(c.phone)},attach:'test'},headerInfos:header(c,'qryImportantData')})}
function metrics(c:Credentials,response:any):Metrics{return {...normalize('telecom',response),telecomSchema:3,phoneTail:c.phone.slice(-4)} as Metrics}
export async function configureTelecomLogin(phone:string,password:string,deviceID=''){
 phone=phone.trim();deviceID=deviceID.trim()
 if(!/^1\d{10}$/.test(phone)||!password||password.length>32||deviceID.length>64)throw Error('请输入正确手机号和登录密码，设备 ID 可留空')
 const c=await login({phone,password,deviceID}),m=metrics(c,await query(c))
 // Replace saved credentials only after login and a valid usage response both succeed.
 Keychain.set(KEY,JSON.stringify(c));return m
}
let pending:Promise<Metrics>|undefined
export async function queryTelecomLogin():Promise<Metrics>{
 if(pending)return pending
 pending=(async()=>{
  const saved=Keychain.get(KEY),c=read();if(!c)throw Error('请先设置电信账号密码')
  let current=c,response:any
  if(!c.token)current=await login(c)
  response=await query(current)
  if(response?.responseData?.resultCode!=='0000'){
   // At most one re-login, only after an actual server failure; network errors do not trigger it.
   current=await login(c);response=await query(current)
  }
  const m=metrics(current,response)
  if(Keychain.get(KEY)!==saved)throw Error('电信账号已变更，请重新刷新')
  Keychain.set(KEY,JSON.stringify(current));return m
 })()
 try{return await pending}finally{pending=undefined}
}

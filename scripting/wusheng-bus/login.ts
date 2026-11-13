import { fetch } from 'scripting'
import { readAccount,saveAccount,type Account } from './account'
import { balance } from './api'
export const LOGIN_SUBSCRIPTION='https://raw.githubusercontent.com/zxwzywzy/cmcc/main/Wusheng-Bus-Login.conf'
const BOX_KEY='wusheng_bus_login_v1',HOST_KEY='wusheng.bus.boxjs.host'
export function boxHost(){return Storage.get<string>(HOST_KEY)||'boxjs.com'}
export function captureInstallURL(){return 'quantumult-x:///add-resource?remote-resource='+encodeURIComponent(JSON.stringify({rewrite_remote:[LOGIN_SUBSCRIPTION+', tag=武胜公交登录授权, enabled=true']}))}
export function capturedAccount(raw:string):Account{
 try{
  if(raw.length>65536)throw Error()
  const value=JSON.parse(raw)
  if(value.version!==1||typeof value.authorization!=='string'||!/^Bearer [^\r\n]{16,32768}$/.test(value.authorization)||typeof value.userId!=='string'||!/^\d{1,24}$/.test(value.userId))throw Error()
  return {authorization:value.authorization,userId:value.userId}
 }catch{throw Error('抓取记录不完整，请在微信武胜公交“我的”页刷新后重试')}
}
const unchanged=(a:Account|undefined,b:Account|undefined)=>a?.authorization===b?.authorization&&a?.userId===b?.userId
export async function loginFromBoxJS(host=boxHost()){
 host=host.trim()
 if(!/^(boxjs\.com|boxjs\.net)$/.test(host))throw Error('BoxJS 域名只能填写 boxjs.com 或 boxjs.net')
 const previous=readAccount()
 let raw:string
 try{
  const response=await fetch('https://'+host+'/query/data/'+BOX_KEY,{redirect:'error'})
  if(!response.ok)throw Error()
  raw=await response.text();if(raw.length>131072)throw Error()
 }catch{throw Error('连接不到圈 X 的 BoxJS，请确认圈 X 和 BoxJS 重写已启用')}
 let envelope:any
 try{envelope=JSON.parse(raw)}catch{throw Error('BoxJS 未返回抓取记录，请检查 BoxJS 重写是否生效')}
 if(typeof envelope?.val!=='string'||!envelope.val)throw Error('还没有抓到登录授权，请开启抓取订阅后刷新微信武胜公交“我的”页')
 const account=capturedAccount(envelope.val)
 const card=await balance(account)
 if(!unchanged(previous,readAccount()))throw Error('账号已变化，请重新点击导入登录')
 saveAccount(account);Storage.set('wusheng.bus.balance',card);Storage.set(HOST_KEY,host)
 return card
}

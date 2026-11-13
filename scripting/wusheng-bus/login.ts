import { fetch } from 'scripting'
import { readAccount,saveAccount,type Account } from './account'
import { balance } from './api'
export const LOGIN_SUBSCRIPTION='https://raw.githubusercontent.com/zxwzywzy/cmcc/main/Wusheng-Bus-Login.conf?v=0.2.7'
const BOX_KEY='wusheng_bus_login_v1',DIAG_KEY='wusheng_bus_login_diag_v1',HOST_KEY='wusheng.bus.boxjs.host'
export function boxHost(){return Storage.get<string>(HOST_KEY)||'boxjs.com'}
export function captureInstallURL(){return 'quantumult-x:///add-resource?remote-resource='+encodeURIComponent(JSON.stringify({rewrite_remote:[LOGIN_SUBSCRIPTION+', tag=武胜公交登录授权, enabled=true']}))}
export function capturedAccount(raw:string):Account{
 try{
  if(raw.length>65536)throw Error()
  const value=JSON.parse(raw)
  if(value.version!==1||typeof value.authorization!=='string'||!/^Bearer [^\r\n]{16,32768}$/.test(value.authorization)||typeof value.userId!=='string'||!/^\d{1,24}$/.test(value.userId))throw Error()
  return {authorization:value.authorization,userId:value.userId}
 }catch{throw Error('抓取记录不完整，请重新进入微信武胜公交的乘车码或消费记录页面')}
}
const unchanged=(a:Account|undefined,b:Account|undefined)=>a?.authorization===b?.authorization&&a?.userId===b?.userId
async function boxValue(host:string,key:string){
 host=host.trim()
 if(!/^(boxjs\.com|boxjs\.net)$/.test(host))throw Error('BoxJS 域名只能填写 boxjs.com 或 boxjs.net')
 let raw:string
 try{
  const response=await fetch('https://'+host+'/query/data/'+key,{redirect:'error'})
  if(!response.ok)throw Error()
  raw=await response.text();if(raw.length>131072)throw Error()
 }catch{throw Error('连接不到圈 X 的 BoxJS，请确认圈 X 和 BoxJS 重写已启用')}
 let envelope:any
 try{envelope=JSON.parse(raw)}catch{throw Error('BoxJS 未返回抓取记录，请检查 BoxJS 重写是否生效')}
 return typeof envelope?.val==='string'?envelope.val:''
}
export async function captureStatus(host=boxHost()){
 const [record,diagnostic]=await Promise.allSettled([boxValue(host,BOX_KEY),boxValue(host,DIAG_KEY)])
 if(record.status==='fulfilled'&&record.value){try{capturedAccount(record.value);return 'BoxJS 已读到完整授权，直接点击账号页的“从 BoxJS 导入”即可。'}catch{}}
 if(diagnostic.status==='fulfilled'&&diagnostic.value){
  try{
   const d=JSON.parse(diagnostic.value),messages:Record<string,string>={captured:'已命中过请求，但授权记录不完整，请重开微信乘车码页面再试。','missing-auth':'已命中公交请求，但没有登录 Token；请先在微信武胜公交完成正常登录。','missing-user':'已命中公交请求，但没有用户标识；请重新进入微信乘车码或消费记录页面。','invalid-body':'已命中请求，字段暂未识别，请更新抓取订阅后重试。','login-unready':'已命中登录响应，但授权尚未完整，请在微信完成登录。','save-failed':'已命中完整授权，但圈 X 保存失败，请检查圈 X 的本地存储。'}
   if(messages[d?.state])return messages[d.state]+(typeof d.version==='string'&&/^0\.\d+\.\d+$/.test(d.version)?' 抓取脚本 '+d.version:'')
  }catch{}
 }
 if(record.status==='rejected')throw record.reason
 if(diagnostic.status==='rejected')throw diagnostic.reason
 return '尚未命中业务请求。请更新抓取订阅并启用重写、MITM，确认主机名为 wsapi.wskyzx.com（不带端口），证书已安装并信任；关闭微信后台后重开小程序，点击乘车码或消费记录。'
}
export async function loginFromBoxJS(host=boxHost()){
 host=host.trim()
 const previous=readAccount(),raw=await boxValue(host,BOX_KEY)
 if(!raw)throw Error('还没有抓到登录授权，请点击“检查抓取状态”，或重新进入微信乘车码/消费记录页面')
 const account=capturedAccount(raw)
 const card=await balance(account)
 if(!unchanged(previous,readAccount()))throw Error('账号已变化，请重新点击导入登录')
 saveAccount(account);Storage.set('wusheng.bus.balance',card);Storage.set(HOST_KEY,host)
 return card
}

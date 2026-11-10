import { fetch } from 'scripting'
import { queryUnicomCookie } from './unicom-cookie'
import { endpoint, normalize, safeRequest, names } from './normalizers.js'
import { loadAccount as loadMobile, listAccounts as mobileAccounts, importFromBoxJS as importMobile, removeAccount as removeMobile, clearCache as clearMobileCache } from './mobile/api'
export type Provider = 'cmcc' | 'unicom' | 'telecom' | 'broadnet'
export type Metrics = {provider:Provider; balance?:number; flowMB?:number; voice?:number; fetchedAt:number}
export type CarrierRecord = {metrics:Metrics;request:any;queryReady:boolean}
export type CarrierState = {provider:Provider;metrics?:Metrics;message?:string;stale?:boolean}
const UNICOM_COOKIE='carrier.hub.unicom.cookie.v1'
const CREDENTIALS='carrier.hub.credentials.v1'
const SETTINGS='carrier.hub.settings.v1'
const store=Storage as unknown as {get<T>(k:string):T|null;set(k:string,v:unknown):void}
export const providerNames=names as Record<Provider,string>
export const providerIds:Provider[]=['cmcc','unicom','telecom','broadnet']
export function preferences():{host:string;refresh:number} {
 try{return {...{host:'boxjs.com',refresh:120},...JSON.parse(store.get<string>(SETTINGS)||'{}')}}catch{return {host:'boxjs.com',refresh:120}}
}
export function savePreferences(host:string,refresh:number){
 if(!/^(?:boxjs\.com|boxjs\.net)$/.test(host.trim()))throw Error('请选择 boxjs.com 或 boxjs.net')
 store.set(SETTINGS,JSON.stringify({host:host.trim(),refresh:[30,60,120,240].includes(refresh)?refresh:120}))
}
function read():Partial<Record<Provider,CarrierRecord>> {try{return JSON.parse(Keychain.get(CREDENTIALS)||'{}')}catch{return {}}}
function write(v:Partial<Record<Provider,CarrierRecord>>){Keychain.set(CREDENTIALS,JSON.stringify(v))}
export function forget(p:Provider){if(p==='cmcc'){for(const tel of mobileAccounts())removeMobile(tel)}else{const x=read();delete x[p];write(x);if(p==='unicom')Keychain.remove(UNICOM_COOKIE)}}
function validMetrics(p:Provider,m:any):m is Metrics {
 return m&&m.provider===p&&typeof m.fetchedAt==='number'&&Number.isFinite(m.fetchedAt)&&['balance','flowMB','voice'].some(k=>typeof m[k]==='number'&&Number.isFinite(m[k]))
}
export async function importAll(hostOverride?:string):Promise<string>{
 const host=hostOverride?.trim()||preferences().host
 if(!/^(?:boxjs\.com|boxjs\.net)$/.test(host))throw Error("请选择 boxjs.com 或 boxjs.net")
 let mobileMessage='',otherMessage=''
 try{const ids=await importMobile(host);mobileMessage=`移动 ${ids.length} 个账号`}catch{mobileMessage='移动未导入（未抓取或 BoxJS 不可达）'}
 try{
  const res=await fetch(`https://${host}/query/data/carrier_hub_v1`)
  if(!res.ok)throw Error('BoxJS 查询失败')
  const envelope=await res.json() as {val?:string}
  const raw=JSON.parse(envelope.val||'{}')
  if(raw.version!==1||!raw.accounts)throw Error('没有新抓取的数据')
  const records=read();const imported: string[]=[]
  for(const p of ['unicom','telecom','broadnet'] as Provider[]){
   if(p==='unicom'&&Keychain.get(UNICOM_COOKIE))continue
   const r=raw.accounts[p];if(!r||!validMetrics(p,r.metrics))continue
   const request=safeRequest(r.request)
   if(request&&endpoint(request.url)!==p)continue
   records[p]={metrics:r.metrics,request,queryReady:!!request&&(request.method==='GET'||!!request.body)};imported.push(providerNames[p])
  }
  if(!imported.length)throw Error('没有可导入的数据')
  write(records);otherMessage=`已导入：${imported.join('、')}`
 }catch{otherMessage='原查询快照未导入：请确认 BoxJS 可用，并用配套订阅重新抓取查询响应'}
 let cookieMessage=''
 try{
  const r=await fetch(`https://${host}/query/data/10010.cookie`)
  const data=r.ok?await r.json() as {val?:unknown}:{}
  const cookie=typeof data.val==='string'?data.val.trim():''
  if(cookie&&cookie.length<=32768&&!/[\r\n]/.test(cookie)){
   const previous=Keychain.get(UNICOM_COOKIE)
   if(previous!==cookie){const records=read();delete records.unicom;write(records)}
   Keychain.set(UNICOM_COOKIE,cookie)
   const result=await loadProvider('unicom',true)
   cookieMessage=result.metrics&&!result.stale?'联通 riskSync Cookie 已导入并查到数据':'联通 riskSync Cookie 已导入；余量查询尚未成功'
  }
 }catch{}
 let diagnostics=''
 try{
  const res=await fetch(`https://${host}/query/data/carrier_hub_diagnostics_v1`)
  if(res.ok){
   const data=await res.json() as {val?:string};const parsed=JSON.parse(data.val||'{}')
   const labels:Record<string,string>={'request-seen':'请求已命中，尚无可解析响应','nearby-query':'看到了业务流量，但接口未适配','http-error':'接口返回失败','schema-mismatch':'响应未适配或会话失效','saved':'已保存查询数据'}
   const rows=(['unicom','telecom','broadnet'] as Provider[]).flatMap(p=>{
    const stage=parsed?.providers?.[p]?.stage
    return labels[stage]?[`${providerNames[p]}：${labels[stage]}`]:[]
   })
   if(rows.length)diagnostics='\n抓取诊断：\n'+rows.join('\n')
  }
 }catch{}
 return mobileMessage+'；'+otherMessage+(cookieMessage?'\n'+cookieMessage:'')+diagnostics
}
export async function loadProvider(p:Provider,force=false):Promise<CarrierState>{
 if(p==='cmcc'){
  if(force)clearMobileCache()
  try{const a=await loadMobile();return {provider:p,metrics:{provider:p,balance:a.balance,flowMB:a.general?.remainMB,voice:a.voice?.remain,fetchedAt:a.fetchedAt},stale:a.stale}}
  catch{return {provider:p,message:'请抓取移动登录凭据，再从 BoxJS 导入'}}
 }
 const all=read(),record=all[p]
 if(p==='unicom'){
  const cookie=Keychain.get(UNICOM_COOKIE)
  if(cookie){
   if(record&&!force&&Date.now()-record.metrics.fetchedAt<300000)return {provider:p,metrics:record.metrics}
   try{
    const metrics=await queryUnicomCookie(cookie);const saved=read();saved.unicom={metrics,request:null,queryReady:false};write(saved)
    return {provider:p,metrics}
   }catch{return {provider:p,metrics:record?.metrics,stale:!!record,message:'联通 Cookie 已导入，但查询失败；请重新抓取或检查接口兼容性'}}
  }
 }
 if(!record)return {provider:p,message:'尚未导入，请开启抓取后刷新官方 App'}
 if(!record.queryReady)return {provider:p,metrics:record.metrics,stale:true,message:'查询快照：刷新官方 App 后重新导入以更新'}
 if(!force&&Date.now()-record.metrics.fetchedAt<300000)return {provider:p,metrics:record.metrics}
 try{
  const req=safeRequest(record.request)
  if(!req||endpoint(req.url)!==p)throw Error('查询地址不匹配')
  const res=await fetch(req.url,{method:req.method,headers:req.headers,...(req.method==='POST'?{body:req.body}:{}),redirect:'error'})
  if(!res.ok)throw Error('请求失败')
  const metrics=normalize(p,await res.json()) as Metrics
  const latest=read();latest[p]={...record,metrics};write(latest)
  return {provider:p,metrics}
 }catch{return {provider:p,metrics:record.metrics,stale:true,message:'查询失败，显示上次数据；请重新抓取并导入'}}
}
export async function loadAll(force=false){return Promise.all(providerIds.map(p=>loadProvider(p,force)))}
export function value(n:number|undefined,unit:string){return typeof n==='number'&&Number.isFinite(n)?(unit==='元'?n.toFixed(2):n.toFixed(n%1?2:0))+' '+unit:'—'}
export function flowValue(n:number|undefined){return n===undefined?'—':Math.abs(n)>=1024?value(n/1024,'GB'):value(n,'MB')}
export function timeValue(n:number|undefined){return n?new Date(n).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}):'尚无数据'}

export const carrierStyles = ['全景', '账单卡', '大字余额'] as const
export type CarrierStyle = typeof carrierStyles[number]
const STYLE_KEY='carrier.hub.styles.v1'
export function getCarrierStyle(provider:Provider):CarrierStyle {
 try{const saved=JSON.parse(store.get<string>(STYLE_KEY)||'{}')[provider];return carrierStyles.includes(saved)?saved:'全景'}catch{return '全景'}
}
export function setCarrierStyle(provider:Provider,style:CarrierStyle){
 if(!providerIds.includes(provider)||!carrierStyles.includes(style))throw Error('不支持的运营商样式')
 let saved:Record<string,string>={};try{saved=JSON.parse(store.get<string>(STYLE_KEY)||'{}')}catch{}
 store.set(STYLE_KEY,JSON.stringify({...saved,[provider]:style}))
}

export function importedProviders():Provider[]{
 const saved=read()
 return providerIds.filter(p=>p==='cmcc'?mobileAccounts().length>0:!!saved[p]?.metrics)
}

import * as Scripting from 'scripting'
import { fetch } from 'scripting'
import JSONBig from './vendor/json-bigint.js'
import { readAccount,type Account } from './account'
import { normalizeLines,normalizeStations,normalizeAccount,arrivals,sameChoice,reportedPlate,type Choice,type Station } from './model'
const parse=JSONBig({storeAsString:true,protoAction:'ignore',constructorAction:'ignore'}).parse
const API='https://wsapi.wskyzx.com:26110'
const paths=new Set(['/api/AppBusiness/GetBusLine','/api/AppBusiness/GetBusLineStationsByLId','/api/WechatInfo/GetUserInfo','/api/AppBusiness/GetBusStations','/api/AppBusiness/GetPayRrcode','/api/AppBusiness/GetConsumedAndRechargeRecord'])
export async function post(path:string,data:any,account?:Account,timeout=8){
 if(!paths.has(path))throw Error('不支持此查询')
 try{const r=await fetch(API+path,{method:'POST',headers:{'Content-Type':'application/json',...(account?{Authorization:account.authorization}:{})},body:JSON.stringify(data),redirect:'error',...(path==='/api/AppBusiness/GetPayRrcode'?{}:{timeout})});if(!r.ok)throw Error();return parse(await r.text())}catch{throw Error('公交网络查询失败，请稍后重试')}
}
export async function loadLines(){return normalizeLines(await post('/api/AppBusiness/GetBusLine',{pageIndex:1,pageSize:100}))}
const stationFlights=new Map<string,Promise<Station[]>>()
export async function loadStations(lineId:string,direction:number){
 if(!/^\d+$/.test(lineId)||![1,2].includes(direction))throw Error('线路方向无效')
 const key='wusheng.bus.stations.v1.'+lineId+':'+direction,cached=Storage.get<{time:number;rows:Station[]}>(key),age=cached?Date.now()-cached.time:Infinity
 if(cached&&age>=0&&age<300000&&Array.isArray(cached.rows)&&cached.rows.length)return cached.rows
 if(stationFlights.has(key))return stationFlights.get(key)!
 const work=post('/api/AppBusiness/GetBusLineStationsByLId',{lineId,direction}).then(body=>{const rows=normalizeStations(body);if(rows.length)Storage.set(key,{time:Date.now(),rows});return rows}).finally(()=>stationFlights.delete(key))
 stationFlights.set(key,work);return work
}
export async function balance(a=readAccount(),options:{timeout?:number}={}){if(!a)throw Error('请先到账号页从 BoxJS 导入登录');const result=normalizeAccount(await post('/api/WechatInfo/GetUserInfo',{userId:a.userId},a,options.timeout??8));const owner=readAccount();if(owner?.authorization===a.authorization&&owner?.userId===a.userId)Storage.set('wusheng.bus.balance',result);return result}
export function choice():Choice|undefined{return Storage.get<Choice>('wusheng.bus.choice')||undefined}
export function saveChoice(c:Choice){Storage.set('wusheng.bus.choice',c);Storage.set('wusheng.bus.arrival',null)}
export type BusSnapshot={choice:Choice;items:ReturnType<typeof arrivals>;vehicleCount?:number;vehiclePlate?:string;time:number;stale?:boolean;message?:string}
export function vehicles(lineId:string,direction:number){return vehicleBatch([{lineId,upOrDown:direction}])}
type ConnectionStage='unavailable'|'connecting'|'connected'|'received'|'connect_timeout'|'response_timeout'|'invalid_response'|'send_error'|'network_error'|'closed'
type ConnectionStatus={stage:ConnectionStage;source:'global'|'module'|'none';time:number;connected:boolean;messages:number;durationMs:number;networkCode?:string}
const CONNECTION_KEY='wusheng.bus.vehicle.connection.v1'
export function vehicleConnectionStatus():ConnectionStatus|undefined{try{return Storage.get<ConnectionStatus>(CONNECTION_KEY)||undefined}catch{return undefined}}
function vehicleText(message:any):string|undefined{
 const data=message&&typeof message==='object'&&'data' in message?message.data:message
 if(typeof data==='string')return data
 if(data&&typeof data.toRawString==='function'){const text=data.toRawString('utf-8');if(typeof text==='string')return text}
 return undefined
}
type VehicleQuery={lineId:string;upOrDown:number}
const vehicleCache=new Map<string,{time:number;rows:any[]}>(),vehicleFlights=new Map<string,Promise<any[]>>()
export async function vehicleBatch(queries:VehicleQuery[],fresh=false):Promise<any[]>{
 const unique=[...new Map(queries.map(q=>[q.lineId+':'+q.upOrDown,q])).entries()],missing:VehicleQuery[]=[],waiting=new Map<string,Promise<any[]>>()
 for(const [key,q] of unique){
  const cached=vehicleCache.get(key),age=cached?Date.now()-cached.time:Infinity
  if(!fresh&&cached&&age>=0&&age<3000)waiting.set(key,Promise.resolve(cached.rows))
  else if(!fresh&&vehicleFlights.has(key))waiting.set(key,vehicleFlights.get(key)!)
  else missing.push(q)
 }
 if(missing.length){
  const batch=queryVehicleBatch(missing)
  for(const q of missing){
   const key=q.lineId+':'+q.upOrDown
   const work=batch.then(rows=>{const selected=rows.filter(v=>String(v.lineId)===q.lineId&&Number(v.bizType??v.upOrDown)===q.upOrDown);vehicleCache.set(key,{time:Date.now(),rows:selected});return selected}).finally(()=>{if(vehicleFlights.get(key)===work)vehicleFlights.delete(key)})
   vehicleFlights.set(key,work);waiting.set(key,work)
  }
 }
 return (await Promise.all(unique.map(([key])=>waiting.get(key)!))).flat()
}
function queryVehicleBatch(queries:VehicleQuery[]):Promise<any[]>{
 if(!queries.length)return Promise.resolve([])
 return new Promise((resolve,reject)=>{
  const native=(globalThis as any).WebSocket,exported=(Scripting as any).WebSocket,Socket=typeof native==='function'?native:typeof exported==='function'?exported:undefined
  const start=Date.now(),status:ConnectionStatus={stage:'connecting',source:Socket?Socket===native?'global':'module':'none',time:start,connected:false,messages:0,durationMs:0}
  let settled=false,ws:any,timer:ReturnType<typeof setTimeout>|undefined
  const finish=(stage:ConnectionStage,rows?:any[],error?:any)=>{
   if(settled)return;settled=true;if(timer!==undefined)clearTimeout(timer)
   const code=String(error?.message||'').match(/\b(-1\d{3})\b/)?.[1]
   Object.assign(status,{stage,time:Date.now(),durationMs:Date.now()-start,...(code?{networkCode:code}:{})})
   try{Storage.set(CONNECTION_KEY,status)}catch{}
   try{ws?.close()}catch{}
   if(rows!==undefined){resolve(rows);return}
   const reason=stage==='unavailable'?'实时车辆接口不可用，请更新 Scripting':stage==='connect_timeout'?'实时车辆连接超时（尚未连上服务器）':stage==='response_timeout'?'实时车辆等待数据超时（已连接服务器）':stage==='invalid_response'?'实时车辆数据格式暂不兼容':stage==='send_error'?'实时车辆订阅发送失败':stage==='closed'?'实时车辆连接被关闭':'实时车辆连接失败（网络或TLS错误'+(code?' '+code:'')+'）'
   reject(Error(reason))
  }
  if(!Socket){finish('unavailable');return}
  timer=setTimeout(()=>finish('connect_timeout'),12000)
  try{
   ws=new Socket('wss://wsdata.wskyzx.com:25790/ws')
   ws.onopen=()=>{if(settled||status.connected)return;status.connected=true;clearTimeout(timer);timer=setTimeout(()=>finish(status.messages?'invalid_response':'response_timeout'),10000);try{ws.send(JSON.stringify(queries))}catch(e){finish('send_error',undefined,e)}}
   ws.onmessage=(message:any)=>{if(settled)return;status.messages++;try{const text=vehicleText(message);if(text===undefined)return;const data=parse(text);if(Array.isArray(data))finish('received',data)}catch{}}
   ws.onerror=(e:any)=>finish('network_error',undefined,e)
   ws.onclose=()=>finish('closed')
  }catch(e){finish('network_error',undefined,e)}
 })
}
export async function checkTransitConnection(){
 try{
  const lines=await loadLines(),line=lines.find(l=>/^101(?:路)?$/.test(l.name))||lines[0]
  if(!line)return '线路接口已连接，但未返回可测试的线路'
  const rows=await vehicleBatch([1,2].map(upOrDown=>({lineId:line.id,upOrDown})),true)
  return '线路接口正常；'+line.name+'车辆通道已连接，返回 '+rows.length+' 条车辆记录（两方向）'
 }catch(e){return (e as Error).message}
}
export async function current():Promise<BusSnapshot|undefined>{
 const c=choice();if(!c)return undefined
 try{const [stations,rows]=await Promise.all([loadStations(c.line.id,c.direction),vehicles(c.line.id,c.direction)]);if(!sameChoice(c,choice()))return undefined;const result={choice:c,items:arrivals(rows,c,stations),vehiclePlate:reportedPlate(rows,c),vehicleCount:rows.filter(v=>String(v.lineId)===c.line.id&&Number(v.bizType??v.upOrDown)===c.direction).length,time:Date.now()};Storage.set('wusheng.bus.arrival',result);return result}
 catch{if(!sameChoice(c,choice()))return undefined;const previous=Storage.get<BusSnapshot>('wusheng.bus.arrival');return previous&&sameChoice(previous.choice,c)?{...previous,stale:true,message:'网络失败，上次数据'}:{choice:c,items:[],time:Date.now(),stale:true,message:'实时通道暂不可用'}}
}

import { fetch, WebSocket } from 'scripting'
import JSONBig from './vendor/json-bigint.js'
import { readAccount,type Account } from './account'
import { normalizeLines,normalizeStations,normalizeAccount,arrivals,type Choice,type Station } from './model'
const parse=JSONBig({storeAsString:true,protoAction:'ignore',constructorAction:'ignore'}).parse
const API='https://wsapi.wskyzx.com:26110'
const paths=new Set(['/api/AppBusiness/GetBusLine','/api/AppBusiness/GetBusLineStationsByLId','/api/WechatInfo/GetUserInfo','/api/AppBusiness/GetBusStations','/api/AppBusiness/GetPayRrcode','/api/AppBusiness/GetConsumedAndRechargeRecord'])
export async function post(path:string,data:any,account?:Account){
 if(!paths.has(path))throw Error('不支持此查询')
 try{const r=await fetch(API+path,{method:'POST',headers:{'Content-Type':'application/json',...(account?{Authorization:account.authorization}:{})},body:JSON.stringify(data),redirect:'error'});if(!r.ok)throw Error();return parse(await r.text())}catch{throw Error('公交网络查询失败，请稍后重试')}
}
export async function loadLines(){return normalizeLines(await post('/api/AppBusiness/GetBusLine',{pageIndex:1,pageSize:100}))}
export async function loadStations(lineId:string,direction:number){if(!/^\d+$/.test(lineId)||![1,2].includes(direction))throw Error('线路方向无效');return normalizeStations(await post('/api/AppBusiness/GetBusLineStationsByLId',{lineId,direction}))}
export async function balance(a=readAccount()){if(!a)throw Error('请先到账号页从 BoxJS 导入登录');const result=normalizeAccount(await post('/api/WechatInfo/GetUserInfo',{userId:a.userId},a));const owner=readAccount();if(owner?.authorization===a.authorization&&owner?.userId===a.userId)Storage.set('wusheng.bus.balance',result);return result}
export function choice():Choice|undefined{return Storage.get<Choice>('wusheng.bus.choice')||undefined}
export function saveChoice(c:Choice){Storage.set('wusheng.bus.choice',c);Storage.set('wusheng.bus.arrival',null)}
export type BusSnapshot={choice:Choice;items:ReturnType<typeof arrivals>;time:number;stale?:boolean;message?:string}
export function vehicles(lineId:string,direction:number){return vehicleBatch([{lineId,upOrDown:direction}])}
export function vehicleBatch(queries:{lineId:string;upOrDown:number}[]):Promise<any[]>{
 return new Promise((resolve,reject)=>{
  let settled=false,ws:WebSocket|undefined
  const finish=(rows?:any[])=>{if(settled)return;settled=true;clearTimeout(timer);try{ws?.close()}catch{};rows?resolve(rows):reject(Error('实时车辆通道暂不可用'))}
  const timer=setTimeout(()=>finish(),6500)
  try{ws=new WebSocket('wss://wsdata.wskyzx.com:25790/ws');ws.onopen=()=>{try{ws!.send(JSON.stringify(queries))}catch{finish()}};ws.onmessage=message=>{if(typeof message!=='string')return;try{const d=parse(message);if(Array.isArray(d))finish(d)}catch{}};ws.onerror=()=>finish();ws.onclose=()=>finish()}catch{finish()}
 })
}
export async function current():Promise<BusSnapshot|undefined>{
 const c=choice();if(!c)return undefined
 try{const [stations,rows]=await Promise.all([loadStations(c.line.id,c.direction),vehicles(c.line.id,c.direction)]);const result={choice:c,items:arrivals(rows,c,stations),time:Date.now()};Storage.set('wusheng.bus.arrival',result);return result}
 catch{const previous=Storage.get<BusSnapshot>('wusheng.bus.arrival');return previous&&previous.choice.line.id===c.line.id&&previous.choice.direction===c.direction&&previous.choice.station.id===c.station.id?{...previous,stale:true,message:'网络失败，上次数据'}:{choice:c,items:[],time:Date.now(),stale:true,message:'实时通道暂不可用'}}
}

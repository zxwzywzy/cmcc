export type Line={id:string;name:string;start:string;end:string}
export type Station={id:string;name:string;no:number;distance?:number;latitude?:number;longitude?:number}
export type Choice={line:Line;direction:number;station:Station;destination?:string}
export function sameChoice(a:Choice|undefined,b:Choice|undefined){return !!a&&!!b&&a.line.id===b.line.id&&a.direction===b.direction&&a.station.id===b.station.id&&a.station.no===b.station.no}
export type Arrival={stops:number;minutes?:number;atStation:boolean}
export function estimateLabel(a:Arrival|undefined,live=true){
 if(!live)return '预计时间待更新'
 if(!a)return '暂无车辆'
 if(a.atStation)return '已到站'
 if(a.stops===0)return '本站附近'
 return a.minutes!==undefined&&Number.isFinite(a.minutes)&&a.minutes>0?'预计 '+a.minutes+' 分钟':'预计时间待更新'
}
export function stationProgress(a:Arrival|undefined,target:number,live=true){return live&&a&&target>1&&a.stops>=0&&a.stops<target?Math.max(0,Math.min(1,(target-1-a.stops)/(target-1))):undefined}
export function text(v:unknown){return typeof v==='string'?v:typeof v==='number'?String(v):''}
export function finite(v:unknown):number|undefined{if(v===null||v===undefined||v===''||typeof v==='boolean')return undefined;const n=Number(v);return Number.isFinite(n)?n:undefined}
export function normalizeLines(body:any):Line[]{if(body?.code!==0||!Array.isArray(body?.data?.data))throw Error('线路查询未成功');return body.data.data.map((v:any)=>({id:text(v.lineId),name:text(v.lineName),start:text(v.startStations),end:text(v.endStations)})).filter((v:Line)=>/^\d+$/.test(v.id)&&v.name)}
export function normalizeStations(body:any):Station[]{if(body?.code!==0||!Array.isArray(body?.data?.data))throw Error('站点查询未成功');return body.data.data.map((v:any)=>({id:text(v.stationId),name:text(v.stationName),no:finite(v.stationNo),distance:finite(v.distance),latitude:finite(v.latitude),longitude:finite(v.longitude)})).filter((v:any)=>v.id&&v.name&&v.no!==undefined).sort((a:Station,b:Station)=>a.no-b.no)}
export function normalizeAccount(body:any){if(body?.code!==0||!body?.data||typeof body.data!=='object')throw Error('登录授权验证失败，请在微信刷新个人信息后重新抓取登录');const n=finite(body.data.cardCashfee);return {balance:n===undefined?undefined:n/100,cardTail:text(body.data.cardNo).slice(-4),fetchedAt:Date.now()}}
export function arrivals(rows:any[],choice:Choice,stations:Station[]):Arrival[]{
 const target=choice.station.no
 return rows.filter(v=>text(v.lineId)===choice.line.id&&Number(v.bizType??v.upOrDown)===choice.direction).flatMap(v=>{
  const no=finite(v.stationNo);if(no===undefined||no>target)return []
  const stops=target-no,atStation=stops===0&&Number(v.ioStation)===1
  let minutes:number|undefined
  const speed=finite(v.speed),segments=stations.filter(s=>s.no>no&&s.no<=target)
  if(stops>0&&speed!==undefined&&speed>0&&segments.length===stops&&segments.every(s=>s.distance!==undefined&&(s.distance as number)>=0)){const meters=segments.reduce((a,s)=>a+s.distance!,0);if(meters>0)minutes=Math.ceil(meters/(speed*1000/60))}
  return [{stops,atStation,minutes}]
 }).sort((a,b)=>a.stops-b.stops).slice(0,3)
}

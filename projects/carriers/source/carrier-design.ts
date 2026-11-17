import type { Provider, Metrics } from './hub'
export const CARRIER_STYLE_NAMES=['全景','自适应','账单卡','大字余额','今日额度','倒计时','用量预测','用量月报','多号翻页','双号对照','双号全景','四家总览'] as const
export type SharedCarrierStyle=typeof CARRIER_STYLE_NAMES[number]
export type CarrierFamily='systemSmall'|'systemMedium'|'systemLarge'
export const familyNames={systemSmall:'小号',systemMedium:'中号',systemLarge:'大号'}
export const identities:Record<Provider,{short:string;symbol:string;ink:{light:string;dark:string};wash:{light:string;dark:string}}>={
 cmcc:{short:'移动',symbol:'antenna.radiowaves.left.and.right',ink:{light:'#125BB5',dark:'#83B8FF'},wash:{light:'#EAF2FF',dark:'#172C45'}},
 unicom:{short:'联通',symbol:'link',ink:{light:'#AF2438',dark:'#FF9CAC'},wash:{light:'#FFF0F2',dark:'#42202B'}},
 telecom:{short:'电信',symbol:'waveform.path',ink:{light:'#5040A3',dark:'#BDB0FF'},wash:{light:'#F0EDFF',dark:'#2C2549'}},
 broadnet:{short:'广电',symbol:'dot.radiowaves.left.and.right',ink:{light:'#0B6B52',dark:'#7CDDBD'},wash:{light:'#E9F7F1',dark:'#17382D'}},
}
export function resolveCarrierStyle(value:unknown):SharedCarrierStyle{
 return CARRIER_STYLE_NAMES.includes(value as SharedCarrierStyle)?value as SharedCarrierStyle:'全景'
}
export function ratio(remain:unknown,total:unknown):number|undefined {
 return typeof remain==='number'&&Number.isFinite(remain)&&typeof total==='number'&&Number.isFinite(total)&&total>0?Math.max(0,Math.min(100,remain/total*100)):undefined
}
export type UsageSample={time:number;flow?:number;voice?:number}
const store=Storage as unknown as {get<T>(key:string):T|null;set(key:string,value:unknown):void}
const key=(p:Provider)=>'carrier.hub.usage.v1.'+p
export function rememberUsage(m:Metrics){
 const list=store.get<UsageSample[]>(key(m.provider))||[]
 const item:UsageSample={time:m.fetchedAt,flow:m.flowMB,voice:m.voice}
 if(!Number.isFinite(item.time)||list.some(x=>x.time===item.time))return
 const sorted=[...list,item].filter(x=>x.time>=Date.now()-62*86400000).sort((a,b)=>a.time-b.time)
 // Bound local, non-credential history. Keep at most one sample per 20-minute window.
 const clean:UsageSample[]=[]
 for(const x of sorted){if(clean.length&&x.time-clean[clean.length-1].time<1200000)clean.pop();clean.push(x)}
 store.set(key(m.provider),clean.slice(-4500))
}
export function clearUsage(p:Provider){store.set(key(p),[])}
function day(t:number){const d=new Date(t);return [d.getFullYear(),d.getMonth(),d.getDate()].join('-')}
export function usage(p:Provider){
 const list=store.get<UsageSample[]>(key(p))||[]
 const days=new Map<string,UsageSample>();for(const x of list)days.set(day(x.time),x)
 const ends=[...days.values()].sort((a,b)=>a.time-b.time)
 const daily=(count:number)=>Array.from({length:count},(_,i)=>{
  const target=day(Date.now()-(count-1-i)*86400000),end=ends.find(x=>day(x.time)===target)
  if(!end)return null
  const prev=[...ends].reverse().find(x=>x.time<new Date(new Date(end.time).setHours(0,0,0,0)).getTime())
  return prev?.flow!==undefined&&end.flow!==undefined&&prev.flow>=end.flow?prev.flow-end.flow:null
 })
 const todaySamples=list.filter(x=>day(x.time)===day(Date.now()))
 const first=todaySamples[0]?.flow,last=todaySamples[todaySamples.length-1]?.flow
 const today=first!==undefined&&last!==undefined&&todaySamples.length>1&&first>=last?first-last:null
 const values=daily(8).slice(0,7).filter((v):v is number=>v!==null)
 return {days:days.size,daily,today,average:values.length>=2?values.reduce((a,b)=>a+b,0)/values.length:null}
}

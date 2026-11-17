import { estimateLabel,type Arrival } from './model'

// Keep the compact row and the large arrival number on the same decision path.
export function widgetArrival(a:Arrival|undefined,live:boolean,count=0){
 if(!live)return {eta:'到站待更新'}
 if(a&&!a.atStation&&Number.isInteger(a.stops)&&a.stops>0){
  const m=a.minutes
  if(m!==undefined&&Number.isFinite(m)&&m>0)return {eta:`预计 ${m} 分钟`,minutes:m}
  return {eta:`还剩 ${a.stops} 站`}
 }
 return {eta:a&&!a.atStation&&a.stops!==0?'到站待更新':estimateLabel(a,true,count)}
}

export function lastUpdate(time?:number,now=Date.now()){
 if(!time||!Number.isFinite(time)||time<0||time>now)return '上次更新时间未知'
 const date=new Date(time),today=new Date(now)
 const day=date.toDateString()===today.toDateString()?'':`${date.getMonth()+1}/${date.getDate()} `
 return '上次更新 '+day+date.toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})
}

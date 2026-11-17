type Period=[number,number] // Local minutes since midnight, [start,end).
export type Periods=[Period,Period]
export type WidgetRuntime={enabled:boolean;mode:'manual'|'commute'|'always';days:number[];periods:Periods}
const allDays=[1,2,3,4,5,6,0]
const defaultPeriods:Periods=[[420,540],[1020,1170]]
const validDay=(d:unknown)=>typeof d==='number'&&Number.isInteger(d)&&d>=0&&d<7
export function validPeriods(value:unknown):value is Periods{
 return Array.isArray(value)&&value.length===2&&value.every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isInteger)&&p[0]>=0&&p[0]<p[1]&&p[1]<=1440)
}
function schedule(value?:Partial<WidgetRuntime>|null){
 return {days:Array.isArray(value?.days)&&value.days.every(validDay)?allDays.filter(d=>value.days!.includes(d)):allDays.slice(),periods:validPeriods(value?.periods)?value.periods:defaultPeriods}
}
const KEY='wusheng.bus.widget.runtime.v3'
const PREVIOUS='wusheng.bus.widget.runtime.v2'
const LEGACY='wusheng.bus.widget.runtime.v1'
const LOCAL_UNTIL='wusheng.bus.widget.localUntil.v1'
const validMode=(mode:unknown):mode is WidgetRuntime['mode']=>mode==='manual'||mode==='commute'||mode==='always'

export function widgetRuntime():WidgetRuntime{
 const saved=Storage.get<Partial<WidgetRuntime>>(KEY),legacy=Storage.get<Partial<WidgetRuntime>>(PREVIOUS)||Storage.get<Partial<WidgetRuntime>>(LEGACY)
 if(saved)return {...schedule(saved),enabled:saved.enabled!==false,mode:validMode(saved.mode)?saved.mode:'always'}
 return {...schedule(),enabled:legacy?.enabled!==false,mode:legacy?.mode==='commute'?'commute':'always'}
}
export function saveWidgetRuntime(patch:Partial<WidgetRuntime>):WidgetRuntime{
 const previous=widgetRuntime()
 const next={...schedule({...previous,...patch}),enabled:typeof patch?.enabled==='boolean'?patch.enabled:previous.enabled,mode:validMode(patch?.mode)?patch.mode:previous.mode}
 Storage.set(KEY,next)
 return next
}
export function widgetAwake(settings=widgetRuntime(),now=new Date()):boolean{
 if(!settings.enabled)return false
 if(settings.mode==='always')return true
 const minutes=now.getHours()*60+now.getMinutes()
 return settings.mode==='commute'&&settings.days.includes(now.getDay())&&settings.periods.some(([start,end])=>minutes>=start&&minutes<end)
}
// reloadAll may render several widget sizes/stack slots. Keep all of those renders
// local after an intent, rather than consuming a one-widget refresh token.
export function noteWidgetInteraction(){Storage.set(LOCAL_UNTIL,Date.now()+5000)}
export function widgetReloadIsLocal(){const until=Storage.get<number>(LOCAL_UNTIL);return typeof until==='number'&&until>Date.now()&&until<=Date.now()+5000}
export function widgetRefreshDate(settings:WidgetRuntime,nearby:boolean,now=new Date()){
 const active=widgetAwake(settings,now)
 let next=now.getTime()+(active?15000:settings.enabled&&settings.mode==='commute'?30*60000:6*60*60000)
 if(settings.enabled&&settings.mode==='commute'){
  // Use local calendar hours, including across midnight and daylight-saving changes.
  for(let day=0;day<=1;day++){
   const date=new Date(now.getFullYear(),now.getMonth(),now.getDate()+day)
   if(!settings.days.includes(date.getDay()))continue
   for(const period of settings.periods)for(const minute of period){
    const boundary=new Date(date);boundary.setHours(Math.floor(minute/60),minute%60,0,0)
    if(boundary.getTime()>now.getTime())next=Math.min(next,boundary.getTime())
   }
  }
 }
 return new Date(next)
}

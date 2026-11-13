export type WidgetRuntime={enabled:boolean;mode:'manual'|'commute'|'always'}
const KEY='wusheng.bus.widget.runtime.v3'
const PREVIOUS='wusheng.bus.widget.runtime.v2'
const LEGACY='wusheng.bus.widget.runtime.v1'
const LOCAL_UNTIL='wusheng.bus.widget.localUntil.v1'
const validMode=(mode:unknown):mode is WidgetRuntime['mode']=>mode==='manual'||mode==='commute'||mode==='always'

export function widgetRuntime():WidgetRuntime{
 const saved=Storage.get<Partial<WidgetRuntime>>(KEY),legacy=Storage.get<Partial<WidgetRuntime>>(PREVIOUS)||Storage.get<Partial<WidgetRuntime>>(LEGACY)
 if(saved)return {enabled:saved.enabled!==false,mode:validMode(saved.mode)?saved.mode:'always'}
 return {enabled:legacy?.enabled!==false,mode:legacy?.mode==='commute'?'commute':'always'}
}
export function saveWidgetRuntime(patch:Partial<WidgetRuntime>):WidgetRuntime{
 const previous=widgetRuntime()
 const next={enabled:typeof patch?.enabled==='boolean'?patch.enabled:previous.enabled,mode:validMode(patch?.mode)?patch.mode:previous.mode}
 Storage.set(KEY,next)
 return next
}
export function widgetAwake(settings=widgetRuntime(),now=new Date()):boolean{
 if(!settings.enabled)return false
 if(settings.mode==='always')return true
 const minutes=now.getHours()*60+now.getMinutes()
 return settings.mode==='commute'&&(minutes>=7*60&&minutes<9*60||minutes>=17*60&&minutes<19*60+30)
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
  for(let day=0;day<=1;day++)for(const [hour,minute] of [[7,0],[9,0],[17,0],[19,30]]){
   const boundary=new Date(now.getTime());boundary.setDate(boundary.getDate()+day);boundary.setHours(hour,minute,0,0)
   if(boundary.getTime()>now.getTime())next=Math.min(next,boundary.getTime())
  }
 }
 return new Date(next)
}

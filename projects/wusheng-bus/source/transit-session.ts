import { nearbyCurrent,cachedNearby,type NearbySnapshot } from './nearby'
import { loadRouteDetail,type RouteDetail } from './transit'
import type { RouteRequest } from './route-links'
export const LIVE_INTERVAL=15000
export type TransitState={snapshot?:NearbySnapshot;detail?:RouteDetail;loading:boolean;message:string}
export function createTransitSession(updated:(state:TransitState)=>void=()=>{}){
 let state:TransitState={snapshot:cachedNearby(),loading:false,message:''},active=false,foreground=true,disposed=false,inFlight=false,pending=false,epoch=0,wanted:RouteRequest|undefined,timer:ReturnType<typeof setTimeout>|undefined
 const listeners=new Set<(s:TransitState)=>void>(),clear=()=>{if(timer!==undefined)clearTimeout(timer);timer=undefined}
 const emit=(next:TransitState)=>{state=next;for(const listener of listeners)listener({...state})}
 const ready=()=>active&&foreground&&!disposed
 function schedule(delay:number){clear();if(ready())timer=setTimeout(()=>{timer=undefined;refresh()},delay)}
 async function refresh(){
  if(!ready())return
  if(inFlight){pending=true;return}
  clear();inFlight=true;pending=false;const current=epoch,start=Date.now(),request=wanted
  emit({...state,loading:true,message:''})
  try{
   const initial=state.snapshot,valid=()=>current===epoch&&ready()
   let nearError='',routeError='',snapshot:NearbySnapshot|undefined,detail:RouteDetail|undefined
   const nearWork=nearbyCurrent({enable:true}).then(value=>{
    snapshot=value;if(!valid())return
    emit({...state,snapshot:value,message:routeError||value?.message||''})
    if(value&&!value.stale)updated({...state})
   }).catch(e=>{nearError=(e as Error).message;if(valid())emit({...state,snapshot:state.snapshot?{...state.snapshot,stale:true}:undefined,message:routeError||nearError})})
   const routeWork=request?loadRouteDetail(request,initial).then(value=>{
    detail=value;if(!valid())return
    routeError=value.stale?value.message||'车辆位置未更新':''
    emit({...state,detail:value,message:routeError||nearError||state.snapshot?.message||''})
    if(!value.stale)updated({...state})
   }).catch(e=>{routeError=(e as Error).message;if(valid())emit({...state,detail:state.detail?{...state.detail,stale:true,message:routeError}:undefined,message:routeError})}):Promise.resolve()
   await Promise.all([nearWork,routeWork])
   if(!valid())return
   if(request&&detail&&!detail.stop&&snapshot?.position&&!request.stationId&&request.stationNo===undefined){
    try{
     detail=await loadRouteDetail(request,snapshot)
     if(!valid())return
     routeError=detail.stale?detail.message||'车辆位置未更新':''
     emit({...state,detail,message:routeError||nearError||snapshot.message||''})
     if(!detail.stale)updated({...state})
    }catch(e){if(valid())routeError=(e as Error).message}
   }
   emit({...state,loading:false,message:routeError||nearError||state.snapshot?.message||''})
  }catch(e){if(current===epoch&&ready())emit({...state,snapshot:state.snapshot?{...state.snapshot,stale:true}:undefined,detail:state.detail?{...state.detail,stale:true}:undefined,loading:false,message:(e as Error).message})}
  finally{inFlight=false;if(ready())schedule(pending||current!==epoch?0:Math.max(0,LIVE_INTERVAL-(Date.now()-start)))}
 }
 return {
  getState:()=>({...state}),subscribe(listener:(s:TransitState)=>void){listeners.add(listener);return()=>{listeners.delete(listener)}},
  setActive(value:boolean){if(active===value)return;active=value;epoch++;clear();if(ready())refresh();else emit({...state,loading:false})},
  setForeground(value:boolean){if(foreground===value)return;foreground=value;epoch++;clear();if(ready())refresh();else emit({...state,loading:false})},
  selectRoute(value?:RouteRequest){wanted=value;epoch++;clear();emit({...state,detail:undefined,message:''});if(ready())refresh()},
  refresh,
  dispose(){disposed=true;active=false;epoch++;clear();listeners.clear();state={loading:false,message:''}},
 }
}
export type TransitSession=ReturnType<typeof createTransitSession>

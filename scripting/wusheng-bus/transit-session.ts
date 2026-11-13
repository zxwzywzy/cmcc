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
   const snapshot=await nearbyCurrent({enable:true,force:true})
   if(current!==epoch||!ready())return
   let detail:RouteDetail|undefined,routeError=''
   if(request){try{detail=await loadRouteDetail(request,snapshot)}catch(e){routeError=(e as Error).message;if(state.detail&&state.detail.request.lineId===request.lineId&&state.detail.direction===request.direction)detail={...state.detail,stale:true,message:routeError}}}
   if(current!==epoch||!ready())return
   emit({snapshot,detail,loading:false,message:routeError||(snapshot?.stale?snapshot.message||'暂未更新':'')})
   if(snapshot&&!snapshot.stale||detail&&!detail.stale)updated({...state})
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

import type {Trip} from './trip-planner'
export type VehicleBinding={vehicleId?:string;plate?:string}
export type ActiveTrip={trip:Trip;destination:string;legIndex:number;onBoard:boolean;expires:number;tripId?:string;vehicle?:VehicleBinding}
const KEY='wusheng.bus.activeTrip.v1'
const newId=()=>Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)

export function createTripStore(read:()=>ActiveTrip|undefined,write:(s:ActiveTrip|undefined)=>void){
  function readActiveTrip(){const s=read();return s&&s.expires>Date.now()&&s.trip?.legs?.[s.legIndex]?.choice?s:undefined}
  function current(previous:ActiveTrip){
    const s=readActiveTrip()
    return s&&s.tripId===previous.tripId&&s.expires===previous.expires&&s.legIndex===previous.legIndex&&s.onBoard===previous.onBoard&&
      (s.tripId||(s.destination===previous.destination&&JSON.stringify(s.trip)===JSON.stringify(previous.trip)))?s:undefined
  }
  function beginTrip(trip:Trip,destination:string){const s:ActiveTrip={tripId:newId(),trip,destination,legIndex:0,onBoard:false,expires:Date.now()+3*3600000};write(s);return s}
  function endTrip(){write(undefined)}
  function advanceTrip(previous:ActiveTrip){
    const s=current(previous);if(!s)return readActiveTrip()
    if(s.onBoard&&s.legIndex+1>=s.trip.legs.length){endTrip();return undefined}
    const next={...s,tripId:s.tripId||newId(),onBoard:!s.onBoard,legIndex:s.legIndex+(s.onBoard?1:0)}
    delete next.vehicle;write(next);return next
  }
  function bind(previous:ActiveTrip,vehicle:VehicleBinding){const s=current(previous);if(s?.onBoard&&!s.vehicle)write({...s,vehicle})}
  return {readActiveTrip,beginTrip,endTrip,advanceTrip,current,bind}
}
export const activeTripStore=createTripStore(()=>Storage.get<ActiveTrip>(KEY)||undefined,s=>{if(s)Storage.set(KEY,s);else Storage.remove(KEY)})
export const {readActiveTrip,beginTrip,endTrip,advanceTrip}=activeTripStore

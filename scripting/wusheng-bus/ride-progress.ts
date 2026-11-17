import { activeTripStore, type ActiveTrip, type VehicleBinding } from './active-trip'
import { loadStations, vehicleBatch } from './api'
import { text, vehiclePlate, type Station } from './model'
import type { Leg } from './trip-planner'

function integer(v:unknown){if(typeof v!=='number'&&(typeof v!=='string'||!/^\d+$/.test(v)))return undefined;const n=Number(v);return Number.isSafeInteger(n)&&n>=0?n:undefined}
function identity(v:any):VehicleBinding {
  const id=typeof v.vehicleId==='string'||Number.isSafeInteger(v.vehicleId)?text(v.vehicleId).trim():''
  return {vehicleId:id&&!/^(?:0+|-\d+|null|undefined|unknown|none|n\/a|-)$/i.test(id)?id:undefined,plate:vehiclePlate(v)}
}
function sameVehicle(rows:any[],key:VehicleBinding){
  const matches=rows.filter(v=>{const k=identity(v);return (key.vehicleId&&key.vehicleId===k.vehicleId)||(key.plate&&key.plate===k.plate)})
  if(matches.length!==1)return undefined
  const k=identity(matches[0]);return (!key.vehicleId||k.vehicleId===key.vehicleId)&&(!key.plate||k.plate===key.plate)?matches[0]:undefined
}
function credible(v:any){
  if(v.stale===true||v.valid===false||v.online===false)return false
  for(const t of [v.gpsTime,v.updateTime,v.timestamp])if(t!=null){
    const n=integer(t),ms=n===undefined?(typeof t==='string'?Date.parse(t):NaN):n<1e11?n*1000:n
    const age=Date.now()-ms;if(!Number.isFinite(age)||age<0||age>60000)return false
  }
  return true
}
function routeRows(rows:any[],l:Leg){return rows.filter(v=>v&&text(v.lineId)===l.choice.line.id&&integer(v.bizType??v.upOrDown)===l.choice.direction&&
  (v.upOrDown==null||integer(v.upOrDown)===l.choice.direction))}
function atStop(v:any,s:Station){return integer(v.stationNo)===s.no&&(v.stationId==null||text(v.stationId)===s.id)&&(v.stationName==null||v.stationName===s.name)}
function stationAt(rows:Station[],no:number){const hits=rows.filter(s=>s.no===no);return hits.length===1&&hits[0].id?hits[0]:undefined}

export function createRideProgress(store:typeof activeTripStore,live:(id:string,d:number)=>Promise<any[]>,stations:typeof loadStations){
  let latest=0
  async function boardTrip(state:ActiveTrip):Promise<void>{
    const s=store.current(state);if(!s||s.onBoard)return
    const boarded=store.advanceTrip(s);if(!boarded?.onBoard)return
    const leg=boarded.trip.legs[boarded.legIndex],c=leg.choice
    try{
      const rows=routeRows(await live(c.line.id,c.direction),leg)
      const candidates=rows.filter(v=>integer(v.stationNo)===c.station.no&&integer(v.ioStation)!==0)
      if(candidates.length!==1)return
      const v=candidates[0],key=identity(v)
      if(integer(v.ioStation)===1&&atStop(v,c.station)&&credible(v)&&sameVehicle(rows,key)===v)store.bind(boarded,key)
    }catch{/* A telemetry failure never undoes manual boarding. */}
  }
  async function remainingStops(state:ActiveTrip):Promise<number|undefined>{
    const s=store.current(state);if(!s?.onBoard||!s.vehicle)return undefined
    const token=++latest,leg=s.trip.legs[s.legIndex],c=leg.choice,start=c.station.no,end=start+leg.stops
    if(integer(start)===undefined||integer(end)===undefined||end<=start)return undefined
    try{
      // Resolve the timetable first so a slow station query cannot age the live sample.
      const stops=await stations(c.line.id,c.direction),board=stationAt(stops,start),exit=stationAt(stops,end)
      if(!board||board.id!==c.station.id||board.name!==leg.from||!exit||exit.name!==leg.to)return undefined
      const change=s.trip.legs[s.legIndex+1]?.choice.station
      if(change&&change.id!==exit.id)return undefined
      if(token!==latest||!store.current(s))return undefined
      const v=sameVehicle(routeRows(await live(c.line.id,c.direction),leg),s.vehicle)
      if(token!==latest||!store.current(s)||!v||!credible(v))return undefined
      const no=integer(v.stationNo);if(no===undefined||no<start||no>end)return undefined
      const current=stationAt(stops,no);if(!current||!atStop(v,current))return undefined
      return end-no
    }catch{return undefined}
  }
  return {boardTrip,remainingStops}
}
export const {boardTrip,remainingStops}=createRideProgress(activeTripStore,(lineId,upOrDown)=>vehicleBatch([{lineId,upOrDown}],true),loadStations)

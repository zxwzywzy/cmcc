import { Map as RouteMap, MapPolyline, Marker, Text, VStack, useEffect, useState } from 'scripting'
import { loadStations } from './api'
import type { Station } from './model'
import { coordinate, type Coordinate } from './nearby'
import type { Leg, Trip } from './trip-planner'

type Shape = { paths:Coordinate[][]; board?:Coordinate; exit?:Coordinate }

function shape(leg:Leg, rows:Station[]):Shape {
  const at=leg.choice.station, last=at.no+leg.stops
  const paths:Coordinate[][]=[]
  if (!Number.isSafeInteger(at.no)||!Number.isSafeInteger(last)||last<=at.no) return {paths}
  // A repeated sequence number is ambiguous; treat it as a gap, not a choice of coordinates.
  const byNo=new Map<number,Station|null>()
  for (const s of rows) if (Number.isInteger(s.no)&&s.no>=at.no&&s.no<=last)
    byNo.set(s.no,byNo.has(s.no)?null:s)
  const board=byNo.get(at.no), exit=byNo.get(last)
  if (!board||board.id!==at.id||board.name!==leg.from||!exit||exit.name!==leg.to) return {paths}
  let run:Coordinate[]=[], previous:number|undefined
  for (const no of [...byNo.keys()].sort((a,b)=>a-b)) {
    const point=coordinate(byNo.get(no))
    if (!point||previous!==no-1) run=[]
    if (point) {
      run.push(point)
      if (run.length===2) paths.push(run)
    }
    previous=no
  }
  return {paths,board:coordinate(board),exit:coordinate(exit)}
}

export default function TripDiagram({trip,destination}:{trip:Trip;destination:string}) {
  const [loaded,setLoaded]=useState<{trip:Trip; shapes:Shape[]}|null>(null)
  useEffect(()=>{
    let active=true
    Promise.all(trip.legs.map(async leg=>{
      try { return shape(leg,await loadStations(leg.choice.line.id,leg.choice.direction)) }
      catch { return {paths:[]} }
    })).then(shapes=>{if(active)setLoaded({trip,shapes})})
    return ()=>{active=false}
  },[trip])
  const shapes=loaded?.trip===trip?loaded.shapes:[]
  const paths=shapes.flatMap((s,i)=>s.paths.map(points=>({points,leg:i})))
  const pins:{point:Coordinate;title:string}[]=[]
  // A shared transfer gets one pin. Either verified leg can supply its coordinate.
  for(let i=0;i<=trip.legs.length && trip.legs.length>0;i++) {
    const point=shapes[i]?.board??shapes[i-1]?.exit
    if(point) pins.push({point,title:i===0?'上车 · '+trip.legs[i].from:
      i===trip.legs.length?'下车 · '+trip.legs[i-1].to:'换乘 · '+trip.legs[i].from})
  }
  return <VStack alignment="leading" spacing={8}>
    {paths.length||pins.length?<RouteMap frame={{height:260}}>
      {paths.map((p,i)=><MapPolyline key={'path'+i} coordinates={p.points} strokeColor={p.leg%2?'systemOrange':'systemBlue'} strokeStyle={{lineWidth:4}}/>)}
      {pins.map((p,i)=><Marker key={'pin'+i} title={p.title} coordinate={p.point}/>)}
    </RouteMap>:null}
    <Text font="caption">{loaded?.trip!==trip?'正在读取线路站序…':paths.length||pins.length?'仅标注已核对的站点；连线表示站序，不是行车轨迹。':'暂无可核实的站点坐标，请参照下方行程。'}</Text>
    <Text>{'出发 · 距上车站直线约 '+Math.round(trip.startMeters)+' 米'}</Text>
    {trip.legs.map((l,i)=><VStack key={i} alignment="leading" spacing={2}>
      <Text fontWeight="semibold">{(i?'换乘 · ':'上车 · ')+l.from}</Text>
      <Text>{l.line+' · '+l.direction+' · '+l.stops+' 站'}</Text>
      <Text>{'下车 · '+l.to}</Text>
    </VStack>)}
    <Text>{'目的地 · '+destination+'（距下车站直线约 '+Math.round(trip.endMeters)+' 米）'}</Text>
  </VStack>
}

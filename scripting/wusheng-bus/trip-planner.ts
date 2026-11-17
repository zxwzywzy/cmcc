import { post } from './api'
import { destination, normalizeNearby, type Coordinate, type NearbyStop, type Service } from './nearby'
import type { Choice, Station } from './model'

export type Leg = { choice:Choice; line:string; direction:string; from:string; to:string; stops:number }
export type Trip = { legs:Leg[]; startMeters:number; endMeters:number }

function leg(s:Service, from:Station, to:Station):Leg {
  return { choice:{...s.choice,station:from}, line:s.choice.line.name || s.choice.line.id, direction:destination(s.choice),
    from:from.name, to:to.name, stops:to.no-from.no }
}

export function matchTrips(starts:NearbyStop[], ends:NearbyStop[]):Trip[] {
  const unique = new Map<string,Trip>()
  if (!starts.length) return []
  const start = starts.reduce((best,s)=>s.meters<best.meters?s:best)
  for (const end of ends) {
    if (start.id === end.id) continue
    const add = (legs:Leg[]) => {
      const trip = { legs, startMeters:start.meters, endMeters:end.meters }
      const key = JSON.stringify(trip)
      if (!unique.has(key)) unique.set(key, trip)
    }
    for (const a of start.services) for (const b of end.services) {
      const from = a.choice.station, to = b.choice.station
      if (a.choice.line.id === b.choice.line.id) {
        if (a.choice.direction === b.choice.direction && from.no < to.no) add([leg(a,from,to)])
        continue
      }
      // An identically named stop across the road isn't proof of a shared platform.
      const onward = new Map<string,Station[]>()
      for (const board of b.stations) if (board.id && board.no < to.no) {
        const group = onward.get(board.id)
        if (group) group.push(board); else onward.set(board.id,[board])
      }
      for (const change of a.stations) if (change.no > from.no) {
        for (const board of onward.get(change.id) || []) add([leg(a,from,change),leg(b,board,to)])
      }
    }
  }
  const ranked = [...unique.values()].sort((a,b) => a.legs.length-b.legs.length ||
    (a.startMeters+a.endMeters)-(b.startMeters+b.endMeters) ||
    a.legs.reduce((n,l)=>n+l.stops,0)-b.legs.reduce((n,l)=>n+l.stops,0))
  // Show the best trip per line sequence before alternate stops on the same lines.
  const seen = new Set<string>(), first:Trip[] = [], rest:Trip[] = []
  for (const trip of ranked) {
    const key = JSON.stringify(trip.legs.map(l=>l.choice.line.id))
    if (seen.has(key)) rest.push(trip)
    else { seen.add(key); first.push(trip) }
  }
  return first.concat(rest)
}

/** One page per endpoint, no line-directory crawl. Query failures reject; no proven trip resolves to []. */
export async function inspectTrip(origin:Coordinate, dest:Coordinate,homeStop?:NearbyStop) {
  const nearby = async ({latitude,longitude}:Coordinate,pageSize:number) => normalizeNearby(await post(
    '/api/AppBusiness/GetBusStations', {pageIndex:1,pageSize,latitude,longitude}
  ))
  const [originRows,endRows] = await Promise.all([homeStop?Promise.resolve([homeStop]):nearby(origin,5),nearby(dest,20)])
  const ends=endRows.filter(s=>s.meters<=1000).slice(0,20)
  const starts = originRows.slice(0,1) // normalizeNearby sorts by distance, including unserved stops.
  const summary=(rows:NearbyStop[])=>rows.length?rows.slice(0,3).map(s=>s.name+'（'+Math.round(s.meters)+'米）').join('、'):'1 公里内没有返回站台'
  const distant=starts.length>0&&starts[0].meters>5000
  const trips=distant?[]:matchTrips(starts,ends)
  const reason=distant?'公交接口返回的最近站离出发位置约 '+(starts[0].meters/1000).toFixed(1)+' 公里，不作为步行上车站。请重新定位或手动指定武胜的出发地点。':!starts.length?'出发位置附近没有返回公交站台。':!starts[0].services.length?'最近的出发站台没有返回线路信息，不改用其他站台。':!ends.length?'目的地附近没有返回公交站台。':!ends.some(s=>s.services.length)?'目的地站台没有返回线路信息。':'这些站台之间没有匹配到同方向直达或同站换乘一次的方案。'
  return {trips,reason,nearest:starts[0],originStops:starts.length?summary(starts):'公交接口未返回最近站',destStops:summary(ends)}
}
export async function planTrip(origin:Coordinate,dest:Coordinate){return (await inspectTrip(origin,dest)).trips}

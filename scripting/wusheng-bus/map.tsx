import { Image, Map, MapCameraPosition, Marker, MapSnapshotter, Script, List, Section, Text, Button,HStack,VStack,Spacer,useEffect,useState } from 'scripting'
import { nearbyCurrent,destination,vehicleSummary,type NearbySnapshot,type Coordinate } from './nearby'
import {clock,arrivalLabel} from './view'
import { estimateLabel } from './model'
export function mapPoints(s?:NearbySnapshot){
 const pins:{coordinate:Coordinate;title:string;glyph:string;tintColor:string}[]=[]
 if(s?.position)pins.push({coordinate:s.position,title:'我的位置',glyph:'person.fill',tintColor:'systemBlue'})
 if(s?.stop)pins.push({coordinate:s.stop.coordinate,title:s.stop.name,glyph:'mappin',tintColor:'systemGreen'})
 for(const service of s?.services||[])for(const v of service.positions){if(v.coordinate)pins.push({coordinate:v.coordinate,title:v.gps?v.label+'车辆':v.label+'近'+(v.stationName||'站台')+'（站点位置）',glyph:'bus.fill',tintColor:'systemOrange'})}
 return pins
}
export function NearbyMap({snapshot}:{snapshot?:NearbySnapshot}){
 return <Map initialCameraPosition={MapCameraPosition.automatic()} frame={{height:280}}>{mapPoints(snapshot).map((p,i)=><Marker key={i} title={p.title} coordinate={p.coordinate} systemImage={p.glyph} tint={p.tintColor}/>)}</Map>
}
export async function widgetMap(s?:NearbySnapshot){
 if(!s?.stop||!Script.hasFullAccess())return undefined
 try{const pins=mapPoints(s);const {image}=await MapSnapshotter.take({size:{width:150,height:100},scale:1,annotations:pins});return image}catch{return undefined}
}

export function LiveNearbyMap({initial}:{initial?:NearbySnapshot}){
 const [snapshot,setSnapshot]=useState(initial)
 useEffect(()=>{let active=true,timer:ReturnType<typeof setTimeout>;async function tick(){try{const s=await nearbyCurrent();if(active)setSnapshot(s)}finally{if(active)timer=setTimeout(tick,10000)}};tick();return()=>{active=false;clearTimeout(timer)}},[])
 const live=!!snapshot&&!snapshot.stale&&!snapshot.locationStale&&Date.now()-snapshot.time<=120000
 return <List navigationTitle="实时公交"><Section><NearbyMap snapshot={snapshot}/><Text font={11} foregroundStyle="secondaryLabel">{snapshot?'更新于 '+clock(snapshot.time):'等待定位'}</Text></Section><Section>{snapshot?.services.map((r,i)=><VStack key={i} alignment="leading" spacing={5} padding={{vertical:3}}><HStack><Text font={16} fontWeight="semibold">{r.choice.line.name}</Text><Spacer/><Text font={14} foregroundStyle={{light:'#006B72',dark:'#39D4E0'}}>{estimateLabel(r.items[0],live)}</Text></HStack><Text font={12} foregroundStyle="secondaryLabel">{destination(r.choice)}</Text><Text font={11} foregroundStyle="secondaryLabel">{vehicleSummary(r,!live)}</Text>{live&&r.items[0]?.minutes!==undefined&&r.items[0].minutes!>0?<Text font={10} foregroundStyle="secondaryLabel">{'约 '+clock(snapshot!.time+r.items[0].minutes!*60000)+' 到站 · '+arrivalLabel(r.items[0])}</Text>:null}</VStack>)}</Section></List>
}

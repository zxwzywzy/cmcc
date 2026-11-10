import { Image, Map, MapCameraPosition, Marker, MapSnapshotter, Script, List, Section, Text, Button, useEffect, useState } from 'scripting'
import { nearbyCurrent,type NearbySnapshot,type Coordinate } from './nearby'
import {clock,arrivalLabel} from './view'
export function mapPoints(s?:NearbySnapshot){
 const pins:{coordinate:Coordinate;title:string;glyph:string;tintColor:string}[]=[]
 if(s?.position)pins.push({coordinate:s.position,title:'我的位置',glyph:'person.fill',tintColor:'systemBlue'})
 if(s?.stop)pins.push({coordinate:s.stop.coordinate,title:s.stop.name,glyph:'mappin',tintColor:'systemGreen'})
 for(const service of s?.services||[])for(const v of service.positions){if(v.coordinate&&pins.length<10)pins.push({coordinate:v.coordinate,title:v.gps?v.label+'车辆':v.label+'近'+(v.stationName||'站台')+'（站点位置）',glyph:'bus.fill',tintColor:'systemOrange'})}
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
 return <List navigationTitle="站台与车辆位置"><Section><NearbyMap snapshot={snapshot}/><Text>{snapshot?'更新 '+clock(snapshot.time)+(snapshot.stale?' · 缓存数据':''): '等待定位'}</Text>{snapshot?.message?<Text>{snapshot.message}</Text>:null}{snapshot?.services.map((r,i)=><Text key={i}>{r.choice.line.name+' '+(r.choice.direction===1?'上行':'下行')+' · '+arrivalLabel(r.items[0])+' · '+(r.positions.map(v=>v.stationName?'近'+v.stationName:v.gps?'已上报GPS':'位置未知').join('、')||'暂无车辆')}</Text>)}</Section><Section footer={<Text>此页打开期间约每十秒查询一次，关闭即停止。站台位置图钉不代表车辆精确 GPS；没有车辆数据时不放置车辆图钉。</Text>}/></List>
}

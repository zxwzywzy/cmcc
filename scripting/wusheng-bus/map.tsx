import { Map,MapCameraPosition,Marker,MapSnapshotter,Script } from 'scripting'
import type { NearbySnapshot,Coordinate } from './nearby'
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

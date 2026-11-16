import { Picker,Text,VStack,useState } from 'scripting'
import { RealtimePage } from './transit-page'
import { FleetPage } from './fleet-page'
import { JourneyPage } from './journey-page'
import type { RouteRequest } from './route-links'
export function TransitHome({active,close,initialRoute,chooseLine=false}:{active:boolean;close:any;initialRoute?:RouteRequest;chooseLine?:boolean}){
 const [page,setPage]=useState('nearby')
 return <VStack spacing={0}><Picker title="公交功能" value={page} onChanged={v=>setPage(String(v))} pickerStyle="segmented" padding={{horizontal:16,vertical:8}}><Text tag="nearby">附近公交</Text><Text tag="fleet">车辆地图</Text><Text tag="journey">换乘规划</Text></Picker>{page==='fleet'?<FleetPage active={active} close={close}/>:page==='journey'?<JourneyPage active={active} close={close}/>:<RealtimePage active={active} close={close} initialRoute={initialRoute} chooseLine={chooseLine}/>}</VStack>
}

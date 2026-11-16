import * as Scripting from 'scripting'
import { Button,HStack,Map,MapCameraPosition,Marker,Picker,ScrollView,Spacer,Text,VStack,useEffect,useObservable,useState } from 'scripting'
import { createFleetSession,fleetRegion } from './fleet'
export function FleetPage({active,close}:{active:boolean;close:any}){
 const [session]=useState(createFleetSession()),[state,setState]=useState(session.getState()),[line,setLine]=useState(''),[direction,setDirection]=useState(''),[selected,setSelected]=useState(''),[gate]=useState({fitted:false})
 const camera=useObservable(MapCameraPosition.automatic()),selection=useObservable<any>(null)
 useEffect(()=>session.subscribe(setState),[])
 useEffect(()=>{session.setActive(active)},[active])
 useEffect(()=>{const exported=(Scripting as any).AppEvents,events=exported&&(typeof exported==='object'||typeof exported==='function')?exported:(globalThis as any).AppEvents;const fn=(phase:string)=>session.setForeground(phase==='active');events?.scenePhase?.addListener?.(fn);return()=>{events?.scenePhase?.removeListener?.(fn);session.dispose()}},[])
 useEffect(()=>{const fn=()=>{const value=selection.value;if(value?.type==='marker')setSelected(value.tag)};selection.subscribe(fn);return()=>selection.unsubscribe(fn)},[])
 useEffect(()=>{if(!gate.fitted&&state.vehicles.length){const region=fleetRegion(state.vehicles);if(region){gate.fitted=true;camera.setValue(MapCameraPosition.region(region))}}},[state.time])
 const rows=state.vehicles.filter(v=>(!line||v.lineId===line)&&(!direction||String(v.direction)===direction)),pins=rows.filter(v=>v.coordinate),current=rows.find(v=>v.key===selected)
 function fit(){const region=fleetRegion(rows);if(region)camera.setValue(MapCameraPosition.region(region))}
 return <ScrollView navigationTitle="全部车辆" toolbar={{cancellationAction:close}}><VStack alignment="leading" spacing={12} padding={16}>
 <HStack><VStack alignment="leading" spacing={3}><Text font={24} fontWeight="semibold">{state.loading&&!state.time?'正在连接车辆…':pins.length+' 辆可见'}</Text><Text font={11} foregroundStyle="secondaryLabel">{state.time?(state.stale?'位置未更新 · ':'更新于 ')+new Date(state.time).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',second:'2-digit'})+' · 每5秒更新':'正在读取运营线路'}</Text></VStack><Spacer/><Button title="查看全部" action={fit}/><Button title="重连" buttonStyle="bordered" action={()=>session.refresh()}/></HStack>
 <HStack><Picker title="线路" value={line} onChanged={v=>{setLine(String(v));setSelected('')}} pickerStyle="menu"><Text tag="">全部线路</Text>{state.lines.map(l=><Text key={l.id} tag={l.id}>{l.name}</Text>)}</Picker><Picker title="方向" value={direction} onChanged={v=>{setDirection(String(v));setSelected('')}} pickerStyle="segmented"><Text tag="">全部</Text><Text tag="1">上行</Text><Text tag="2">下行</Text></Picker></HStack>
 <Map cameraPosition={camera} selection={selection} frame={{maxWidth:'infinity',height:420}} clipShape={{type:'rect',cornerRadius:14}}>{pins.map(v=><Marker key={v.key} tag={v.key} title={v.lineName+' · '+(v.plate||'车牌未上报')+' · '+(v.direction===1?'上行':'下行')} coordinate={v.coordinate!} systemImage="bus.fill" tint={state.stale?'systemGray':v.direction===1?'systemTeal':'systemOrange'}/>)}</Map>
 <HStack><Text font={11} foregroundStyle="secondaryLabel">{'已上报 '+rows.length+' 辆 · '+(rows.length-pins.length)+' 辆未提供坐标'}</Text><Spacer/><Text font={10} foregroundStyle="secondaryLabel">青色上行 · 橙色下行</Text></HStack>
 <Picker title="选择车辆" value={selected} onChanged={v=>setSelected(String(v))} pickerStyle="menu"><Text tag="">点击地图车辆或从此处选择</Text>{rows.map(v=><Text key={v.key} tag={v.key}>{v.lineName+' · '+(v.plate||'车牌未上报')+' · '+(v.direction===1?'上行':'下行')}</Text>)}</Picker>
 {current?<VStack alignment="leading" spacing={6}><HStack><Text font={20} fontWeight="semibold">{current.plate||'车牌未上报'}</Text><Spacer/>{current.coordinate?<Button title="找到这辆车" action={()=>camera.setValue(MapCameraPosition.region({center:current.coordinate!,span:{latitudeDelta:0.012,longitudeDelta:0.012}}))}/>:null}</HStack><Text>{current.lineName+' · '+(current.direction===1?'上行':'下行')+(current.destination?' · 往'+current.destination:'')}</Text><Text font={12} foregroundStyle="secondaryLabel">{(current.stationName?'近 '+current.stationName:'站名未上报')+' · '+(current.speed===undefined?'车速未上报':current.speed+' 公里/小时')}</Text></VStack>:null}
 {state.message?<Text font={12} foregroundStyle="secondaryLabel">{state.message}</Text>:null}<Text font={10} foregroundStyle="secondaryLabel">显示运营线路本轮上报的位置；车辆可能暂未上报。只在此页面前台保持更新，地图位置不作平滑模拟。</Text>
 </VStack></ScrollView>
}

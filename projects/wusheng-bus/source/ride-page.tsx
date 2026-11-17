import { Button,HStack,Image,List,Navigation,Picker,Script,Section,Spacer,Text,VStack,Widget,useEffect,useState } from 'scripting'
import { createRideSession,initialRideState,type RideState } from './ride'
import RideTicket,{saveTicket,ticketIndex,tickets,originalInk,saveOriginalInk} from './ride-ticket'
import { clock } from './view'
import { readAccount } from './account'
export function RidePage({fromTap=false,tapId=0,active=true,close,toAccount}:{fromTap?:boolean;tapId?:number;active?:boolean;close?:any;toAccount?:()=>void}){
 const dismiss=Navigation.useDismiss(),[skin,setSkin]=useState(ticketIndex())
 const [original,setOriginal]=useState(originalInk())
 const [state,setState]=useState<RideState>(initialRideState())
 const [session]=useState(createRideSession(setState,()=>Widget.reloadAll()))
 const [gate]=useState({initial:false,lastTap:0})
 useEffect(()=>{if(!active){session.hide();return}if(fromTap&&!gate.initial){gate.initial=true;session.refresh()}else if(tapId>gate.lastTap){gate.lastTap=tapId;session.refresh()}},[active,fromTap,tapId])
 useEffect(()=>()=>session.dispose(),[])
 return <List navigationTitle="乘车码" toolbar={{cancellationAction:close||<Button title="关闭" action={()=>{session.dispose();dismiss()}}/>}}>
 <Section><RideTicket index={skin} image={state.image} busy={state.busy} original={original}/><Picker title="票面" value={skin} onChanged={(i:number)=>{if(tickets[i]){setSkin(i);saveTicket(i);setOriginal(false);saveOriginalInk(false);Widget.reloadAll()}}} pickerStyle="segmented">{tickets.map((t,i)=><Text key={t.name} tag={i}>{t.name}</Text>)}</Picker><Button title={original?'使用主题墨色':'使用原版黑白码'} buttonStyle="bordered" action={()=>{saveOriginalInk(!original);setOriginal(!original);Widget.reloadAll()}}/><Button buttonStyle="borderedProminent" title={state.busy?'正在获取…':state.image?'刷新乘车码':'显示乘车码'} disabled={state.busy||!active} action={()=>session.refresh()}/>{!state.busy&&!state.image&&state.note&&!state.note.startsWith('点击获取')?<Text font={11} foregroundStyle="secondaryLabel">{state.note}</Text>:null}
 {!readAccount()&&toAccount?<Button title="去账号页从 BoxJS 登录" action={toAccount}/>:null}
 </Section><Section><HStack spacing={8}><Image systemName="creditcard" font={17}/><VStack alignment="leading" spacing={3}><Text font={12}>公交卡余额</Text>{state.card?<Text font={10} foregroundStyle="secondaryLabel">{clock(state.card.fetchedAt)}</Text>:null}</VStack><Spacer/><Text font={25} fontWeight="semibold" monospacedDigit>{state.card?.balance!==undefined?'¥'+state.card.balance.toFixed(2):'—'}</Text></HStack></Section><Section header={<Text>桌面乘车码</Text>}><Text font={13}>添加 Scripting 组件，选择「武胜公交」，参数填「乘车码」。桌面保留上次取得的码；看到「待刷新」时，请先手动刷新再扫码。</Text></Section></List>
}
export async function presentRide(){await Navigation.present({element:<RidePage fromTap/>});Script.exit()}

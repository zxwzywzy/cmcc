import { HStack,Spacer,Text,VStack } from 'scripting'
import { WidgetCard,type WidgetRoute } from './widget-ui'
import { RideAction } from './widget-actions'
import type { BusFamily } from './appearance'

// Pure display fixtures: never put demonstration arrivals or balances in Storage.
const rows:WidgetRoute[]=[
 {id:'demo-1',name:'101 路',direction:'往 客运中心',eta:'预计 3 分钟',minutes:3,detail:'还有 2 站',progress:0.72},
 {id:'demo-2',name:'26 路',direction:'往 公园',eta:'预计 8 分钟',minutes:8,detail:'还有 4 站',progress:0.4},
 {id:'demo-3',name:'2 路',direction:'往 广场',eta:'还剩 5 站',detail:'时间待更新',progress:0.28},
]
export default function StylePreview({family='systemMedium'}:{family?:BusFamily}){
 const small=family==='systemSmall',large=family==='systemLarge'
 const now=Date.now(),footer=<HStack spacing={6}><Text font={10}>线路</Text><Spacer/><RideAction small={small}/><Text font={10}>换向</Text></HStack>
 return <VStack frame={{width:small?158:300,height:large?330:158}} clipShape={{type:'rect',cornerRadius:18}}><WidgetCard family={family} station="广场站" subtitle="样式示例" routes={rows.slice(0,small?1:large?3:2)} card={{balance:23.5,fetchedAt:now}} time={now} footer={footer}/></VStack>
}

import {Button,VStack,Spacer,Text,Image} from 'scripting'
import {appearance,palette} from './appearance'
import {BusWakeIntent} from './app_intents'

export function RestView({family}:{family:string}){
 const small=family==='systemSmall',look=appearance(),{bg,ink,muted,accent}=palette(look.theme)
 return <VStack alignment="leading" spacing={small?6:10} padding={small?12:16} widgetBackground={bg} background={bg} foregroundStyle={ink} frame={{maxWidth:'infinity',maxHeight:'infinity',alignment:'topLeading'}}>
  <Text font={12} foregroundStyle={muted}>武胜公交</Text>
  <Spacer minLength={0}/>
  <Image systemName="pause.circle" font={small?22:28} foregroundStyle={accent}/>
  <Text font={small?18:24} fontWeight="bold">组件已关闭</Text>
  <Text font={small?10:12} foregroundStyle={muted}>点击唤醒，更新一次公交</Text>
  <Spacer minLength={0}/>
  <Button title="唤醒" buttonStyle="plain" foregroundStyle={accent} intent={BusWakeIntent(undefined)}/>
 </VStack>
}

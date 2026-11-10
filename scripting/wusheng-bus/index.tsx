import { Button, List, Navigation, Script, Section, Text, TextField, fetch, useState } from 'scripting'
import { domain, rules } from './config'
function Setup(){
 const dismiss=Navigation.useDismiss()
 const [host,setHost]=useState(Storage.get<string>('wusheng.bus.host')||'')
 const [note,setNote]=useState(''),[report,setReport]=useState(''),[busy,setBusy]=useState(false)
 async function copyRules(){try{const h=domain(host);Storage.set('wusheng.bus.host',h);await Pasteboard.setString(rules(h));setNote('已复制规则。将重写条目追加到圈 X 的 rewrite_local，主机名追加到 MITM 列表，然后打开微信小程序逐项查看。')}catch(e){setNote((e as Error).message)}}
 async function imported(){
  setBusy(true)
  try{const response=await fetch('https://boxjs.com/query/data/wusheng_bus_diag_v1');if(!response.ok)throw Error();const data=await response.json() as {val?:string};const d=JSON.parse(data.val||'null');if(d?.version!==1||!Array.isArray(d.records))throw Error();setReport(JSON.stringify(d,null,2));setNote('诊断记录已读入。它只包含域名、接口编号、状态和结构摘要，不含 Cookie、余额或乘车码。')}catch{setNote('尚无诊断记录。确认 BoxJS 可用、域名和 MITM 已生效，再打开微信里的相关页面。')}finally{setBusy(false)}
 }
 return <List navigationTitle="武胜公交" toolbar={{cancellationAction:<Button title="关闭" action={dismiss}/>}}>
  <Section header={<Text>开发状态</Text>} footer={<Text>这是接口准备工具，不是已接通的公交组件。当前没有实时查询，不显示示例到站时间、余额或二维码。</Text>}><Text>实时到站 · 待确认接口</Text><Text>公交卡余额 · 待确认鉴权</Text><Text>乘车码 · 待确认有效期和签名</Text></Section>
  <Section header={<Text>1 · 找到小程序域名</Text>} footer={<Text>在圈 X 的网络活动中打开记录，然后去微信打开“武胜公交”，分别查看实时公交、卡余额和乘车码。回圈 X 找刚出现的业务域名。不要填写微信登录公共域名；若只见微信公共域名或没有业务请求，先不要生成规则。</Text>}><Text>微信小程序也通过网络请求数据，业务域名通常与小程序名称不同。</Text><TextField title="已确认的业务域名" value={host} onChanged={setHost}/></Section>
  <Section header={<Text>2 · 生成指定域名的诊断规则</Text>} footer={<Text>规则只作用于填写的域名。启用重写与 MITM，确保证书已完全信任。微信部分请求可能绕过代理或受证书固定限制，没有记录不代表已抓到凭据。</Text>}><Button title="复制圈 X 诊断规则" action={copyRules}/></Section>
  <Section header={<Text>3 · 查看诊断</Text>} footer={<Text>{note||'分别查看三个业务页面后回这里导入。确认诊断已收集后关闭规则；暂时不要导出完整抓包、Cookie、二维码或登录信息。'}</Text>}><Button title={busy?'读取中…':'从 BoxJS 读取诊断'} disabled={busy} action={imported}/>{report?<Button title="复制结构诊断" action={async()=>{await Pasteboard.setString(report);setNote('已复制结构诊断，不包含业务响应内容。')}}/>:null}{report?<Text font="caption" textSelection="enabled">{report}</Text>:null}</Section>
 </List>
}
async function main(){await Navigation.present({element:<Setup/>});Script.exit()}
main()

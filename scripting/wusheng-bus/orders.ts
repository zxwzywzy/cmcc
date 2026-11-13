import { post } from './api'
import { readAccount } from './account'
import { finite,text } from './model'
export type OrderKind='ride'|'recharge'
export type OrderRecord={id:string;kind:OrderKind;title:string;amount?:number;time:string;status:string;statusCode?:number;orderTail:string;vehicle:string;boarding:string;dropOff:string;cardTail:string;chargedAt:string}
export type OrderPage={rows:OrderRecord[];page:number;total?:number;hasMore:boolean}
const rideStatus:Record<number,string>={1:'已扣费',2:'已扣费',3:'扣费失败'}
const rechargeStatus:Record<number,string>={1:'充值成功',2:'充值失败',3:'订单关闭',4:'申请退款',5:'退款完成',6:'退款失败',9:'退款处理中'}
export function normalizeOrders(body:any,kind:OrderKind,page:number):OrderPage{
 if(body?.code!==0||!body.data)throw Error('订单查询失败，请稍后重试')
 const selected=kind==='ride'?body.data.busConsumeRecord:body.data.busRechargeRecord
 if(!selected||typeof selected!=='object'||selected.data!==undefined&&!Array.isArray(selected.data))throw Error('订单返回格式暂未识别')
 const rows=(selected.data||[]).map((v:any,i:number):OrderRecord=>{
  const cents=finite(v.paymentAmount),statusCode=finite(kind==='ride'?v.paymentStatus:v.rechargeStatus),status=(kind==='ride'?rideStatus:rechargeStatus)[statusCode!]||(statusCode===undefined?'状态未返回':'状态 '+statusCode)
  return {id:text(v.recordId)||kind+':'+page+':'+i,kind,title:kind==='ride'?text(v.lineName)||'公交乘车':v.consumeType===1?'电子公交卡充值':v.consumeType===2?'NFC 公交卡充值':'公交卡充值',amount:cents===undefined?undefined:cents/100,time:text(kind==='ride'?v.consumeTime:v.createTime),status,statusCode,orderTail:(text(v.consumeOrderCode)||text(v.orderNo)||text(v.payOrderNum)).slice(-8),vehicle:text(v.busNum),boarding:text(v.boardingStation),dropOff:text(v.dropOffStation),cardTail:text(v.userCardNo).slice(-4),chargedAt:text(v.noticeTime)}
 })
 const meta=selected.page||{},total=finite(meta.totalCount),pages=finite(meta.pageCount)
 return {rows,page,total:total!==undefined&&total>=0?total:undefined,hasMore:pages!==undefined?pages>page:total!==undefined?page*10<total:rows.length===10}
}
export async function loadOrders(kind:OrderKind,page=1):Promise<OrderPage>{
 if(!['ride','recharge'].includes(kind)||!Number.isInteger(page)||page<1||page>10000)throw Error('订单查询参数无效')
 const account=readAccount();if(!account)throw Error('请先在账号页导入登录')
 const body=await post('/api/AppBusiness/GetConsumedAndRechargeRecord',{pageIndex:page,pageSize:10,searchType:kind==='ride'?1:0,userId:account.userId},account)
 const current=readAccount();if(current?.authorization!==account.authorization||current?.userId!==account.userId)throw Error('账号已变化，请重新打开订单记录')
 return normalizeOrders(body,kind,page)
}

import { fetch } from 'scripting'
import CryptoJS from './vendor/crypto-js.js'
import JSEncrypt from './vendor/jsencrypt.js'
import { beijingTimestamp } from './telecom-login'
const BASE='https://appgologinsz.189.cn/login/client/'
const PUB='MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDBkLT15ThVgz6/NOl6s8GNPofdWzWbCkWnkaAm7O2LjkM1H7dMvzkiqdxU02jamGRHLX/ZNMCXHnPcW/sDhiFCBN18qFvy8g6VYb9QtroI09e176s+ZCtiv7hbin2cCTj99iUpnEloZm19lwHyo69u5UMiPMpq0/XKBO8lYhN/gwIDAQAB'
const trans=(v:string)=>[...v].map(c=>String.fromCharCode(c.charCodeAt(0)+2)).join('')
const cooldown=new Map<string,number>()
export type SliderProof={distance:number;track:string;start:number;end:number}
// This scans only the transparent piece's bounds for display alignment; the user solves the puzzle.
export function pieceBounds(bytes:Uint8Array,width:number,height:number){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width*height>2000000||bytes.length!==width*height*4)throw Error('拼图尺寸无效')
 let left=width,right=-1
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(bytes[(y*width+x)*4+3]>128){left=Math.min(left,x);right=Math.max(right,x)}
 if(right<left)throw Error('拼图内容无效');return {left,width:right-left+1}
}
export class TelecomSms {
 private phone:string;private uid:string;private key='';private isct='0';private slider?:{key:string;extra:string};private created=Date.now();private busy=false;private sent=false;private consumed=false
 constructor(phone:string){phone=phone.trim();if(!/^1\d{10}$/.test(phone))throw Error('请输入正确的电信手机号');this.phone=phone;this.uid=CryptoJS.MD5('CT_IOS_11_'+phone).toString()}
 private valid(){if(this.consumed||Date.now()-this.created>600000)throw Error('短信登录页面已过期，请重新获取拼图')}
 private state(data:any){if(typeof data.key==='string')this.key=data.key;if(data.isChinatelecom!==undefined)this.isct=String(data.isChinatelecom)}
 private async post(code:string,fieldData:any,extra:any={}){
  const headerInfos={broadAccount:'',broadToken:'',fixedLineAccount:'',fixedLineToken:'',provinceCode:'',code,source:'120002',sourcePassword:'TiqmIZ',userLoginName:'',clientType:'#13.4.0#channel50#iPhone 11 Pro Max#',token:'',timestamp:beijingTimestamp(),shopId:'20004',...extra}
  let response:any
  try{const r=await fetch(BASE+code,{method:'POST',headers:{'Content-Type':'application/json; charset=UTF-8','User-Agent':'P216010901'},body:JSON.stringify({headerInfos,content:{attach:'iPhone',fieldData}}),redirect:'error'});if(!r.ok)throw Error();response=await r.json()}
  catch{throw Error('电信网络请求失败，请稍后重试')}
  const r=response?.responseData;if(!r||typeof r.data!=='object'||!r.data)throw Error('电信短信接口返回未适配')
  return r
 }
 private random(signature=''){return {deviceUid:this.uid,imsi:'',key:this.key,payType:'',phoneNum:trans(this.phone),salesProdId:'',scene:'55',signSignatureString:signature,validationCode:''}}
 async challenge(){
  this.valid();if(this.busy)throw Error('正在处理中');this.busy=true
  try{
   const r=await this.post('getLoginRandomCode',this.random());this.state(r.data)
   const result=await this.post('getSliderVerificationPicture',{account:trans(this.phone),clientType:'1',deviceUid:trans(this.uid),scene:'1'}),d=result.data
   const background=d.backgroundImg||d.bigImg,piece=d.sliderImg||d.smallImg
   if(typeof background!=='string'||typeof piece!=='string'||typeof d.key!=='string'||typeof d.extra!=='string')throw Error('电信没有返回完整拼图，请重试或改用官方 App 抓取')
   if(background.length>4000000||piece.length>4000000)throw Error('拼图图片过大')
   this.slider={key:d.key,extra:d.extra};this.sent=false
   return {background,piece}
  }finally{this.busy=false}
 }
 async send(proof:SliderProof){
  this.valid();if(this.busy||!this.slider||this.sent)throw Error('请重新获取拼图再发送短信')
  if(Date.now()<(cooldown.get(this.phone)||0))throw Error('请等待60秒后再发送短信')
  const {distance,track,start,end}=proof
  if(!Number.isFinite(distance)||distance<0||distance>1||!Number.isFinite(start)||!Number.isFinite(end)||start<this.created||end<start||end>Date.now()+1000||typeof track!=='string'||!track||track.length>60000)throw Error('请先手动拖动拼图滑块')
  const parts=track.split('%');if(parts.length<2||parts.some(p=>!/^\d+\.\d{3}#0\.000#\d+$/.test(p)))throw Error('请先手动拖动拼图滑块')
  this.busy=true
  try{
   const key=CryptoJS.enc.Base64.parse(this.slider.extra);if(![16,24,32].includes(key.sigBytes))throw Error('电信拼图密钥无效')
   const encrypt=(s:string)=>CryptoJS.AES.encrypt(s,key,{mode:CryptoJS.mode.ECB,padding:CryptoJS.pad.Pkcs7}).ciphertext.toString(CryptoJS.enc.Base64)
   const r=await this.post('verificationSliderPicture',{account:trans(this.phone),clientType:'1',deviceUid:trans(this.uid),distance:encrypt(distance.toFixed(4)),endTime:encrypt(String(end)),startTime:encrypt(String(start)),key:this.slider.key,scene:'1',shopId:'20002',slidingTrack:encrypt(track)})
   if(typeof r.data.signSignatureString!=='string'||!r.data.signSignatureString)throw Error('拼图验证未通过，请重新获取拼图后手动对齐')
   cooldown.set(this.phone,Date.now()+60000)
   const sent=await this.post('getLoginRandomCode',this.random(r.data.signSignatureString));this.state(sent.data)
   if(!['0','0000'].includes(String(sent.resultCode)))throw Error('电信未确认发送成功，请稍后再试或使用官方 App')
   this.sent=true;this.slider=undefined
  }finally{this.busy=false}
 }
 async submit(code:string){
  this.valid();if(this.busy||!this.sent)throw Error('请先完成拼图并发送验证码');if(!/^\d{6}$/.test(code))throw Error('请输入6位短信验证码')
  this.busy=true
  try{
   const timestamp=beijingTimestamp(),rsa=new JSEncrypt();rsa.setPublicKey('-----BEGIN PUBLIC KEY-----\n'+PUB+'\n-----END PUBLIC KEY-----')
   const plain='iPhone 11'.slice(0,10).padEnd(10,' ')+'16.1.'+this.uid.slice(0,12)+this.phone+timestamp+code+'0'.padEnd(4,'$')+'0.'
   const encrypted=rsa.encrypt(plain);if(!encrypted)throw Error('短信登录加密失败')
   const auth=CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(trans(code)))
   const r=await this.post('userLoginNormal',{accountType:'',authentication:auth,clientType:'1',deviceUid:this.uid,isChinatelecom:this.isct||'1',loginAuthCipherAsymmertric:encrypted,loginType:'2',phoneNum:trans(this.phone),signSignatureString:'',systemVersion:'16.1.1'},{userLoginName:trans(this.phone),timestamp})
   const login=r.data.loginSuccessResult;if(!['0','0000'].includes(String(r.resultCode))||typeof login?.token!=='string'||!login.token)throw Error('验证码登录未成功，请检查验证码或在官方 App 完成验证')
   this.consumed=true
   return {phone:this.phone,token:login.token,deviceID:this.uid,provinceCode:typeof login.provinceCode==='string'?login.provinceCode:'',cityCode:typeof login.cityCode==='string'?login.cityCode:''}
  }finally{this.busy=false}
 }
}

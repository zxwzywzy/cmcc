const vm=require('node:vm'),assert=require('node:assert/strict'),esbuild=require('esbuild'),CryptoJS=require('crypto-js');
const code=esbuild.buildSync({entryPoints:['scripting/carriers/telecom-sms.ts'],bundle:true,format:'cjs',platform:'neutral',external:['scripting'],write:false}).outputFiles[0].text;
const requests=[],key=CryptoJS.enc.Utf8.parse('0123456789abcdef'),m={exports:{}};let failSend=false;
const transport={fetch:async(url,opt)=>{assert.equal(opt.redirect,'error');assert.ok(url.startsWith('https://appgologinsz.189.cn/login/client/'));const b=JSON.parse(opt.body);requests.push([url,b]);let data={},resultCode='0000';
 if(url.endsWith('getLoginRandomCode')){data={key:'local-key',isChinatelecom:'0'};if(b.content.fieldData.signSignatureString&&failSend)resultCode='failed';}
 if(url.endsWith('getSliderVerificationPicture'))data={backgroundImg:'synthetic-image',sliderImg:'synthetic-image',key:'slider-key',extra:key.toString(CryptoJS.enc.Base64)};
 if(url.endsWith('verificationSliderPicture')){const f=b.content.fieldData,decrypt=s=>CryptoJS.AES.decrypt({ciphertext:CryptoJS.enc.Base64.parse(s)},key,{mode:CryptoJS.mode.ECB,padding:CryptoJS.pad.Pkcs7}).toString(CryptoJS.enc.Utf8);assert.equal(decrypt(f.distance),'0.5000');assert.match(decrypt(f.slidingTrack),/^0\.100#0\.000#\d+%0\.500#0\.000#\d+$/);data={signSignatureString:'signed-by-carrier'};}
 if(url.endsWith('userLoginNormal')){const f=b.content.fieldData;assert.equal(f.loginType,'2');assert.equal(Buffer.from(f.loginAuthCipherAsymmertric,'base64').length,128);assert.equal(Buffer.from(f.authentication,'base64').toString(),'345678');data={loginSuccessResult:{token:'synthetic-token',provinceCode:'p',cityCode:'c'}};}
 return {ok:true,json:async()=>({responseData:{resultCode,data}})};
}};
vm.runInNewContext(code,{module:m,exports:m.exports,require:()=>transport,Date,Math,Uint8Array,Uint32Array,setTimeout,clearTimeout,console:{log:()=>assert.fail('No secret logs'),error:()=>{}}});
(async()=>{const {TelecomSms,pieceBounds}=m.exports;let bytes=new Uint8Array(4*3*4);bytes[(1*4+1)*4+3]=255;bytes[(1*4+2)*4+3]=255;let b=pieceBounds(bytes,4,3);assert.equal(b.left,1);assert.equal(b.width,2);assert.throws(()=>pieceBounds(new Uint8Array(8),4,3));
 const a=new TelecomSms('13000000000');await assert.rejects(a.submit('123456'));await a.challenge();assert.equal(requests.filter(([,b])=>b.headerInfos.code==='getLoginRandomCode'&&b.content.fieldData.signSignatureString).length,0);
 const start=Date.now(),end=start;const proof={distance:0.5,start,end,track:`0.100#0.000#${start}%0.500#0.000#${end}`};await a.send(proof);assert.equal(requests.filter(([,b])=>b.content.fieldData.signSignatureString==='signed-by-carrier').length,1);await assert.rejects(a.send(proof));const r=await a.submit('123456');assert.equal(r.token,'synthetic-token');assert.ok(!JSON.stringify(r).includes('123456'));await assert.rejects(a.submit('123456'));
 const another=new TelecomSms('13000000000');await another.challenge();const count=requests.length;await assert.rejects(another.send({...proof,start:Date.now(),end:Date.now()}));assert.equal(requests.length,count);
 const rejected=new TelecomSms('13100000000');await rejected.challenge();failSend=true;await assert.rejects(rejected.send({...proof,start:Date.now(),end:Date.now()}));await assert.rejects(rejected.submit('123456'));
 console.log('PASS SMS protocol: manual-proof AES payload, real RSA, no SMS during challenge, single explicit send, cooldown, failed-send/login guards, no stored OTP and transparent-piece geometry.');
})().catch(e=>{console.error(e);process.exitCode=1});

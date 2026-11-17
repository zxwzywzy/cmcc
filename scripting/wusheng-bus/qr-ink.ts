/** Tint a QR bitmap, never generate a symbol from its decoded payload. */
export async function tintQrInk(original: UIImage, inkHex: string): Promise<UIImage> {
  try {
    if (!/^#[0-9a-f]{6}$/i.test(inkHex) || typeof QRCode?.parseImage !== 'function') return original
    const rgb = [1,3,5].map(i=>parseInt(inkHex.slice(i,i+2),16))
    const linear = rgb.map(c=>c<=10 ? c/3294.6 : ((c/255+0.055)/1.055)**2.4)
    // Require at least 7:1 contrast with white. Never use a ticket's light text color.
    if (0.2126*linear[0]+0.7152*linear[1]+0.0722*linear[2] > 0.1) return original
    if (original.imageOrientation !== 'up' || original.width*original.height*original.scale**2 > 2048**2) return original
    const before = await QRCode.parseImage(original)
    if (!before) return original
    const pixels = original.getPixelData()
    if (!pixels) return original
    const {width:w,height:h}=pixels, src=pixels.data.toUint8Array()
    if (!src || w<1 || h<1 || w*h>2048**2 || src.length!==w*h*4) return original

    // Lossless 24-bit BMP in memory. Write at the source pixel grid; BMP rows are bottom-up, BGR.
    const stride=Math.ceil(w*3/4)*4, bmp=new Uint8Array(54+stride*h), header=new DataView(bmp.buffer)
    bmp[0]=0x42; bmp[1]=0x4d
    for (const [offset,value] of [[2,bmp.length],[10,54],[14,40],[18,w],[22,h],[34,stride*h]]) header.setUint32(offset,value,true)
    header.setUint16(26,1,true); header.setUint16(28,24,true)
    for(let y=0;y<h;y++) for(let x=0;x<w;x++) {
      const i=(y*w+x)*4, j=54+(h-1-y)*stride+3*x
      // Original grayscale coverage, composited on white. No threshold or interpolation.
      const coverage=(1-(0.299*src[i]+0.587*src[i+1]+0.114*src[i+2])/255)*src[i+3]/255
      for(let k=0;k<3;k++) bmp[j+2-k]=Math.round(255-(255-rgb[k])*coverage)
    }
    const data=Data.fromUint8Array(bmp), tinted=data&&UIImage.fromData(data,original.scale)
    if (!tinted || tinted.width!==original.width || tinted.height!==original.height || tinted.scale!==original.scale) return original
    return await QRCode.parseImage(tinted)===before ? tinted : original
  } catch { return original }
}

/* ============================================================
   电子名片页交互
   - copyWechat：复制微信号 + 尝试拉起微信加好友
   - saveCard：canvas 重绘 90×54mm(300dpi) 名片并保存 PNG
   纯原生实现，无外部依赖，离线也可用
   ============================================================ */
var WECHAT_ID = 'freevercool';
var CARD_W = 1063;   // 90mm @ 300dpi
var CARD_H = 638;    // 54mm @ 300dpi

/* ---------- 复制与轻提示 ---------- */
function toast(msg){
  var b=document.createElement('div')
  b.textContent=msg
  b.style.cssText='position:fixed;left:50%;bottom:40px;transform:translateX(-50%);background:rgba(20,30,44,.95);color:#E8EEF4;padding:9px 18px;border-radius:6px;font-size:13px;z-index:99'
  document.body.appendChild(b)
  setTimeout(function(){b.remove()},1600)
}
function copyText(txt,msg){
  var ok=function(){toast(msg)}
  var fallback=function(t,ok){
    var ta=document.createElement('textarea')
    ta.value=t;ta.style.position='fixed';ta.style.opacity='0'
    document.body.appendChild(ta);ta.select()
    try{document.execCommand('copy');ok()}catch(e){}
    ta.remove()
  }
  if(navigator.clipboard&&window.isSecureContext){
    navigator.clipboard.writeText(txt).then(ok,function(){fallback(txt,ok)})
  }else{fallback(txt,ok)}
}
function copyWechat(){
  copyText(WECHAT_ID,'微信号已复制')
  // 尝试拉起微信加好友
  try{
    var a=document.createElement('a')
    a.href='weixin://dl/addfriend'
    a.style.display='none'
    document.body.appendChild(a)
    a.click()
  }catch(e){}
}

/* ---------- 加载资源：头像(内嵌 base64) + 复用预览卡片的 SVG 图标 ---------- */
function loadAssets(){
  var avatarP=new Promise(function(res,rej){
    var im=new Image()
    im.onload=function(){res(im)}
    im.onerror=rej
    im.src=AVATAR_DATA
  })
  var iconP=new Promise(function(res){
    var svgs=[document.querySelector('.bcard-brand .mk svg')]
    Array.prototype.push.apply(svgs, document.querySelectorAll('.bcard-contact .c-item .c-ico svg'))
    var out=[], left=svgs.length
    if(!left){ res([]); return }
    svgs.forEach(function(svg,i){
      var im=new Image()
      im.onload=function(){ out[i]=im; done() }
      im.onerror=function(){ out[i]=null; done() }
      function done(){ if(--left===0) res(out) }
      try{
        im.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(new XMLSerializer().serializeToString(svg))
      }catch(e){ out[i]=null; if(--left===0) res(out) }
    })
  })
  return Promise.all([avatarP,iconP])
}

/* ---------- 返回主页：有历史则回退，直达则跳主页 ---------- */
function goBack(){
  if(window.history && window.history.length>1){ window.history.back() }
  else{ window.location.href='index.html' }
}

/* ---------- 来源判断：仅从主页"查看名片"进入才显示返回主页按钮；直接打开则隐藏 ---------- */
(function(){
  var fromHome=/[?&]from=home/.test(window.location.search)
  var back=document.querySelector('.card-back')
  if(back && !fromHome){ back.style.display='none' }
})()

/* ---------- 名片自适应：始终按 480×288(5:3) 设计尺寸渲染，小屏整体等比缩放，预览与导出图保持一致 ---------- */
function fitCard(){
  var card=document.querySelector('.bcard')
  if(!card) return
  var baseW=480, baseH=288
  card.style.maxWidth='none'
  card.style.width=baseW+'px'
  card.style.height=baseH+'px'
  card.style.aspectRatio='90/54'
  var s=Math.min(1,(window.innerWidth-32)/baseW)   // 左右各留 16px
  if('zoom' in card.style){
    card.style.zoom=s                              // 布局盒与内容一起等比缩放
  }else{
    card.style.transform='scale('+s+')'
    card.style.transformOrigin='top center'
    card.style.marginBottom=-(baseH*(1-s))+'px'
  }
}
function initFit(){
  fitCard()
  window.addEventListener('resize', function(){ fitCard() })
}
initFit()

/* ---------- 保存名片 ---------- */
var EXPORT_SCALE=2  // 导出分辨率倍数：300dpi→600dpi，头像等细节像素翻倍更清晰
function saveCard(){
  var canvas=document.createElement('canvas')
  canvas.width=CARD_W*EXPORT_SCALE; canvas.height=CARD_H*EXPORT_SCALE
  var ctx=canvas.getContext('2d')
  ctx.scale(EXPORT_SCALE,EXPORT_SCALE)
  loadAssets().then(function(res){
    drawCard(ctx,res[0],res[1])
    download(canvas)
  }).catch(function(){
    drawCard(ctx,null,[])
    download(canvas)
  })
}
function download(canvas){
  var filename='黎广_电子名片.png'
  var isIOS=/iPhone|iPad|iPod/i.test(navigator.userAgent||'')
  // Blob + objectURL 下载：规避 iOS Safari 对大数据URL下载产出0字节空文件的问题
  function objectURLDownload(blob){
    var url=URL.createObjectURL(blob)
    var a=document.createElement('a')
    a.href=url; a.download=filename
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(function(){ URL.revokeObjectURL(url) }, 3000)
  }
  function dataURLFallback(){
    var a=document.createElement('a')
    a.download=filename
    a.href=canvas.toDataURL('image/png')
    document.body.appendChild(a); a.click(); a.remove()
  }
  function useBlob(blob){
    if(!blob){ dataURLFallback(); return }
    // iOS：有 Web Share 时优先走系统分享（可“存储图像”到相册），最可靠
    if(isIOS && navigator.share && navigator.canShare){
      try{
        var file=new File([blob], filename, {type:'image/png'})
        if(navigator.canShare({files:[file]})){
          navigator.share({files:[file]}).catch(function(e){
            if(e && e.name!=='AbortError'){ objectURLDownload(blob) }
          })
          return
        }
      }catch(e){}
    }
    objectURLDownload(blob)
  }
  if(canvas.toBlob){ canvas.toBlob(useBlob,'image/png') } else { dataURLFallback() }
}

/* ---------- 绘制名片（按预览卡片 480×288 → 1063×638 等比×2.2146 精确对齐各控件） ---------- */
function drawCard(ctx,avatar,icons){
  var W=CARD_W,H=CARD_H
  // 背景
  var g=ctx.createLinearGradient(0,0,W,H)
  g.addColorStop(0,'#0F1828'); g.addColorStop(.6,'#0B1220'); g.addColorStop(1,'#080D16')
  ctx.fillStyle=g; ctx.fillRect(0,0,W,H)
  // 右上青色光晕
  var rg=ctx.createRadialGradient(W*.92,-H*.05,0,W*.92,-H*.05,W*.9)
  rg.addColorStop(0,'rgba(34,211,238,.18)'); rg.addColorStop(1,'rgba(34,211,238,0)')
  ctx.fillStyle=rg; ctx.fillRect(0,0,W,H)

  // 品牌行：图标(复用预览SVG) + 文案
  if(icons && icons[0]){ ctx.drawImage(icons[0], 58, 49, 49, 49) }
  else{ drawMark(ctx,58,49) }
  ctx.fillStyle='#8FA3B8'; ctx.font='600 27px "Microsoft YaHei",sans-serif'
  ctx.fillText('音视频 · 嵌入式 Android', 124, 74)

  // 主区：头像在左(57.6,182.2,155)，信息在右(257)
  var avX=58, avY=182, avD=155
  // 高质量平滑，保证头像/图标锐利
  ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high'
  if(avatar){
    ctx.save()
    ctx.beginPath(); ctx.arc(avX+avD/2, avY+avD/2, avD/2, 0, Math.PI*2); ctx.clip()
    ctx.drawImage(avatar, avX, avY, avD, avD)
    ctx.restore()
    ctx.beginPath(); ctx.arc(avX+avD/2, avY+avD/2, avD/2, 0, Math.PI*2)
    ctx.lineWidth=6; ctx.strokeStyle='rgba(34,211,238,.5)'; ctx.stroke()
  }else{
    ctx.fillStyle='rgba(34,211,238,.12)'
    ctx.beginPath(); ctx.arc(avX+avD/2, avY+avD/2, avD/2, 0, Math.PI*2); ctx.fill()
    ctx.fillStyle='#22D3EE'; ctx.textAlign='center'; ctx.textBaseline='middle'
    ctx.font='800 66px "Microsoft YaHei",sans-serif'
    ctx.fillText('黎', avX+avD/2, avY+avD/2+6)
    ctx.textAlign='left'; ctx.textBaseline='alphabetic'
  }
  // 姓名(75) / 职位(31) / 焦点(27)
  var tx=257
  ctx.fillStyle='#E8EEF4'; ctx.font='800 75px "Microsoft YaHei",sans-serif'
  ctx.fillText('黎广', tx, 219)
  ctx.fillStyle='#E8EEF4'; ctx.font='600 31px "Microsoft YaHei",sans-serif'
  ctx.fillText('Android 高级开发工程师', tx, 276)
  var tLen=ctx.measureText('Android 高级开发工程师').width
  // 仅"·"为青色，与预览一致
  var dotX=tx+tLen+13
  ctx.fillStyle='#22D3EE'
  ctx.fillText('·', dotX, 276)
  var dotW=ctx.measureText('·').width
  ctx.fillStyle='#E8EEF4'
  ctx.fillText(' 音视频 / 嵌入式', dotX+dotW+11, 276)
  ctx.fillStyle='#8FA3B8'; ctx.font='400 27px "Microsoft YaHei",sans-serif'
  ctx.fillText('10 年+ Android · 系统级音视频 · 0→1 交付', tx, 336)

  // 联系方式：图标(15→33) + 值(12.5→28)，行顶 182.3/208.5/234.8→404/462/520
  var vals=['131 1361 3895','teigkuang@163.com','freevercool']
  var rows=[404,462,520]
  ctx.font='400 28px "Microsoft YaHei",sans-serif'
  rows.forEach(function(y,i){
    var ic=icons && icons[i+1]
    if(ic){ ctx.drawImage(ic, 58, y, 33, 33) }
    else{
      ctx.fillStyle='#22D3EE'
      ctx.beginPath(); ctx.arc(58+16, y+16, 9, 0, Math.PI*2); ctx.fill()
    }
    ctx.fillStyle='#B9C6D4'; ctx.fillText(vals[i], 111, y+26)
  })
}

/* 品牌波形标记 */
function drawMark(ctx,x,y){
  ctx.save()
  ctx.fillStyle='rgba(34,211,238,.18)'
  ctx.beginPath()
  ctx.roundRect?ctx.roundRect(x,y,44,44,9):ctx.rect(x,y,44,44)
  ctx.fill()
  ctx.strokeStyle='#22D3EE'; ctx.lineWidth=4; ctx.lineCap='round'; ctx.lineJoin='round'
  ctx.beginPath()
  ctx.moveTo(x+9,y+26); ctx.lineTo(x+15,y+26); ctx.lineTo(x+19,y+14)
  ctx.lineTo(x+25,y+32); ctx.lineTo(x+29,y+20); ctx.lineTo(x+35,y+26)
  ctx.stroke()
  ctx.restore()
}

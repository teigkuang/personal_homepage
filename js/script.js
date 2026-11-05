/* ============================================================
   黎广 · Android 高级开发工程师 — 个人主页交互逻辑
   独立脚本文件，便于后续迭代与维护
   ============================================================ */
function openContact(){document.getElementById('contactModal').classList.add('open')}
function closeContact(){
  document.getElementById('contactModal').classList.remove('open')
  document.getElementById('mainView').style.display=''
  document.getElementById('wxView').classList.remove('show')
}
function showWechat(){
  document.getElementById('mainView').style.display='none'
  document.getElementById('wxView').classList.add('show')
}
/* 优先尝试直接拉起微信 App；拉不起（电脑/被拦截）则回退到现有面板 */
function launchWechat(){
  var launched=false
  var timer=setTimeout(function(){
    if(!launched){ launched=true; showWechat() }
  },1500)
  function onHide(){
    if(!launched){ launched=true; clearTimeout(timer) }
  }
  window.addEventListener('pagehide',onHide)
  window.addEventListener('visibilitychange',function(){
    if(document.hidden) onHide()
  })
  try{
    var a=document.createElement('a')
    a.href='weixin://dl/addfriend'
    a.style.display='none'
    document.body.appendChild(a)
    a.click()
  }catch(e){
    onHide(); showWechat()
  }
}
function copyText(txt,msg){
  const ok=function(){
    const b=document.createElement('div')
    b.textContent=msg
    b.style.cssText='position:fixed;left:50%;bottom:40px;transform:translateX(-50%);background:rgba(20,30,44,.95);color:#E8EEF4;padding:9px 18px;border-radius:6px;font-size:13px;z-index:99'
    document.body.appendChild(b)
    setTimeout(function(){b.remove()},1600)
  }
  const fallback=function(t,ok){
    const ta=document.createElement('textarea')
    ta.value=t;ta.style.position='fixed';ta.style.opacity='0'
    document.body.appendChild(ta);ta.select()
    try{document.execCommand('copy');ok()}catch(e){}
    ta.remove()
  }
  if(navigator.clipboard&&window.isSecureContext){
    navigator.clipboard.writeText(txt).then(ok,function(){fallback(txt,ok)})
  }else{fallback(txt,ok)}
}
function copyRemark(btn){
  var txt=btn.parentNode.parentNode.querySelector('.txt').innerText
  copyText(txt,'备注已复制')
}
/* 统计卡详情弹窗 */
var DETAILS={
  exp:{
    title:"10 年+ Android 客户端经验",
    body:'<p class="d-lead">2016 年至今，累计 <b>10 年+</b> Android 客户端开发，横跨多个业务场景。</p>'
      +'<div class="d-row"><b>覆盖领域</b><span>消费 AI 智能硬件 · 手机系统应用 · 金融终端 · 运维工具</span></div>'
      +'<div class="d-row"><b>生态厂商</b><span>华为 / OPPO / 荣耀 / 道通 / 金泰谊 / 银点融信</span></div>'
      +'<div class="d-row"><b>核心方向</b><span>音视频 + 嵌入式 + 系统级 Android</span></div>'
  },
  mvp:{
    title:"0→1 · 3 个月交付 MVP",
    body:'<p class="d-lead">学而佳 AI 相机设备端，从 0 到 1 独立开发，<b>3 个月交付 MVP</b>。</p>'
      +'<div class="d-row"><b>落地能力</b><span>端侧语音识别 + TTS 全链路 · AI 对话 · 图生图 / 图生视频</span></div>'
      +'<div class="d-row"><b>工程保障</b><span>弱网缓存重传 · 本地数据库 · 服务端接口联调</span></div>'
      +'<div class="d-row"><b>迭代成果</b><span>上线后持续迭代 5-6 个大版本</span></div>'
  },
  orders:{
    title:"1400+ 累计产品订单",
    body:'<p class="d-lead">学而佳 AI 相机（儿童智能相机硬件）经电商渠道正式售卖，<b>累计订单 1400+ 单</b>。</p>'
      +'<div class="d-row"><b>商业化</b><span>产品正式商用 · 电商渠道销售</span></div>'
      +'<div class="d-row"><b>交付机制</b><span>快速响应、及时修复的发版机制 · 数十次小版本发布</span></div>'
  },
  bigtech:{
    title:"8 段大厂生态经历",
    body:'<p class="d-lead"><b>8 段</b>大厂生态工作经历，覆盖华为、OPPO、荣耀生态。</p>'
      +'<div class="d-row"><b>华为</b><span>EMUI 主题应用迭代（2019-2021）</span></div>'
      +'<div class="d-row"><b>OPPO</b><span>ColorOS 海外主题 / 乐划锁屏 · OTest 自动化测试</span></div>'
      +'<div class="d-row"><b>荣耀</b><span>系统管家大屏适配 · 系统性能优化</span></div>'
  }
}
function showDetail(key){
  var d=DETAILS[key]
  if(!d) return
  document.getElementById('detailTitle').textContent=d.title
  document.getElementById('detailBody').innerHTML=d.body
  document.getElementById('detailModal').classList.add('open')
}
function closeDetail(){
  document.getElementById('detailModal').classList.remove('open')
}
function backTop(){
  window.scrollTo({top:0,behavior:'smooth'})
}

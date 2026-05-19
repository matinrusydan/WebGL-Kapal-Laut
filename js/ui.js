import { State } from './state.js';
import { Config } from './config.js';
import { WebGL } from './webgl.js';

export const UI = {
  windCtx: null, rctx: null, wictx: null, windParticles: [], radarAngle: 0,

  async loadComponents() {
    const root = document.getElementById('ui-root');
    const files = ['header.html', 'panel-status.html', 'panel-controls.html', 'widgets.html'];
    
    // FETCH: Pastikan Anda menjalankan ini lewat local server agar tidak terkena CORS
    for (const file of files) {
      try {
        const response = await fetch(`components/${file}`);
        if (!response.ok) throw new Error(`Status ${response.status}`);
        const html = await response.text();
        root.insertAdjacentHTML('beforeend', html);
      } catch (err) {
        console.error(`Gagal load UI component: ${file}`, err);
      }
    }
  },

  init(appInstance) {
    const windCanvas = document.getElementById('wind-canvas');
    windCanvas.width = window.innerWidth; windCanvas.height = window.innerHeight;
    this.windCtx = windCanvas.getContext('2d');
    
    // Elements loaded via fetch()
    this.rctx = document.getElementById('radar-canvas').getContext('2d');
    this.wictx = document.getElementById('wave-indicator').getContext('2d');
    
    for(let i=0;i<300;i++) this.windParticles.push({x:Math.random()*windCanvas.width, y:Math.random()*windCanvas.height, len:Math.random()*80+20, speed:Math.random()*3+1, alpha:Math.random()*0.4+0.1, curve:Math.random()*0.3-0.15, width:Math.random()*1.5+0.3});
    
    this.bindEvents(appInstance);
  },

  bindEvents(app) {
    document.querySelectorAll('.btn-wind').forEach(b => b.addEventListener('click', (e) => app.setWind(parseInt(e.currentTarget.dataset.val))));
    document.querySelectorAll('.btn-wave').forEach(b => b.addEventListener('click', (e) => app.setWave(parseInt(e.currentTarget.dataset.val))));
    document.querySelectorAll('.btn-tod').forEach(b => b.addEventListener('click', (e) => app.setTOD(e.currentTarget.dataset.val)));
    document.querySelectorAll('.btn-cam').forEach(b => b.addEventListener('click', (e) => app.setCamPreset(e.currentTarget.dataset.val)));
    
    document.getElementById('panel-toggle').addEventListener('click', () => { 
      State.statusVisible = !State.statusVisible; 
      document.getElementById('panel-status').classList.toggle('hidden', !State.statusVisible); 
      document.getElementById('panel-toggle').textContent = State.statusVisible ? '< HIDE' : '> SHOW'; 
    });
    
    const btnAiClose = document.getElementById('btn-ai-close');
    if (btnAiClose) btnAiClose.addEventListener('click', () => document.getElementById('ai-panel').classList.remove('active'));

    // Camera Pointer Interaction
    WebGL.canvas.addEventListener('pointerdown', e => { State.input.isDown=true; State.input.lastPtr={x:e.clientX, y:e.clientY}; });
    window.addEventListener('pointerup', () => State.input.isDown=false);
    window.addEventListener('pointermove', e => { 
      if(!State.input.isDown) return; 
      State.camera.tSph.theta -= (e.clientX-State.input.lastPtr.x)*0.005; 
      State.camera.tSph.phi = Math.max(0.08, Math.min(Math.PI/2.05, State.camera.tSph.phi-(e.clientY-State.input.lastPtr.y)*0.003)); 
      State.input.lastPtr = {x:e.clientX, y:e.clientY}; 
    });
    WebGL.canvas.addEventListener('wheel', e => { State.camera.tSph.radius = Math.max(14, Math.min(150, State.camera.tSph.radius+e.deltaY*0.06)); });
    
    window.addEventListener('keydown', e => {
      const k = e.key.toLowerCase();
      if(['1','2','3'].includes(k)) app.setWind(parseInt(k));
      else if(k==='q') app.setWave(1); else if(k==='w') app.setWave(2); else if(k==='e') app.setWave(3);
      else if(k==='d') app.setTOD('day'); else if(k==='n') app.setTOD('night'); else if(k==='k') app.setTOD('dusk');
      else if(k==='b') app.setCamPreset('bridge'); else if(k==='s') app.setCamPreset('side'); else if(k==='t') app.setCamPreset('top');
    });

    window.addEventListener('resize', () => { 
      WebGL.resize(); 
      const wcv = document.getElementById('wind-canvas'); 
      wcv.width=window.innerWidth; wcv.height=window.innerHeight; 
    });
  },

  updateDOM() {
    document.querySelectorAll('.btn-wind').forEach(b => b.classList.toggle('active', parseInt(b.dataset.val) === State.windLevel));
    document.querySelectorAll('.btn-wave').forEach(b => b.classList.toggle('active', parseInt(b.dataset.val) === State.waveLevel));
    document.querySelectorAll('.btn-tod').forEach(b => b.classList.toggle('active', b.dataset.val === State.timeOfDay));
    
    const wc=Config.wind[State.windLevel], wv=Config.wave[State.waveLevel];
    document.getElementById('val-wind').textContent=wc.name; document.getElementById('bar-wind').style.width=wc.bar+'%';
    document.getElementById('val-wave').textContent=wv.name; document.getElementById('bar-wave').style.width=wv.bar+'%';
    document.getElementById('val-speed').textContent=wc.knots+' KN'; document.getElementById('bar-speed').style.width=(wc.knots/32*100)+'%';
    document.getElementById('val-vis').textContent=wc.vis+' NM'; document.getElementById('bar-vis').style.width=(wc.vis/10*100)+'%';
    
    const icons={'11':'CALM','12':'BREEZE','13':'SUN','21':'WIND','22':'GUST','23':'WAVE','31':'RAIN','32':'STORM','33':'CYCLONE'};
    document.getElementById('weather-label').textContent=(icons[State.windLevel+''+State.waveLevel]||'SEA')+' '+wc.name+'/'+wv.name;
    document.getElementById('storm-alert').style.opacity=(State.windLevel===3&&State.waveLevel===3)?'1':'0';
  },

  updateDynamics(shipH) {
    const td=(State.ship.rz*180/Math.PI), pd=(State.ship.rx*180/Math.PI);
    document.getElementById('val-tilt').textContent=Math.abs(td).toFixed(1)+' deg'; document.getElementById('bar-tilt').style.width=Math.min(100,Math.abs(td)*7)+'%';
    document.getElementById('val-pitch').textContent=Math.abs(pd).toFixed(1)+' deg'; document.getElementById('bar-pitch').style.width=Math.min(100,Math.abs(pd)*12)+'%';
    document.getElementById('val-amp').textContent=Math.abs(shipH).toFixed(2); document.getElementById('bar-amp').style.width=Math.min(100,Math.abs(shipH)*40)+'%';
    document.getElementById('val-tilt').className='stat-val'+(Math.abs(td)>10?' danger':Math.abs(td)>5?' good':'');
    document.getElementById('compass-needle').setAttribute('transform',`rotate(${State.camera.tSph.theta*180/Math.PI},40,40)`);
    const d=new Date(); document.getElementById('time-display').textContent=String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')+':'+String(d.getSeconds()).padStart(2,'0');
  },

  drawOverlays() {
    this.windCtx.clearRect(0,0,window.innerWidth,window.innerHeight);
    const wc=Config.wind[State.windLevel], count=wc.particleCount, spd=wc.particleSpeed, alpha=wc.particleAlpha;
    this.windParticles.slice(0,count).forEach(p=>{
      p.x+=spd*(1+Math.random()*0.4); p.y+=Math.sin(State.simTime*0.5+p.curve)*0.8+(State.windLevel===3?Math.random()*2-1:0);
      if(p.x>window.innerWidth+100){p.x=-100;p.y=Math.random()*window.innerHeight;} if(p.y<0||p.y>window.innerHeight){p.y=Math.random()*window.innerHeight;p.x=Math.random()*window.innerWidth*0.3;}
      const len=p.len*(0.7+State.windLevel*0.15), opacity=alpha*(0.5+Math.random()*0.5)*(State.windLevel===1?0.5:1);
      this.windCtx.save(); this.windCtx.lineWidth=p.width*(State.windLevel===3?1.5:1); this.windCtx.lineCap='round';
      const grad=this.windCtx.createLinearGradient(p.x-len,p.y,p.x,p.y); grad.addColorStop(0,'rgba(180,220,255,0)'); grad.addColorStop(0.7,`rgba(200,230,255,${opacity})`); grad.addColorStop(1,'rgba(240,250,255,0)');
      this.windCtx.strokeStyle=grad; this.windCtx.beginPath(); this.windCtx.moveTo(p.x-len,p.y-p.curve*len); this.windCtx.quadraticCurveTo(p.x-len*0.5,p.y+Math.sin(State.simTime+p.curve)*3,p.x,p.y); this.windCtx.stroke(); this.windCtx.restore();
    });

    const wi=document.getElementById('wave-indicator'); this.wictx.clearRect(0,0,wi.width,wi.height);
    this.wictx.strokeStyle='rgba(0,200,255,0.7)'; this.wictx.lineWidth=1.5; this.wictx.beginPath();
    for(let x=0;x<wi.width;x++){ const a=Config.wave[State.waveLevel].amp*8, y=wi.height/2+Math.sin(x*0.12*Config.wave[State.waveLevel].freq+State.simTime*1.5)*a*0.5+Math.cos(x*0.2*Config.wave[State.waveLevel].freq+State.simTime)*a*0.3; x===0?this.wictx.moveTo(x,y):this.wictx.lineTo(x,y); } this.wictx.stroke();

    const cx=40,cy=40,r=36; this.rctx.clearRect(0,0,80,80); this.rctx.strokeStyle='rgba(0,245,255,0.12)'; this.rctx.lineWidth=0.5;
    [1,2,3].forEach(i=>{this.rctx.beginPath();this.rctx.arc(cx,cy,r*i/3,0,Math.PI*2);this.rctx.stroke();});
    this.rctx.beginPath();this.rctx.moveTo(cx,cy-r);this.rctx.lineTo(cx,cy+r);this.rctx.stroke(); this.rctx.beginPath();this.rctx.moveTo(cx-r,cy);this.rctx.lineTo(cx+r,cy);this.rctx.stroke();
    this.rctx.beginPath();this.rctx.moveTo(cx,cy);this.rctx.arc(cx,cy,r,this.radarAngle,this.radarAngle+0.85);this.rctx.closePath();
    const sg=this.rctx.createRadialGradient(cx,cy,0,cx,cy,r); sg.addColorStop(0,'rgba(0,245,255,0.22)');sg.addColorStop(1,'rgba(0,245,255,0)'); this.rctx.fillStyle=sg;this.rctx.fill();
    this.rctx.fillStyle='#00f5ff';this.rctx.beginPath();this.rctx.arc(cx,cy,3,0,Math.PI*2);this.rctx.fill();
    [[-0.55,-0.72],[0.72,-0.88],[0.42,0.38],[-0.78,0.25]].forEach(([dx,dz])=>{ this.rctx.fillStyle='rgba(255,214,0,0.85)'; this.rctx.beginPath();this.rctx.arc(cx+dx*r,cy+dz*r,2,0,Math.PI*2);this.rctx.fill(); });
    this.rctx.fillStyle='rgba(255,80,0,0.6)'; this.rctx.beginPath();this.rctx.arc(cx+0.3*r,cy+0.5*r,1.5,0,Math.PI*2);this.rctx.fill();
    this.radarAngle=(this.radarAngle+0.04)%(Math.PI*2);
  }
};

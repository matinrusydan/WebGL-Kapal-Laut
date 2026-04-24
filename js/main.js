import { WebGL } from './webgl.js';
import { Ocean } from './ocean.js';
import { Environment } from './environment.js';
import { Ship } from './ship.js';
import { UI } from './ui.js';
import { State } from './state.js';
import { Config } from './config.js';
import { Math3D } from './math.js';

const App = {
  lastTime: performance.now(),

  async init() {
    // 1. Fetch seluruh komponen HTML sebelum memulai logic WebGL
    await UI.loadComponents();
    
    // 2. Inisialisasi engine
    WebGL.init();
    Ocean.init();
    Environment.init();
    
    // 3. Setup UI (bindings & render context 2D)
    UI.init(this);
    
    // 4. Set waktu default
    this.applyTOD();
    UI.updateDOM();
    
    // 5. Mulai simulasi
    this.loop();
  },

  setWind(l) { State.windLevel = l; UI.updateDOM(); },
  setWave(l) { State.waveLevel = l; UI.updateDOM(); },
  setTOD(t) { State.timeOfDay = t; this.applyTOD(); UI.updateDOM(); },
  setCamPreset(p) {
    if(p==='bridge'){State.camera.tSph.theta=0;State.camera.tSph.phi=0.22;State.camera.tSph.radius=38;}
    else if(p==='side'){State.camera.tSph.theta=Math.PI/2;State.camera.tSph.phi=0.38;State.camera.tSph.radius=65;}
    else if(p==='top'){State.camera.tSph.theta=0;State.camera.tSph.phi=0.08;State.camera.tSph.radius=85;}
  },

  applyTOD() {
    const l = State.light;
    if(State.timeOfDay==='day'){ l.skyTopColor=[0.102,0.29,0.541]; l.skyBotColor=[0.333,0.6,0.8]; l.sunVisible=true; l.moonVisible=false; l.starsVisible=false; l.ambColor=[0.227,0.353,0.541]; l.ambIntensity=1.4; l.sunIntensity=2.5; l.sunColor=[1,0.96,0.88]; l.moonIntensity=0.2; l.fogColor=[0.4,0.6,0.8]; l.fogDensity=0.002; }
    else if(State.timeOfDay==='night'){ l.skyTopColor=[0,0.032,0.125]; l.skyBotColor=[0,0.102,0.227]; l.sunVisible=false; l.moonVisible=true; l.starsVisible=true; l.ambColor=[0.04,0.094,0.188]; l.ambIntensity=0.9; l.sunIntensity=0.3; l.sunColor=[0.376,0.502,0.733]; l.moonIntensity=0.9; l.fogColor=[0,0.047,0.102]; l.fogDensity=0.003; }
    else { l.skyTopColor=[0.04,0.083,0.251]; l.skyBotColor=[0.541,0.188,0.063]; l.sunVisible=true; l.moonVisible=false; l.starsVisible=false; l.ambColor=[0.427,0.165,0.102]; l.ambIntensity=1.1; l.sunIntensity=1.4; l.sunColor=[1,0.533,0.267]; l.moonIntensity=0.5; l.fogColor=[0.3,0.15,0.05]; l.fogDensity=0.004; }
  },

  updateCamera() {
    const s=State.camera.sph, t=State.camera.tSph;
    s.theta+=(t.theta-s.theta)*0.07; s.phi+=(t.phi-s.phi)*0.07; s.radius+=(t.radius-s.radius)*0.07;
    State.camera.pos = [s.radius*Math.sin(s.phi)*Math.sin(s.theta), s.radius*Math.cos(s.phi), s.radius*Math.sin(s.phi)*Math.cos(s.theta)];
    State.camera.viewMat = Math3D.M4.lookAt(State.camera.pos, [0,5,0], [0,1,0]);
  },

  loop() {
    requestAnimationFrame(() => this.loop());
    const now = performance.now();
    const delta = Math.min((now - this.lastTime)/1000, 0.05);
    this.lastTime = now;

    // Hitung FPS
    State.frameCount++;
    if(now - State.lastFPS > 700){
      document.getElementById('fps-val').textContent = Math.round(State.frameCount / ((now - State.lastFPS) / 1000));
      State.frameCount = 0; State.lastFPS = now;
    }

    // Fisika dan Dinamika Gelombang
    const wc = Config.wind[State.windLevel], wv = Config.wave[State.waveLevel];
    State.simTime += delta * wc.speed;
    const shipH = Ocean.waveH(0,0,State.simTime, wv);
    
    State.ship.y += (shipH - State.ship.y) * 0.035;
    State.ship.rz += (Math.sin(State.simTime * 1.2) * 0.13 * wc.tiltMult - State.ship.rz) * 0.035;
    State.ship.rx += (Math.cos(State.simTime * 0.85) * 0.08 * wc.tiltMult - State.ship.rx) * 0.035;
    State.ship.propAngle += delta * 8 * (0.5 + State.windLevel * 0.3);

    State.light.fogDensity = 0.002 + State.windLevel * 0.001 + (State.waveLevel === 3 ? 0.002 : 0) + (State.timeOfDay === 'day' ? 0 : 0);
    this.updateCamera();
    UI.updateDynamics(shipH);

    // --- Render WebGL (Backend visual) ---
    const gl = WebGL.gl;
    gl.clearColor(State.light.fogColor[0], State.light.fogColor[1], State.light.fogColor[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.BLEND);
    Environment.drawSky();
    Environment.drawStars();
    Environment.drawCelestial();
    gl.enable(gl.BLEND);
    Ocean.draw();
    Ship.draw();
    Environment.drawDistant();

    // --- Render Canvas 2D (Overlay) ---
    UI.drawOverlays();
  }
};

window.onload = () => App.init();
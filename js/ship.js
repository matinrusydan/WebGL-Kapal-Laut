import { WebGL } from './webgl.js';
import { State } from './state.js';
import { Config } from './config.js';
import { Math3D } from './math.js';

export const Ship = {
  // Matriks Induk untuk seluruh kapal
  rootMatrix: null,
  mul(a, b) {
    return Math3D.M4.multiply(b, a);
  },

  // Fungsi utilitas untuk membuat matriks lokal objek
  createLocalMatrix(tx, ty, tz, rx=0, ry=0, rz=0, sx=1, sy=1, sz=1) {
    let m = Math3D.M4.translation(tx, ty, tz);
    // Terapkan rotasi lokal
    if(rz !== 0) m = this.mul(m, Math3D.M4.rotationZ(rz));
    if(ry !== 0) m = this.mul(m, Math3D.M4.rotationY(ry));
    if(rx !== 0) m = this.mul(m, Math3D.M4.rotationX(rx));
    // Terapkan skala
    if(sx !== 1 || sy !== 1 || sz !== 1) m = this.mul(m, Math3D.M4.scaling(sx, sy, sz));
    return m;
  },

  getWorldMatrix(localMatrix) {
    return this.mul(this.rootMatrix, localMatrix);
  },

  // Pembungkus fungsi draw untuk mempermudah pemanggilan dengan Local Transform
  drawHull(w,h,d,bowL,sternL, tx,ty,tz, rx,ry,rz, col, opts={shininess:50,metalness:0.3}) { 
    const local = this.createLocalMatrix(tx, ty, tz, rx, ry, rz);
    WebGL.drawMesh(WebGL.programs.main, WebGL.getHull(w,h,d,bowL,sternL), this.getWorldMatrix(local), col, opts); 
  },
  drawPart(w,h,d, tx,ty,tz, rx,ry,rz, col, opts={shininess:40,metalness:0.1}) { 
    const local = this.createLocalMatrix(tx, ty, tz, rx, ry, rz);
    WebGL.drawMesh(WebGL.programs.main, WebGL.getBox(w,h,d), this.getWorldMatrix(local), col, opts); 
  },
  drawCyl(rt,rb,hh,seg, tx,ty,tz, rx,ry,rz, col, opts={shininess:30,metalness:0.1}) { 
    const local = this.createLocalMatrix(tx, ty, tz, rx, ry, rz);
    WebGL.drawMesh(WebGL.programs.main, WebGL.getCyl(rt,rb,hh,seg), this.getWorldMatrix(local), col, opts); 
  },
  drawSph(r,seg, tx,ty,tz, col, emissive) { 
    const local = this.createLocalMatrix(tx, ty, tz);
    if(emissive) WebGL.drawFlat(WebGL.getSph(r,seg||12), this.getWorldMatrix(local), col); 
    else WebGL.drawMesh(WebGL.programs.main, WebGL.getSph(r,seg||12), this.getWorldMatrix(local), col.slice(0,3), {shininess:40}); 
  },
  
  draw() {
    const C = Config.colors;

    // --- SETUP ROOT MATRIX (HIERARKI UTAMA KAPAL) ---
    this.rootMatrix = Math3D.M4.translation(0, State.ship.y, 0); 
    this.rootMatrix = this.mul(this.rootMatrix, Math3D.M4.rotationZ(State.ship.rz)); 
    this.rootMatrix = this.mul(this.rootMatrix, Math3D.M4.rotationX(State.ship.rx));

    // --- 1. HULL (Badan Utama) ---
    this.drawHull(9.5, 3.0, 34, 9, 4,  0, -1.5, 0,  0,0,0, C.hullBot, {shininess:30, metalness:0.1});
    this.drawHull(10, 4.0, 35, 10, 5,  0, 2.0, 0,   0,0,0, C.hullMain, {shininess:60, metalness:0.4});
    this.drawHull(10.1, 0.2, 35.1, 10.1, 5.1, 0, 4.1, 0, 0,0,0, C.deck, {shininess:10, metalness:0});

    // --- 2. CONTAINERS (Kargo yang Dinamis) ---
    const contColors = [[0.8,0.2,0.2], [0.2,0.4,0.8], [0.8,0.8,0.8], [0.1,0.6,0.3], [0.9,0.5,0.1]];
    // Memberikan variasi tinggi tumpukan dan jeda (gap antar kontainer) agar lebih realistis
    for(let z=-2; z<=18; z+=4.5) {
      for(let x=-3.75; x<=3.75; x+=2.5) {
        let stackHeight = 2 + (Math.abs(Math.floor(x*3 + z*7)) % 3); 
        for(let y=0; y<stackHeight; y++) {
           let c = contColors[Math.abs(Math.floor(x*7+z*13+y*3)) % contColors.length];
           this.drawPart(2.35, 2.35, 4.2, x, 5.35 + y*2.4, z, 0,0,0, c, {shininess:15});
        }
      }
    }

    // --- 3. SUPERSTRUCTURE (Ruang Kemudi Bertingkat) ---
    const cabZ = -14;
    // Deck 1 (Dasar)
    this.drawPart(8.5, 3.5, 8.0,  0, 6.0, cabZ,      0,0,0, C.superW, {shininess:30});
    for(let wx=-3.0; wx<=3.0; wx+=1.5) {
      this.drawPart(0.8, 1.0, 0.2, wx, 6.2, cabZ+4.05, 0,0,0, C.porthole, {shininess:100, metalness:0.8});
    }

    // Deck 2 (Tengah)
    this.drawPart(7.5, 3.0, 7.0,  0, 9.25, cabZ-0.5, 0,0,0, C.superW, {shininess:30});
    for(let wx=-2.5; wx<=2.5; wx+=1.5) {
      this.drawPart(0.8, 1.0, 0.2, wx, 9.3, cabZ+3.05, 0,0,0, C.porthole, {shininess:100, metalness:0.8});
    }

    // Deck 3 (Bridge / Anjungan dengan Overhang)
    this.drawPart(9.5, 2.8, 6.0,  0, 12.15, cabZ-1.0, 0,0,0, C.cabin2, {shininess:40});
    for(let wx=-3.5; wx<=3.5; wx+=1.4) {
      this.drawPart(1.0, 1.2, 0.2, wx, 12.2, cabZ+2.05, 0,0,0, C.porthole, {shininess:100, metalness:0.8});
    }

    // Chimney (Cerobong)
    this.drawCyl(1.2, 1.5, 8.0, 16, 0, 12.0, -18.5, 0,0,0, C.chimney);
    this.drawCyl(1.3, 1.3, 1.0, 16, 0, 16.5, -18.5, 0,0,0, C.chimneyRed);

    // --- 4. DETAILS ---
    // Crane
    this.drawCyl(0.6, 0.8, 4.0, 12, 0, 6.2, 24, 0,0,0, C.crane, {shininess:50});
    this.drawCyl(0.15, 0.2, 10.0, 8, 0, 10.5, 20.5, 0.6,0,0, C.crane); 
    
    // Mast & Radar
    this.drawCyl(0.1, 0.15, 8.0, 8, 0, 17.5, cabZ-1.0, 0,0,0, C.deckMetal);
    this.drawCyl(0.05, 0.05, 0.5, 8, 0, 16.0, cabZ-1.0, 0,0,0, C.deckMetal);
    
    // Rotating Radar (Bisa berputar sendiri TAPI tetap menempel kokoh di atas kapal)
    this.drawPart(2.0, 0.15, 0.15, 0, 16.3, cabZ-1.0, 0, State.simTime*3, 0, C.deckMetal);

    // Propeller & Rudder
    this.drawPart(0.2, 3.5, 2.5, 0, -2.5, -20.5, 0,0,0, C.rudder, {shininess:50});
    for(let b=0;b<4;b++){ 
      const ba=b*(Math.PI/2)+State.ship.propAngle, bx=Math.sin(ba)*1.0, by=Math.cos(ba)*1.0; 
      let propLocal = this.createLocalMatrix(bx, by-2.0, -19.0, 0,0,ba+Math.PI/2, 0.4,1.0,0.1);
      WebGL.drawMesh(WebGL.programs.main, WebGL.getCyl(1.8,1.2,0.2,8), this.getWorldMatrix(propLocal), C.propeller, {shininess:90, metalness:0.9}); 
    }

    // --- 5. EFFECTS ---
    this.drawSph(0.3, 10, -5.1, 5.0, 20, [1,0.1,0,1], true); 
    this.drawSph(0.3, 10,  5.1, 5.0, 20, [0,0.9,0.2,1], true); 
    this.drawSph(0.25,10,  0, 21.0, cabZ-1.0, [1,0.8,0.5, 0.5+Math.sin(State.simTime*2)*0.5], true);

    // Fake Blob Shadow di permukaan laut (Terpisah dari Root Kapal karena harus rata dengan laut)
    let shadowMat = Math3D.M4.translation(0, 0.1, 0); 
    shadowMat = this.mul(shadowMat, Math3D.M4.scaling(14, 0.01, 30));
    WebGL.drawFlat(WebGL.getSph(1, 16), shadowMat, [0, 0, 0, 0.5]);
    
    // Bow Wave (Partikel buih haluan)
    const bowAlpha = 0.05 + Config.wind[State.windLevel].knots/60; 
    [-1,1].forEach(s => {
      const waveLocal = this.createLocalMatrix(s*4.5, -0.5, 29.5, 0, s*0.25, s*0.2, 1, 1, 1);
      WebGL.drawFlat(WebGL.getBox(0.8, 0.05, 7.0), this.getWorldMatrix(waveLocal), [1, 1, 1, bowAlpha]);
    });
  }
};
import { WebGL } from './webgl.js';
import { State } from './state.js';
import { Config } from './config.js';
import { Math3D } from './math.js';

export const Ship = {
  model(tx,ty,tz,rx,ry,rz,sx,sy,sz) {
    let b=Math3D.M4.translation(0,State.ship.y,0); b=Math3D.M4.multiply(b,Math3D.M4.rotationZ(State.ship.rz)); b=Math3D.M4.multiply(b,Math3D.M4.rotationX(State.ship.rx));
    let l=Math3D.M4.translation(tx,ty,tz); if(rz)l=Math3D.M4.multiply(l,Math3D.M4.rotationZ(rz)); if(rx)l=Math3D.M4.multiply(l,Math3D.M4.rotationX(rx)); if(ry)l=Math3D.M4.multiply(l,Math3D.M4.rotationY(ry)); if(sx!==undefined)l=Math3D.M4.multiply(l,Math3D.M4.scaling(sx,sy,sz));
    return Math3D.M4.multiply(b,l);
  },
  drawPart(w,h,d, tx,ty,tz, rx,ry,rz, col, opts={shininess:40,metalness:0.1}) { WebGL.drawMesh(WebGL.programs.main, WebGL.getBox(w,h,d), this.model(tx,ty,tz,rx,ry,rz), col, opts); },
  drawCyl(rt,rb,hh,seg, tx,ty,tz, rx,ry,rz, col, opts={shininess:30,metalness:0.1}) { WebGL.drawMesh(WebGL.programs.main, WebGL.getCyl(rt,rb,hh,seg), this.model(tx,ty,tz,rx,ry,rz), col, opts); },
  drawSph(r,seg, tx,ty,tz, col, emissive) { if(emissive) WebGL.drawFlat(WebGL.getSph(r,seg||12), this.model(tx,ty,tz), col); else WebGL.drawMesh(WebGL.programs.main, WebGL.getSph(r,seg||12), this.model(tx,ty,tz), col.slice(0,3), {shininess:40}); },
  drawTorus(R,r,s1,s2, tx,ty,tz, rx,ry,rz, col) { WebGL.drawMesh(WebGL.programs.main, WebGL.getTorus(R,r,s1,s2), this.model(tx,ty,tz,rx,ry,rz), col, {shininess:35}); },
  
  draw() {
    const C = Config.colors;
    
    // Hull
    this.drawPart(9.8,3.2,34, 0,-1.8,0, 0,0,0, C.hullBot); this.drawPart(7.0,3.2,10, 0,-1.8,20, 0,0,0, C.hullBot); this.drawPart(4.5,3.0,6, 0,-1.8,27, 0.05,0,0, C.hullBot); this.drawPart(7.0,3.2,5, 0,-1.8,-19, 0,0,0, C.hullBot);
    this.drawPart(1.6,0.5,46, 0,-3.5,0, 0,0,0, C.keel); [-1,1].forEach(s=>this.drawPart(0.3,0.7,36, s*4.85,-2.6,0, 0,0,s*0.18, C.keel));
    const hOpt={shininess:55,metalness:0.4};
    this.drawPart(10,4.5,34, 0,1.2,0, 0,0,0, C.hullMain, hOpt); this.drawPart(8.5,4.5,10, 0,1.2,20, 0,0,0, C.hullMain, hOpt); this.drawPart(6.0,4.2,8, 0,1.1,27, 0.08,0,0, C.hullMain, hOpt); this.drawPart(3.8,3.6,5, 0,0.9,32, 0.15,0,0, C.hullMain, hOpt);
    this.drawPart(2.0,3.0,3, 0,0.5,35, 0.25,0,0, C.hullDark, {shininess:40,metalness:0.3}); this.drawPart(1.2,3.5,2.0, 0,0.2,37.2, 0,0,0, C.hullDark);
    this.drawPart(8.5,4.5,5, 0,1.2,-19, 0,0,0, C.hullMain, hOpt); this.drawPart(7.0,4.2,4, 0,1.2,-23, -0.05,0,0, C.hullMain, hOpt); this.drawPart(9.2,5.0,1.5, 0,1.0,-26.5, 0,0,0, C.hullDark, {shininess:40,metalness:0.3});
    this.drawPart(10.05,0.28,34, 0,-0.12,0, 0,0,0, C.white); this.drawPart(8.55,0.28,10, 0,-0.12,20, 0,0,0, C.white); this.drawPart(6.05,0.28,8, 0,-0.12,27, 0.08,0,0, C.white);
    let bm=this.model(0,-3.0,36.5); bm=Math3D.M4.multiply(bm,Math3D.M4.scaling(1.15,0.85,1.6)); WebGL.drawMesh(WebGL.programs.main, WebGL.getSph(1.8,14), bm, C.hullBot, {shininess:30,metalness:0.1});
    
    // Deck
    this.drawPart(10,0.38,46, 0,3.6,0, 0,0,0, C.deck,{shininess:12}); this.drawPart(8.5,0.3,14, 0,4.2,25, 0,0,0, C.deck,{shininess:12}); this.drawPart(9.5,0.35,8, 0,4.2,-20, 0,0,0, C.deck,{shininess:12});
    [-1,1].forEach(s=>{ this.drawPart(0.45,0.65,46, s*5.0,3.85,0, 0,0,0, C.deckMetal,{shininess:60,metalness:0.8}); this.drawPart(0.45,0.55,14, s*4.3,4.45,25, 0,0,0, C.deckMetal,{shininess:60,metalness:0.8}); this.drawPart(0.45,0.55,8, s*4.8,4.45,-20, 0,0,0, C.deckMetal,{shininess:60,metalness:0.8}); });
    
    // Hatches & Bollards
    [[0,4.5,10],[0,4.5,0],[0,4.5,-10]].forEach(([x,y,z])=>{ this.drawPart(7.5,0.5,9.5,x,y,z,0,0,0,C.hatch); this.drawPart(7.8,0.18,9.8,x,y+0.35,z,0,0,0,C.deckMetal,{shininess:50,metalness:0.6}); [-2.5,0,2.5].forEach(dz=>this.drawPart(7.5,0.12,0.15,x,y+0.56,z+dz,0,0,0,C.deckMetal)); });
    [[-3.5,31],[-1.5,31],[1.5,31],[3.5,31],[-4.0,-22],[4.0,-22],[-4.5,15],[-4.5,5],[-4.5,-5],[-4.5,-15],[4.5,15],[4.5,5],[4.5,-5],[4.5,-15]].forEach(([x,z])=>{ this.drawCyl(0.2,0.25,0.65,8,x,3.95,z,0,0,0,C.bollard,{shininess:60,metalness:0.7}); this.drawCyl(0.28,0.28,0.15,8,x,4.3,z,0,0,0,C.bollard,{shininess:60,metalness:0.7}); });
    
    // Superstructure
    this.drawPart(9.0,3.8,11, 0,5.5,-17, 0,0,0, C.superW,{shininess:35}); this.drawPart(8.5,3.6,10, 0,9.2,-17.5, 0,0,0, C.superW,{shininess:35}); this.drawPart(8.0,3.2,9, 0,12.7,-18, 0,0,0, C.cabin2,{shininess:35}); this.drawPart(7.5,2.8,8, 0,15.8,-18.2, 0,0,0, C.cabin2,{shininess:40}); this.drawPart(7.8,0.35,8.4, 0,17.3,-18.2, 0,0,0, C.deckMetal,{shininess:70,metalness:0.8}); this.drawPart(6.5,0.3,6.5, 0,17.68,-18.2, 0,0,0, C.deckMetal,{shininess:70,metalness:0.8});
    [-1,1].forEach(s=>{ this.drawPart(2.5,2.8,3, s*5.0,15.8,-18.2, 0,0,0, C.cabin2,{shininess:35}); this.drawPart(2.5,0.32,3.2, s*5.0,17.3,-18.2, 0,0,0, C.deckMetal,{shininess:70,metalness:0.8}); });
    
    // Funnel & Mast & Crane
    this.drawCyl(1.8,2.2,7.5,20, 0,18.5,-19, 0,0,0, C.chimney); this.drawCyl(2.0,2.0,0.8,20, 0,22.1,-19, 0,0,0, C.chimneyRed); this.drawCyl(1.85,1.85,0.5,20, 0,22.95,-19, 0,0,0, C.chimney);
    this.drawCyl(1.0,1.2,5.5,16, 3.2,18.2,-19, 0,0,0, C.chimney); this.drawCyl(1.15,1.15,0.6,16, 3.2,21.1,-19, 0,0,0, C.chimneyRed); this.drawCyl(1.1,1.0,0.4,16, 3.2,21.75,-19, 0,0,0, C.chimney);
    this.drawCyl(0.15,0.2,20,10, 0,4.6,28, 0,0,0, C.railing); [10,15,19].forEach(y=>this.drawCyl(0.07,0.07,12,8, 0,4.6+y,28, 0,Math.PI/2,0, C.railing)); this.drawCyl(0.55,0.55,0.5,16, 0,4.6+15.5,28, 0,0,0, C.deckMetal);
    [-1,1].forEach(s=>{ this.drawCyl(0.7,0.9,5,12, s*2.5,4.6,5, 0,0,0, C.crane,{shininess:50}); this.drawCyl(0.18,0.24,12,10, s*4.5,10.5,5, 0,0,-s*0.55, C.crane); this.drawCyl(0.04,0.04,12,6, s*2.5,10.5,5, 0,0,-s*0.18, C.railing); });
    
    // Anchors & Propeller
    [-1,1].forEach(s=>{ this.drawCyl(0.2,0.2,2.5,8, s*3.5,1.2,30, 0,0,s*0.35, C.anchor); this.drawPart(0.22,2.8,0.22, s*3.5,-0.3,30, 0,0,0, C.anchor); this.drawPart(2.8,0.2,0.2, s*3.5,-0.35,30, 0,0,0, C.anchor); this.drawPart(0.2,1.4,0.35, s*3.5,-1.7,30.4, 0.4,0,0, C.anchor); this.drawPart(0.2,1.4,0.35, s*3.5,-1.7,29.6, -0.4,0,0, C.anchor); this.drawCyl(0.35,0.35,0.3,12, s*3.5,3.65,30, 0,0,0, C.deckMetal); });
    this.drawPart(0.32,4.8,3.2, 0,-2.8,-26.5, 0,0,0, C.rudder,{shininess:50}); this.drawPart(1.5,1.5,3.0, 0,-2.9,-23.5, 0,0,0, C.hullBot);
    for(let b=0;b<5;b++){ const ba=b*(Math.PI*2/5)+State.ship.propAngle, bx=Math.sin(ba)*1.3, by=Math.cos(ba)*1.3; let m=Math3D.M4.translation(0,State.ship.y,-25); m=Math3D.M4.multiply(m,Math3D.M4.rotationZ(State.ship.rz)); m=Math3D.M4.multiply(m,Math3D.M4.rotationX(State.ship.rx)); m=Math3D.M4.multiply(m,Math3D.M4.translation(bx,by-2.8,0)); m=Math3D.M4.multiply(m,Math3D.M4.rotationZ(ba+Math.PI/2)); m=Math3D.M4.multiply(m,Math3D.M4.scaling(0.45,1.0,0.2)); WebGL.drawMesh(WebGL.programs.main, WebGL.getCyl(2.4,1.8,0.2,8), m, C.propeller, {shininess:90,metalness:0.95}); }
    
    // Lights & Particles
    this.drawSph(0.3,10, -5.05,4.6,25, [1,0.1,0,1], true); this.drawSph(0.3,10, 5.05,4.6,25, [0,0.9,0.2,1], true); this.drawSph(0.26,10, 0,4.6,-26.5, [1,1,1,1], true);
    const navFlash=0.5+Math.sin(State.simTime*2.2)*0.5; this.drawSph(0.25,10, 0,4.6+19.5,28, [1,0.85,0.5,navFlash], true);
    [0,3.2].forEach((sx,si)=>{ for(let i=0;i<8;i++){ const t3=(State.simTime*0.45+i*0.6+si*0.8)%5, px=sx+Math.sin(State.simTime*0.65+i)*0.6*Config.wind[State.windLevel].speed, py=23.5+t3*2.0, pz=-19+t3*0.8*(State.windLevel===3?2.2:1.0), alpha=Math.max(0,0.3-t3/5*0.3)*(0.45+State.windLevel*0.18), sc=0.55+t3*0.4+(State.windLevel===3?t3*0.22:0); let m=Math3D.M4.translation(0,State.ship.y,0); m=Math3D.M4.multiply(m,Math3D.M4.rotationZ(State.ship.rz)); m=Math3D.M4.multiply(m,Math3D.M4.rotationX(State.ship.rx)); m=Math3D.M4.multiply(m,Math3D.M4.translation(px,py,pz)); m=Math3D.M4.multiply(m,Math3D.M4.scaling(sc,sc,sc)); WebGL.drawFlat(WebGL.getSph(0.65,8), m, [0.22,0.28,0.35,alpha]); }});
    const bowAlpha=0.08+Config.wind[State.windLevel].knots/55; [-1,1].forEach(s=>{ WebGL.drawFlat(WebGL.getBox(3.0,0.01,8.0), this.model(s*5.5,0.05,28, 0,0,s*0.55), [1,1,1,bowAlpha]); });
  }
};
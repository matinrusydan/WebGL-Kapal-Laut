import { WebGL } from './webgl.js';
import { State } from './state.js';
import { Config } from './config.js';
import { Ocean } from './ocean.js';
import { Math3D } from './math.js';

export const Environment = {
  skyProg: null, starProg: null, skyMesh: null, starBuf: null,
  distShipData: [ {x:-100,z:-80,sc:0.85}, {x:130,z:-110,sc:0.6}, {x:80,z:50,sc:0.45}, {x:-150,z:30,sc:0.35} ],
  buoyData: [],

  init() {
    this.skyProg=WebGL.createProgram(`attribute vec3 aPosition; uniform mat4 uProjection; uniform mat4 uView; varying vec3 vWorldPos; void main(){ gl_Position=(uProjection*mat4(mat3(uView))*vec4(aPosition,1.0)).xyww; vWorldPos=aPosition; }`,`precision mediump float; uniform vec3 uTopColor; uniform vec3 uBottomColor; varying vec3 vWorldPos; void main(){ float h=normalize(vWorldPos).y, t=max(pow(max(h,0.0),0.6),0.0); gl_FragColor=vec4(mix(uBottomColor,uTopColor,t),1.0); }`);
    this.starProg=WebGL.createProgram(`attribute vec3 aPosition; uniform mat4 uProjection; uniform mat4 uView; void main(){ gl_Position=(uProjection*mat4(mat3(uView))*vec4(aPosition,1.0)).xyww; gl_PointSize=1.5;}`,`precision mediump float; uniform float uAlpha; void main(){ gl_FragColor=vec4(1.0,1.0,0.98,uAlpha); }`);
    this.skyMesh=WebGL.uploadMesh(WebGL.buildSph(800,16));
    const starPos=[]; for(let i=0;i<4000;i++){ const theta=Math.random()*Math.PI*2, phi=Math.acos(2*Math.random()-1)*0.5, r=400+Math.random()*200; starPos.push(r*Math.sin(phi)*Math.cos(theta),r*Math.cos(phi),r*Math.sin(phi)*Math.sin(theta)); }
    this.starBuf=WebGL.createBuffer(new Float32Array(starPos), WebGL.gl.ARRAY_BUFFER);
    for(let i=0;i<6;i++) this.buoyData.push({x:(Math.random()-0.5)*150, z:(Math.random()-0.5)*150, phase:Math.random()*Math.PI*2, col:i%2===0?[1,0.267,0]:[1,0.8,0]});
  },
  drawSky() {
    WebGL.gl.depthMask(false); WebGL.gl.useProgram(this.skyProg);
    WebGL.gl.uniformMatrix4fv(WebGL.gl.getUniformLocation(this.skyProg,'uProjection'),false,State.camera.projMat); WebGL.gl.uniformMatrix4fv(WebGL.gl.getUniformLocation(this.skyProg,'uView'),false,State.camera.viewMat);
    WebGL.gl.uniform3fv(WebGL.gl.getUniformLocation(this.skyProg,'uTopColor'),State.light.skyTopColor); WebGL.gl.uniform3fv(WebGL.gl.getUniformLocation(this.skyProg,'uBottomColor'),State.light.skyBotColor);
    WebGL.gl.bindBuffer(WebGL.gl.ARRAY_BUFFER, this.skyMesh.pos); const pa=WebGL.gl.getAttribLocation(this.skyProg,'aPosition'); WebGL.gl.enableVertexAttribArray(pa); WebGL.gl.vertexAttribPointer(pa,3,WebGL.gl.FLOAT,false,0,0);
    WebGL.gl.bindBuffer(WebGL.gl.ELEMENT_ARRAY_BUFFER, this.skyMesh.idx); WebGL.gl.drawElements(WebGL.gl.TRIANGLES, this.skyMesh.count, WebGL.gl.UNSIGNED_SHORT, 0); WebGL.gl.depthMask(true);
  },
  drawStars() {
    if(!State.light.starsVisible) return;
    WebGL.gl.depthMask(false); WebGL.gl.useProgram(this.starProg);
    WebGL.gl.uniformMatrix4fv(WebGL.gl.getUniformLocation(this.starProg,'uProjection'),false,State.camera.projMat); WebGL.gl.uniformMatrix4fv(WebGL.gl.getUniformLocation(this.starProg,'uView'),false,State.camera.viewMat);
    WebGL.gl.uniform1f(WebGL.gl.getUniformLocation(this.starProg,'uAlpha'),0.85);
    WebGL.gl.bindBuffer(WebGL.gl.ARRAY_BUFFER, this.starBuf); const pa=WebGL.gl.getAttribLocation(this.starProg,'aPosition'); WebGL.gl.enableVertexAttribArray(pa); WebGL.gl.vertexAttribPointer(pa,3,WebGL.gl.FLOAT,false,0,0);
    WebGL.gl.drawArrays(WebGL.gl.POINTS,0,4000); WebGL.gl.depthMask(true);
  },
  drawCelestial() {
    if(State.light.sunVisible) { const sp=[300,200,-400]; WebGL.drawFlat(WebGL.getSph(12,16), Math3D.M4.translation(...sp), [1,0.8,0.267,1]); WebGL.drawFlat(WebGL.getSph(20,16), Math3D.M4.translation(...sp), [1,0.667,0,0.08]); }
    if(State.light.moonVisible) { const mp=[-120,160,-300]; WebGL.drawFlat(WebGL.getSph(6,16), Math3D.M4.translation(...mp), [1,0.992,0.91,1]); WebGL.drawFlat(WebGL.getSph(9,16), Math3D.M4.translation(...mp), [1,0.992,0.91,0.06]); }
  },
  drawDistant() {
    const wv=Config.wave[State.waveLevel], wc=Config.wind[State.windLevel];
    this.distShipData.forEach((ds,i)=>{
      const h=Ocean.waveH(ds.x*0.5,ds.z*0.5,State.simTime,wv)*0.6+0.5, rz=Math.sin(State.simTime*0.9+i)*0.06*wc.tiltMult;
      const m=(tx,ty,tz,rx,ry,rz2)=>{ let m=Math3D.M4.translation(ds.x,h,ds.z); m=Math3D.M4.multiply(m,Math3D.M4.rotationZ(rz)); m=Math3D.M4.multiply(m,Math3D.M4.scaling(ds.sc,ds.sc,ds.sc)); m=Math3D.M4.multiply(m,Math3D.M4.translation(tx,ty,tz)); if(rz2)m=Math3D.M4.multiply(m,Math3D.M4.rotationZ(rz2)); return m; };
      WebGL.drawMesh(WebGL.programs.main,WebGL.getBox(4,2,12),m(0,0.8,0),Config.colors.hullMain,{shininess:30});
      WebGL.drawMesh(WebGL.programs.main,WebGL.getBox(2.5,2.5,4),m(0,2.8,-1),[0.8,0.8,0.8],{shininess:20});
    });
    this.buoyData.forEach(b=>{
      const h=Ocean.waveH(b.x,b.z,State.simTime,wv)+0.4, rz=Math.sin(State.simTime+b.phase)*0.35*wc.tiltMult;
      const m=Math3D.M4.multiply(Math3D.M4.translation(b.x,h,b.z),Math3D.M4.rotationZ(rz));
      WebGL.drawMesh(WebGL.programs.main,WebGL.getSph(0.7,12),m,b.col,{shininess:40,metalness:0.2});
      WebGL.drawMesh(WebGL.programs.main,WebGL.getCyl(0.06,0.06,1.2,6),Math3D.M4.translation(b.x,h+0.7,b.z),[0.8,0.8,0.8],{shininess:20});
      WebGL.drawFlat(WebGL.getSph(0.15,8),Math3D.M4.translation(b.x,h+1.5,b.z),[...b.col,0.9]);
    });
  }
};
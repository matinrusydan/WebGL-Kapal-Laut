import { WebGL } from './webgl.js';
import { State } from './state.js';
import { Config } from './config.js';

export const Ocean = {
  prog: null, geo: { pos: null, idx: null, count: 0 },
  
  init() {
    this.prog = WebGL.createProgram(
      `attribute vec2 aXY; uniform mat4 uProjection; uniform mat4 uView; uniform float uAmp; uniform float uFreq; uniform float uChop; uniform float uTime; varying vec3 vWorldPos; varying vec3 vNormal; float waveH(float x,float y){float a=uAmp,f=uFreq,ch=uChop,t=uTime;float h=0.0;h+=sin(x*0.10*f+t*1.0)*a*0.42;h+=cos(y*0.14*f+t*1.3)*a*0.33;h+=sin((x+y)*0.08*f+t*0.75)*a*0.18;h+=cos(x*0.22*f-t*0.6)*a*0.12;h+=sin(x*0.45*f+t*2.2)*a*ch*0.3;h+=cos(y*0.38*f+t*1.9)*a*ch*0.25;h+=sin((x-y)*0.3*f+t*2.8)*a*ch*0.15;h+=sin(x*0.04*f-t*0.4)*a*0.10;return h;} void main(){float x=aXY.x,y=aXY.y,h=waveH(x,y),eps=0.5,hx=waveH(x+eps,y),hy=waveH(x,y+eps);vWorldPos=vec3(x,h,y);vNormal=normalize(vec3(-(hx-h)/eps,1.0,-(hy-h)/eps));gl_Position=uProjection*uView*vec4(x,h,y,1.0);}`,
      `precision mediump float; uniform vec3 uColor; uniform vec3 uCamPos; uniform float uShininess; uniform float uFoamAmount; uniform float uFogDensity; uniform vec3 uFogColor; uniform float uOpacity; uniform vec3 uSunDir; uniform vec3 uSunColor; uniform float uSunIntensity; uniform vec3 uMoonDir; uniform vec3 uMoonColor; uniform float uMoonIntensity; uniform vec3 uAmbColor; uniform float uAmbIntensity; varying vec3 vWorldPos; varying vec3 vNormal; void main(){ vec3 N=normalize(vNormal),V=normalize(uCamPos-vWorldPos),ambient=uAmbColor*uAmbIntensity*uColor; vec3 L1=normalize(uSunDir); float diff1=max(dot(N,L1),0.0); vec3 R1=reflect(-L1,N); float spec1=pow(max(dot(V,R1),0.0),uShininess); vec3 sunC=uSunColor*uSunIntensity*(diff1*uColor+spec1*vec3(0.5,0.7,1.0)*0.8); vec3 L2=normalize(uMoonDir); float diff2=max(dot(N,L2),0.0); vec3 moonC=uMoonColor*uMoonIntensity*diff2*uColor; vec3 c=ambient+sunC+moonC; c=mix(c,vec3(0.9,0.95,1.0),uFoamAmount*clamp(1.0-N.y,0.0,1.0)); float f=1.0-exp(-uFogDensity*uFogDensity*length(vWorldPos)*length(vWorldPos)); gl_FragColor=vec4(mix(c,uFogColor,clamp(f,0.0,1.0)),uOpacity); }`
    );
    const OCEAN_SIZE=500, OCEAN_SEG=100, xy=[], idx=[];
    for(let j=0;j<=OCEAN_SEG;j++) for(let i=0;i<=OCEAN_SEG;i++) xy.push((i/OCEAN_SEG-0.5)*OCEAN_SIZE, (j/OCEAN_SEG-0.5)*OCEAN_SIZE);
    for(let j=0;j<OCEAN_SEG;j++) for(let i=0;i<OCEAN_SEG;i++){ const b=j*(OCEAN_SEG+1)+i; idx.push(b,b+OCEAN_SEG+1,b+1, b+1,b+OCEAN_SEG+1,b+OCEAN_SEG+2); }
    this.geo.pos = WebGL.createBuffer(new Float32Array(xy));
    this.geo.idx = WebGL.createBuffer(new Uint32Array(idx), WebGL.gl.ELEMENT_ARRAY_BUFFER);
    this.geo.count = idx.length;
  },

  waveH(x, y, t, wc) {
    const a=wc.amp, f=wc.freq, ch=wc.chop; let h=0;
    h+=Math.sin(x*0.10*f+t*1.0)*a*0.42; h+=Math.cos(y*0.14*f+t*1.3)*a*0.33; h+=Math.sin((x+y)*0.08*f+t*0.75)*a*0.18; h+=Math.cos(x*0.22*f-t*0.6)*a*0.12; h+=Math.sin(x*0.45*f+t*2.2)*a*ch*0.3; h+=Math.cos(y*0.38*f+t*1.9)*a*ch*0.25; h+=Math.sin((x-y)*0.3*f+t*2.8)*a*ch*0.15; h+=Math.sin(x*0.04*f-t*0.4)*a*0.10;
    return h;
  },

  draw() {
    const wv=Config.wave[State.waveLevel];
    WebGL.gl.useProgram(this.prog);
    const u=(n)=>WebGL.gl.getUniformLocation(this.prog,n);
    WebGL.gl.uniformMatrix4fv(u('uProjection'),false,State.camera.projMat); WebGL.gl.uniformMatrix4fv(u('uView'),false,State.camera.viewMat);
    WebGL.gl.uniform1f(u('uAmp'),wv.amp); WebGL.gl.uniform1f(u('uFreq'),wv.freq); WebGL.gl.uniform1f(u('uChop'),wv.chop); WebGL.gl.uniform1f(u('uTime'),State.simTime);
    WebGL.gl.uniform3fv(u('uColor'),wv.color); WebGL.gl.uniform3fv(u('uCamPos'),State.camera.pos);
    WebGL.gl.uniform1f(u('uShininess'),280); WebGL.gl.uniform1f(u('uFoamAmount'),Math.min(0.5,wv.chop*0.8+(State.windLevel-1)*0.15)); WebGL.gl.uniform1f(u('uOpacity'),0.97);
    WebGL.setLightUniforms(this.prog);
    const pa=WebGL.gl.getAttribLocation(this.prog,'aXY'); WebGL.gl.bindBuffer(WebGL.gl.ARRAY_BUFFER, this.geo.pos); WebGL.gl.enableVertexAttribArray(pa); WebGL.gl.vertexAttribPointer(pa,2,WebGL.gl.FLOAT,false,0,0);
    WebGL.gl.bindBuffer(WebGL.gl.ELEMENT_ARRAY_BUFFER, this.geo.idx); WebGL.gl.drawElements(WebGL.gl.TRIANGLES, this.geo.count, WebGL.gl.UNSIGNED_INT, 0);
  }
};
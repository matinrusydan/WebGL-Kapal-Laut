import { WebGL } from './webgl.js';
import { State } from './state.js';
import { Config } from './config.js';

export const Ocean = {
  prog: null, geo: { pos: null, idx: null, count: 0 },
  
  init() {
    this.prog = WebGL.createProgram(
      `attribute vec2 aXY; uniform mat4 uProjection; uniform mat4 uView; uniform float uTime; uniform vec4 uWaveA; uniform vec4 uWaveB; uniform vec4 uWaveC; uniform vec4 uWaveD; varying vec3 vWorldPos; varying vec3 vNormal; vec3 gerstnerWave(vec4 wave, vec3 p, inout vec3 tangent, inout vec3 binormal) { float steepness = wave.z; float wavelength = wave.w; float k = 2.0 * 3.14159265 / wavelength; float c = sqrt(9.8 / k); vec2 d = normalize(wave.xy); float f = k * (dot(d, p.xz) - c * uTime * 1.5); float a = steepness / k; float WA = a * k; float S = sin(f); float C = cos(f); tangent.x -= d.x * d.x * (WA * S); tangent.y += d.x * (WA * C); tangent.z -= d.x * d.y * (WA * S); binormal.x -= d.x * d.y * (WA * S); binormal.y += d.y * (WA * C); binormal.z -= d.y * d.y * (WA * S); return vec3(d.x * (a * C), a * S, d.y * (a * C)); } void main() { vec3 gridPoint = vec3(aXY.x, 0.0, aXY.y); vec3 tangent = vec3(1.0, 0.0, 0.0); vec3 binormal = vec3(0.0, 0.0, 1.0); vec3 p = gridPoint; p += gerstnerWave(uWaveA, gridPoint, tangent, binormal); p += gerstnerWave(uWaveB, gridPoint, tangent, binormal); p += gerstnerWave(uWaveC, gridPoint, tangent, binormal); p += gerstnerWave(uWaveD, gridPoint, tangent, binormal); vWorldPos = p; vNormal = normalize(cross(binormal, tangent)); gl_Position = uProjection * uView * vec4(p, 1.0); }`,
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
    const baseW = 40.0 / wv.freq; const s = wv.chop * 0.6;
    WebGL.gl.uniform4f(u('uWaveA'), 1.0, 0.4, s, baseW);
    WebGL.gl.uniform4f(u('uWaveB'), 0.8, 0.8, s * 0.8, baseW * 0.5);
    WebGL.gl.uniform4f(u('uWaveC'), -0.2, 0.5, s * 0.6, baseW * 0.25);
    WebGL.gl.uniform4f(u('uWaveD'), 0.4, -0.6, s * 0.4, baseW * 0.15);
    WebGL.gl.uniform1f(u('uTime'), State.simTime);
    WebGL.gl.uniform3fv(u('uColor'),wv.color); WebGL.gl.uniform3fv(u('uCamPos'),State.camera.pos);
    WebGL.gl.uniform1f(u('uShininess'),280); WebGL.gl.uniform1f(u('uFoamAmount'),Math.min(0.5,wv.chop*0.8+(State.windLevel-1)*0.15)); WebGL.gl.uniform1f(u('uOpacity'),0.97);
    WebGL.setLightUniforms(this.prog);
    const pa=WebGL.gl.getAttribLocation(this.prog,'aXY'); WebGL.gl.bindBuffer(WebGL.gl.ARRAY_BUFFER, this.geo.pos); WebGL.gl.enableVertexAttribArray(pa); WebGL.gl.vertexAttribPointer(pa,2,WebGL.gl.FLOAT,false,0,0);
    WebGL.gl.bindBuffer(WebGL.gl.ELEMENT_ARRAY_BUFFER, this.geo.idx); WebGL.gl.drawElements(WebGL.gl.TRIANGLES, this.geo.count, WebGL.gl.UNSIGNED_INT, 0);
  }
};
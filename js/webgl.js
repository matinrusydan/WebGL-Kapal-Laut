import { State } from './state.js';
import { Math3D } from './math.js';

export const WebGL = {
  gl: null, canvas: null,
  programs: {}, meshes: { BOX: {}, CYL: {}, SPH: {}, TORUS: {} },

  init() {
    this.canvas = document.getElementById('webgl-canvas');
    this.gl = this.canvas.getContext('webgl', {antialias:true, alpha:false});
    if(!this.gl) throw new Error('No WebGL');
    this.gl.getExtension('OES_element_index_uint');
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    this.compileShaders();
    this.resize();
  },

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    State.camera.projMat = Math3D.M4.perspective(60*Math.PI/180, window.innerWidth/window.innerHeight, 0.1, 2000);
  },

  createShader(type, src) {
    const s=this.gl.createShader(type); this.gl.shaderSource(s,src); this.gl.compileShader(s);
    if(!this.gl.getShaderParameter(s,this.gl.COMPILE_STATUS)){console.error(this.gl.getShaderInfoLog(s)); return null;}
    return s;
  },
  createProgram(vs, fs) {
    const p=this.gl.createProgram();
    this.gl.attachShader(p,this.createShader(this.gl.VERTEX_SHADER,vs));
    this.gl.attachShader(p,this.createShader(this.gl.FRAGMENT_SHADER,fs));
    this.gl.linkProgram(p);
    if(!this.gl.getProgramParameter(p,this.gl.LINK_STATUS)){console.error(this.gl.getProgramInfoLog(p)); return null;}
    return p;
  },
  createBuffer(data, type=this.gl.ARRAY_BUFFER, usage=this.gl.STATIC_DRAW) {
    const b=this.gl.createBuffer(); this.gl.bindBuffer(type,b); this.gl.bufferData(type,data,usage); return b;
  },
  uploadMesh(geo) {
    return {
      pos: this.createBuffer(geo.positions), nrm: this.createBuffer(geo.normals),
      uv:  this.createBuffer(geo.uvs), idx: this.createBuffer(geo.indices, this.gl.ELEMENT_ARRAY_BUFFER),
      count: geo.indices.length
    };
  },

  buildBox(w, h, d) {
    const hw=w/2, hh=h/2, hd=d/2, pos=[], nrm=[], uv=[], idx=[];
    const faces=[ [[-hw,-hh,hd],[hw,-hh,hd],[hw,hh,hd],[-hw,hh,hd],[0,0,1]], [[hw,-hh,-hd],[-hw,-hh,-hd],[-hw,hh,-hd],[hw,hh,-hd],[0,0,-1]], [[-hw,-hh,-hd],[-hw,-hh,hd],[-hw,hh,hd],[-hw,hh,-hd],[-1,0,0]], [[hw,-hh,hd],[hw,-hh,-hd],[hw,hh,-hd],[hw,hh,hd],[1,0,0]], [[-hw,hh,hd],[hw,hh,hd],[hw,hh,-hd],[-hw,hh,-hd],[0,1,0]], [[-hw,-hh,-hd],[hw,-hh,-hd],[hw,-hh,hd],[-hw,-hh,hd],[0,-1,0]] ];
    faces.forEach(([p0,p1,p2,p3,n])=>{ const b=pos.length/3; [p0,p1,p2,p3].forEach(p=>{pos.push(...p);nrm.push(...n);uv.push(0,0);}); idx.push(b,b+1,b+2, b,b+2,b+3); });
    return {positions:new Float32Array(pos),normals:new Float32Array(nrm),uvs:new Float32Array(uv),indices:new Uint16Array(idx)};
  },
  buildCyl(rt, rb, h, seg) {
    const pos=[], nrm=[], uv=[], idx=[], hh=h/2;
    for(let i=0;i<=seg;i++){ const a=i/seg*Math.PI*2, ca=Math.cos(a), sa=Math.sin(a), nx=ca, nz=sa; pos.push(rt*ca,hh,rt*sa); nrm.push(nx,0,nz); uv.push(i/seg,1); pos.push(rb*ca,-hh,rb*sa); nrm.push(nx,0,nz); uv.push(i/seg,0); }
    for(let i=0;i<seg;i++){ const b=i*2; idx.push(b,b+1,b+2); idx.push(b+1,b+3,b+2); }
    const tc=pos.length/3; pos.push(0,hh,0); nrm.push(0,1,0); uv.push(0.5,0.5); for(let i=0;i<=seg;i++){const a=i/seg*Math.PI*2; pos.push(rt*Math.cos(a),hh,rt*Math.sin(a)); nrm.push(0,1,0); uv.push(0.5+Math.cos(a)*0.5,0.5+Math.sin(a)*0.5);} for(let i=0;i<seg;i++) idx.push(tc,tc+i+1,tc+i+2);
    const bc=pos.length/3; pos.push(0,-hh,0); nrm.push(0,-1,0); uv.push(0.5,0.5); for(let i=0;i<=seg;i++){const a=i/seg*Math.PI*2; pos.push(rb*Math.cos(a),-hh,rb*Math.sin(a)); nrm.push(0,-1,0); uv.push(0.5+Math.cos(a)*0.5,0.5+Math.sin(a)*0.5);} for(let i=0;i<seg;i++) idx.push(bc,bc+i+2,bc+i+1);
    return {positions:new Float32Array(pos),normals:new Float32Array(nrm),uvs:new Float32Array(uv),indices:new Uint16Array(idx)};
  },
  buildSph(r, segs) {
    const pos=[], nrm=[], uv=[], idx=[];
    for(let j=0;j<=segs;j++){ const phi=j/segs*Math.PI; for(let i=0;i<=segs;i++){ const theta=i/segs*Math.PI*2, x=Math.sin(phi)*Math.cos(theta), y=Math.cos(phi), z=Math.sin(phi)*Math.sin(theta); pos.push(r*x,r*y,r*z); nrm.push(x,y,z); uv.push(i/segs,j/segs); } }
    for(let j=0;j<segs;j++) for(let i=0;i<segs;i++){ const b=j*(segs+1)+i; idx.push(b,b+segs+1,b+1); idx.push(b+1,b+segs+1,b+segs+2); }
    return {positions:new Float32Array(pos),normals:new Float32Array(nrm),uvs:new Float32Array(uv),indices:new Uint16Array(idx)};
  },
  buildTorus(R, r, seg1, seg2) {
    const pos=[], nrm=[], uv=[], idx=[];
    for(let j=0;j<=seg1;j++){ const phi=j/seg1*Math.PI*2; for(let i=0;i<=seg2;i++){ const theta=i/seg2*Math.PI*2, x=(R+r*Math.cos(theta))*Math.cos(phi), y=(R+r*Math.cos(theta))*Math.sin(phi), z=r*Math.sin(theta), nx=Math.cos(theta)*Math.cos(phi), ny=Math.cos(theta)*Math.sin(phi), nz=Math.sin(theta); pos.push(x,y,z); nrm.push(nx,ny,nz); uv.push(i/seg2,j/seg1); } }
    for(let j=0;j<seg1;j++) for(let i=0;i<seg2;i++){ const b=j*(seg2+1)+i; idx.push(b,b+seg2+1,b+1); idx.push(b+1,b+seg2+1,b+seg2+2); }
    return {positions:new Float32Array(pos),normals:new Float32Array(nrm),uvs:new Float32Array(uv),indices:new Uint16Array(idx)};
  },

  getBox(w,h,d) { const k=`${w}_${h}_${d}`; if(!this.meshes.BOX[k]) this.meshes.BOX[k]=this.uploadMesh(this.buildBox(w,h,d)); return this.meshes.BOX[k]; },
  getCyl(rt,rb,h,s) { const k=`${rt}_${rb}_${h}_${s}`; if(!this.meshes.CYL[k]) this.meshes.CYL[k]=this.uploadMesh(this.buildCyl(rt,rb,h,s)); return this.meshes.CYL[k]; },
  getSph(r,s) { const k=`${r}_${s}`; if(!this.meshes.SPH[k]) this.meshes.SPH[k]=this.uploadMesh(this.buildSph(r,s)); return this.meshes.SPH[k]; },
  getTorus(R,r,s1,s2) { const k=`${R}_${r}_${s1}_${s2}`; if(!this.meshes.TORUS[k]) this.meshes.TORUS[k]=this.uploadMesh(this.buildTorus(R,r,s1,s2)); return this.meshes.TORUS[k]; },

  compileShaders() {
    this.programs.main = this.createProgram(
      `attribute vec3 aPosition; attribute vec3 aNormal; attribute vec2 aUV; uniform mat4 uProjection; uniform mat4 uView; uniform mat4 uModel; uniform mat3 uNormalMat; varying vec3 vNormal; varying vec3 vWorldPos; varying vec2 vUV; void main(){ vec4 wp=uModel*vec4(aPosition,1.0); vWorldPos=wp.xyz; vNormal=normalize(uNormalMat*aNormal); vUV=aUV; gl_Position=uProjection*uView*wp; }`,
      `precision mediump float; uniform vec3 uColor; uniform vec3 uCamPos; uniform float uShininess; uniform float uMetalness; uniform float uOpacity; uniform vec3 uSunDir; uniform vec3 uSunColor; uniform float uSunIntensity; uniform vec3 uMoonDir; uniform vec3 uMoonColor; uniform float uMoonIntensity; uniform vec3 uAmbColor; uniform float uAmbIntensity; uniform float uFogDensity; uniform vec3 uFogColor; varying vec3 vNormal; varying vec3 vWorldPos; varying vec2 vUV; void main(){ vec3 N=normalize(vNormal), V=normalize(uCamPos-vWorldPos); vec3 ambient=uAmbColor*uAmbIntensity*uColor; vec3 L1=normalize(uSunDir); float diff1=max(dot(N,L1),0.0); vec3 R1=reflect(-L1,N); float spec1=pow(max(dot(V,R1),0.0),uShininess); vec3 sunC=uSunColor*uSunIntensity*(diff1*uColor+spec1*mix(vec3(1.0),uColor,uMetalness)*0.5); vec3 L2=normalize(uMoonDir); float diff2=max(dot(N,L2),0.0); vec3 moonC=uMoonColor*uMoonIntensity*diff2*uColor; vec3 col=ambient+sunC+moonC; float d=length(vWorldPos); float f=clamp(1.0-exp(-uFogDensity*uFogDensity*d*d),0.0,1.0); gl_FragColor=vec4(mix(col,uFogColor,f),uOpacity); }`
    );
    this.programs.flat = this.createProgram(
      `attribute vec3 aPosition; uniform mat4 uProjection; uniform mat4 uView; uniform mat4 uModel; void main(){ gl_Position=uProjection*uView*uModel*vec4(aPosition,1.0); }`,
      `precision mediump float; uniform vec4 uColor; void main(){ gl_FragColor=uColor; }`
    );
  },

  setLightUniforms(prog) {
    const u=(n)=>this.gl.getUniformLocation(prog,n);
    this.gl.uniform3fv(u('uSunDir'),State.light.sunDir); this.gl.uniform3fv(u('uSunColor'),State.light.sunColor); this.gl.uniform1f(u('uSunIntensity'),State.light.sunIntensity);
    this.gl.uniform3fv(u('uMoonDir'),State.light.moonDir); this.gl.uniform3fv(u('uMoonColor'),State.light.moonColor); this.gl.uniform1f(u('uMoonIntensity'),State.light.moonIntensity);
    this.gl.uniform3fv(u('uAmbColor'),State.light.ambColor); this.gl.uniform1f(u('uAmbIntensity'),State.light.ambIntensity);
    this.gl.uniform1f(u('uFogDensity'),State.light.fogDensity); this.gl.uniform3fv(u('uFogColor'),State.light.fogColor);
  },

  drawMesh(prog, mesh, modelMat, color, opts={}) {
    this.gl.useProgram(prog);
    const u=(n)=>this.gl.getUniformLocation(prog,n), a=(n)=>this.gl.getAttribLocation(prog,n);
    this.gl.uniformMatrix4fv(u('uProjection'),false,State.camera.projMat);
    this.gl.uniformMatrix4fv(u('uView'),false,State.camera.viewMat);
    this.gl.uniformMatrix4fv(u('uModel'),false,modelMat);
    this.gl.uniformMatrix3fv(u('uNormalMat'),false,Math3D.M4.normalMatrix(modelMat));
    this.gl.uniform3fv(u('uColor'),color); this.gl.uniform3fv(u('uCamPos'),State.camera.pos);
    this.gl.uniform1f(u('uShininess'),opts.shininess||32); this.gl.uniform1f(u('uMetalness'),opts.metalness||0); this.gl.uniform1f(u('uOpacity'),opts.opacity||1);
    this.setLightUniforms(prog);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, mesh.pos); const pa=a('aPosition'); this.gl.enableVertexAttribArray(pa); this.gl.vertexAttribPointer(pa,3,this.gl.FLOAT,false,0,0);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, mesh.nrm); const na=a('aNormal'); this.gl.enableVertexAttribArray(na); this.gl.vertexAttribPointer(na,3,this.gl.FLOAT,false,0,0);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, mesh.uv); const ua=a('aUV'); if(ua>=0){this.gl.enableVertexAttribArray(ua); this.gl.vertexAttribPointer(ua,2,this.gl.FLOAT,false,0,0);}
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, mesh.idx);
    this.gl.drawElements(this.gl.TRIANGLES, mesh.count, this.gl.UNSIGNED_SHORT, 0);
  },
  
  drawFlat(mesh, modelMat, color) {
    this.gl.useProgram(this.programs.flat);
    this.gl.uniformMatrix4fv(this.gl.getUniformLocation(this.programs.flat,'uProjection'),false,State.camera.projMat);
    this.gl.uniformMatrix4fv(this.gl.getUniformLocation(this.programs.flat,'uView'),false,State.camera.viewMat);
    this.gl.uniformMatrix4fv(this.gl.getUniformLocation(this.programs.flat,'uModel'),false,modelMat);
    this.gl.uniform4fv(this.gl.getUniformLocation(this.programs.flat,'uColor'),color);
    const pa=this.gl.getAttribLocation(this.programs.flat,'aPosition');
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, mesh.pos); this.gl.enableVertexAttribArray(pa); this.gl.vertexAttribPointer(pa,3,this.gl.FLOAT,false,0,0);
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, mesh.idx);
    this.gl.drawElements(this.gl.TRIANGLES, mesh.count, this.gl.UNSIGNED_SHORT, 0);
  }
};
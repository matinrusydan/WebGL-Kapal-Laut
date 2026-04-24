export const Math3D = {
  M4: {
    identity() { return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]); },
    multiply(a, b) {
      const r = new Float32Array(16);
      for(let i=0;i<4;i++) for(let j=0;j<4;j++) {
        let s=0; for(let k=0;k<4;k++) s+=a[i*4+k]*b[k*4+j];
        r[i*4+j]=s;
      }
      return r;
    },
    perspective(fov, aspect, near, far) {
      const f = 1/Math.tan(fov/2), r = new Float32Array(16);
      r[0]=f/aspect; r[5]=f; r[10]=(far+near)/(near-far); r[11]=-1; r[14]=(2*far*near)/(near-far);
      return r;
    },
    lookAt(eye, center, up) {
      const f=Math3D.norm3(Math3D.sub3(center,eye)), s=Math3D.norm3(Math3D.cross3(f,up)), u=Math3D.cross3(s,f);
      const r=new Float32Array(16);
      r[0]=s[0]; r[4]=s[1]; r[8]=s[2]; r[1]=u[0]; r[5]=u[1]; r[9]=u[2];
      r[2]=-f[0]; r[6]=-f[1]; r[10]=-f[2];
      r[12]=-Math3D.dot3(s,eye); r[13]=-Math3D.dot3(u,eye); r[14]=Math3D.dot3(f,eye); r[15]=1;
      return r;
    },
    translation(x,y,z) { const r=Math3D.M4.identity(); r[12]=x; r[13]=y; r[14]=z; return r; },
    scaling(x,y,z) { const r=Math3D.M4.identity(); r[0]=x; r[5]=y; r[10]=z; return r; },
    rotationX(a) { const r=Math3D.M4.identity(), c=Math.cos(a), s=Math.sin(a); r[5]=c; r[6]=s; r[9]=-s; r[10]=c; return r; },
    rotationY(a) { const r=Math3D.M4.identity(), c=Math.cos(a), s=Math.sin(a); r[0]=c; r[2]=-s; r[8]=s; r[10]=c; return r; },
    rotationZ(a) { const r=Math3D.M4.identity(), c=Math.cos(a), s=Math.sin(a); r[0]=c; r[1]=s; r[4]=-s; r[5]=c; return r; },
    normalMatrix(m) {
      const a00=m[0],a01=m[1],a02=m[2],a10=m[4],a11=m[5],a12=m[6],a20=m[8],a21=m[9],a22=m[10];
      const b01=a22*a11-a12*a21, b11=-a22*a10+a12*a20, b21=a21*a10-a11*a20;
      const det=a00*b01+a01*b11+a02*b21;
      if(!det) return new Float32Array([1,0,0, 0,1,0, 0,0,1]);
      const d=1/det;
      return new Float32Array([b01*d,(-a22*a01+a02*a21)*d,(a12*a01-a02*a11)*d, b11*d,(a22*a00-a02*a20)*d,(-a12*a00+a02*a10)*d, b21*d,(-a21*a00+a01*a20)*d,(a11*a00-a01*a10)*d]);
    }
  },
  sub3(a,b){return[a[0]-b[0],a[1]-b[1],a[2]-b[2]];},
  cross3(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];},
  dot3(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];},
  norm3(a){const l=Math.sqrt(Math3D.dot3(a,a))||1;return[a[0]/l,a[1]/l,a[2]/l];}
};
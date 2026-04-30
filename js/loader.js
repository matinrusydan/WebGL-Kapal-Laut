export const Loader = {
  async loadTexture(gl, url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        
        const ext = gl.getExtension('EXT_texture_filter_anisotropic') || gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');
        if (ext) {
          const maxAnisotropy = gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
          gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, maxAnisotropy);
        }
        resolve(tex);
      };
      img.src = url;
    });
  },

  async loadOBJ(url) {
    const response = await fetch(url);
    const text = await response.text();
    
    const objPos = [[0,0,0]], objUV = [[0,0]], objNrm = [[0,0,0]];
    const positions = [], uvs = [], normals = [], tangents = [];
    
    const addVertex = (vStr) => {
      const p = vStr.split('/');
      const posIdx = parseInt(p[0]) || 0;
      const uvIdx = parseInt(p[1]) || 0;
      const nrmIdx = parseInt(p[2]) || 0;
      return {
        pos: objPos[posIdx] || [0,0,0],
        uv: objUV[uvIdx] || [0,0],
        nrm: objNrm[nrmIdx] || [0,0,0]
      };
    };

    const lines = text.split('\n');
    for (let line of lines) {
      line = line.trim();
      if (line === '' || line.startsWith('#')) continue;
      
      const parts = line.split(/\s+/);
      const type = parts.shift();
      
      if (type === 'v') objPos.push(parts.map(parseFloat));
      else if (type === 'vt') objUV.push(parts.map(parseFloat));
      else if (type === 'vn') objNrm.push(parts.map(parseFloat));
      else if (type === 'f') {
        const vertices = [];
        for (let i = 0; i < parts.length; i++) {
            vertices.push(addVertex(parts[i]));
        }

        // Triangulate polygons (memecah quads menjadi triangles)
        for (let i = 1; i < vertices.length - 1; i++) {
          const v0 = vertices[0], v1 = vertices[i], v2 = vertices[i+1];
          
          // Tangent calculation
          const dp1 = [v1.pos[0] - v0.pos[0], v1.pos[1] - v0.pos[1], v1.pos[2] - v0.pos[2]];
          const dp2 = [v2.pos[0] - v0.pos[0], v2.pos[1] - v0.pos[1], v2.pos[2] - v0.pos[2]];
          
          const duv1 = [v1.uv[0] - v0.uv[0], v1.uv[1] - v0.uv[1]];
          const duv2 = [v2.uv[0] - v0.uv[0], v2.uv[1] - v0.uv[1]];
          
          let r = 1.0 / (duv1[0] * duv2[1] - duv1[1] * duv2[0]);
          if (!isFinite(r)) r = 0.0;
          
          const tx = (dp1[0] * duv2[1] - dp2[0] * duv1[1]) * r;
          const ty = (dp1[1] * duv2[1] - dp2[1] * duv1[1]) * r;
          const tz = (dp1[2] * duv2[1] - dp2[2] * duv1[1]) * r;
          
          // Unroll ke flat array (menambah posisi, uv, normal, tangent per vertex)
          [v0, v1, v2].forEach(v => {
            positions.push(...v.pos);
            uvs.push(v.uv[0], v.uv[1]);
            normals.push(...v.nrm);
            tangents.push(tx, ty, tz);
          });
        }
      }
    }
    
    return {
      positions: new Float32Array(positions),
      uvs: new Float32Array(uvs),
      normals: new Float32Array(normals),
      tangents: new Float32Array(tangents),
      count: positions.length / 3
    };
  }
};

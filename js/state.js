export const State = {
  windLevel: 2, 
  waveLevel: 3, 
  timeOfDay: 'night',
  simTime: 0, 
  fps: 60, 
  frameCount: 0, 
  lastFPS: performance.now(),
  statusVisible: true,
  camera: {
    pos: [0, 18, 40], 
    projMat: null, 
    viewMat: null,
    sph: { theta: 0.1, phi: 0.38, radius: 62 },
    tSph: { theta: 0.1, phi: 0.38, radius: 62 }
  },
  input: { isDown: false, lastPtr: {x: 0, y: 0} },
  light: {
    sunDir: [0.57,0.82,0.28], sunColor: [1,0.96,0.88], sunIntensity: 0.3,
    moonDir: [-0.45,0.75,0.25], moonColor: [0.54,0.71,0.97], moonIntensity: 0.9,
    ambColor: [0.04,0.09,0.19], ambIntensity: 0.9,
    fogDensity: 0.003, fogColor: [0,0.05,0.1],
    skyTopColor: [0,0.03,0.125], skyBotColor: [0,0.1,0.23],
    sunVisible: false, moonVisible: true, starsVisible: true
  },
  ship: { y: 0, rx: 0, rz: 0, propAngle: 0 }
};
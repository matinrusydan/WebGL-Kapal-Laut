export const Config = {
  wind: {
    1: {name:'LEMAH',  speed:0.35, tiltMult:0.4, bar:30,  knots:5,  vis:9,  particleCount:40,  particleAlpha:0.35, particleSpeed:1.2 },
    2: {name:'SEDANG', speed:0.8,  tiltMult:1.0, bar:58,  knots:14, vis:6,  particleCount:110, particleAlpha:0.55, particleSpeed:2.5 },
    3: {name:'KUAT',   speed:1.7,  tiltMult:1.9, bar:100, knots:28, vis:3,  particleCount:240, particleAlpha:0.75, particleSpeed:5.0 },
  },
  wave: {
    1: {name:'KECIL',  amp:0.22, freq:0.65, chop:0.08, bar:25, color:[0.015,0.07,0.22] },
    2: {name:'SEDANG', amp:0.72, freq:1.05, chop:0.25, bar:58, color:[0.015,0.07,0.22] },
    3: {name:'BESAR',  amp:1.55, freq:1.7,  chop:0.55, bar:100,color:[0.015,0.07,0.22] },
  },
  colors: {
    hullMain:   [0.099,0.176,0.369], hullDark:   [0.051,0.118,0.251], hullBot: [0.478,0.082,0.082],
    keel:       [0.353,0.059,0.059], deck:       [0.42,0.353,0.243],  deckMetal: [0.228,0.228,0.228],
    superW:     [0.847,0.867,0.886], cabin2:     [0.773,0.8,0.831],   chimney: [0.102,0.102,0.102],
    chimneyRed: [0.8,0.133,0.0],     white:      [1,1,1],             railing: [0.867,0.867,0.867],
    anchor:     [0.267,0.267,0.267], rope:       [0.769,0.643,0.392], lifeRing: [1,0.267,0.133],
    crane:      [1,0.8,0.0],         rudder:     [0.2,0.2,0.333],     propeller: [0.541,0.478,0.165],
    hatch:      [0.29,0.227,0.157],  bollard:    [0.333,0.333,0.4],   lifeboatOrange: [1,0.4,0],
    porthole:   [0.533,0.847,1.0],   smoke:      [0.2,0.267,0.333],
  }
};
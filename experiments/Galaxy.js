let galaxy;
let stars = [];
let supernovas = [];
let flowField = [];
let fieldSize = 20;
let cols, rows;
let nScale = 0.05;
let t = 0;
let xScale = 2.0;
let canvas;

let zoomMode = false;
let supernovaMode = false;
let zoomTarget = null;
let moveGalaxyMode = false;

let supernovaBtn, zoomBtn, moveGalaxyBtn;

// === SOUND VARIABLE ===
let explosionSynth;

function setup() {
  canvas = createCanvas(windowWidth, windowHeight);
  canvas.mousePressed(moveGalaxy);
  background(0);
  noStroke();

  // Buttons
  supernovaBtn = createButton('Go boom');
  supernovaBtn.addClass('supernovaBtn');
  supernovaBtn.parent(document.body);
  supernovaBtn.position(width / 2 - 200, 20);
  supernovaBtn.mousePressed(() => {
    supernovaMode = true;
    zoomMode = false;
    moveGalaxyMode = false;
  });

  zoomBtn = createButton('Zoom to star');
  zoomBtn.addClass('zoomBtn');
  zoomBtn.parent(document.body);
  zoomBtn.position(width / 2 - 50, 20);
  zoomBtn.mousePressed(() => {
    zoomMode = true;
    supernovaMode = false;
    moveGalaxyMode = false;
  });
  
  moveGalaxyBtn = createButton('Move Galaxy');
  moveGalaxyBtn.addClass('moveGalaxyBtn');
  moveGalaxyBtn.parent(document.body);
  moveGalaxyBtn.position(width / 2 + 125, 20);
  moveGalaxyBtn.mousePressed(() => {
    moveGalaxyMode = true;
    zoomMode = false;
    supernovaMode = false;
  });

  cols = ceil(width / fieldSize);
  rows = ceil(height / fieldSize);

  flowField = new Array(cols);
  for (let i = 0; i < cols; i++) {
    flowField[i] = new Array(rows);
  }

  // Stars
  for (let i = 0; i < 200; i++) {
    stars.push({
      x: random(width),
      y: random(height),
      size: random(2, 8),
      color: randomizedColor(),
      noiseOffset: random(1000),
      trail: [],
    });
  }

  galaxy = new Galaxy(width / 2, height / 2, 500);

  // === BIG SUPERNOVA SOUND SETUP ===
  // Membrane synth for punch
  let explosionMembrane = new Tone.MembraneSynth({
    pitchDecay: 0.4,
    octaves: 6,
    oscillator: { type: "sine" },
    envelope: {
      attack: 0.001,
      decay: 0.8,
      sustain: 0.01,
      release: 1.2
    }
  }).toDestination();

  // Brown noise for rumble
  let explosionNoise = new Tone.Noise("brown");
  let noiseFilter = new Tone.Filter(200, "lowpass").toDestination();
  explosionNoise.connect(noiseFilter);

  // Wrap into a trigger function
  explosionSynth = {
    trigger: function() {
      // initial punch
      explosionMembrane.triggerAttackRelease("C1", "1n");

      // long rumble
      explosionNoise.start();
      noiseFilter.frequency.setValueAtTime(300, Tone.now());
      noiseFilter.frequency.exponentialRampToValueAtTime(10, Tone.now() + 1.5);

      // stop noise after 1.5 seconds
      setTimeout(() => explosionNoise.stop(), 1600);
    }
  };

  frameRate(120);
}

function draw() {
  background(0);

  updateFlowField();

  if (!zoomTarget){  
    galaxy.updateStars();
    galaxy.showStars();

    for (let star of stars) {
      let n = noise(star.x * 0.005, star.y * 0.005, t + star.noiseOffset);
      let alpha = map(n, 0, 1, 50, 255);
      fill(red(star.color), green(star.color), blue(star.color), alpha);
      ellipse(star.x, star.y, star.size);
    }

    galaxy.updateMovement();

  } else { 
    drawZoomedStar(zoomTarget); 
  }

  for (let i = supernovas.length - 1; i >= 0; i--) {
    supernovas[i].update();
    supernovas[i].show();
    if (supernovas[i].isDead()) supernovas.splice(i, 1);
  }

  t += 0.05;
}

function updateFlowField() {
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      let angle = noise(i * nScale, j * nScale, t) * TWO_PI * 2;
      flowField[i][j] = p5.Vector.fromAngle(angle);
    }
  }
}

function randomizedColor() {
  let choice = floor(random(3));
  if (choice === 0) {
    return color(random(200, 255), random(180, 230), random(50, 100));
  } 
  else if (choice === 1) {
    return color(random(200, 255), random(200, 255), random(200, 255));
  } 
  else { 
    return color(random(150, 200), random(180, 240), random(255));
  }
}

function drawZoomedStar(s) {
  push();
  translate(width/2, height/2);
  let zoomRadius = min(width, height) * 0.4;

  for (let x = -zoomRadius; x < zoomRadius; x+=2) {
    for (let y = -zoomRadius; y < zoomRadius; y+=2) {
      let d = dist(0, 0, x, y);
      if (d < zoomRadius) {
        let n = noise(x * 0.02 + t, y * 0.02, s.noiseOffset + t * 0.5);
        let factor = map(n, 0, 1, 0.5, 1);
        let c = color(
          red(s.color) * factor,
          green(s.color) * factor,
          blue(s.color) * factor,
        );
        stroke(c);
        point(x, y);
      }
    }
  }

  pop();
}
  
function mousePressed() {
  if (zoomTarget) {
    zoomTarget = null;
    return;
  }

  for (let i = stars.length - 1; i >= 0; i--) {
    let s = stars[i];
    let d = dist(mouseX, mouseY, s.x, s.y);
    if (d < 10) {
      if (supernovaMode) {
        supernovas.push(new Supernova(createVector(s.x, s.y)));
        stars.splice(i, 1);

        // ✅ PLAY BIG SUPERNOVA SOUND
        if (Tone.context.state !== 'running') {
          Tone.start(); // required for browser audio
        }
        explosionSynth.trigger();

      } else if (zoomMode) {
        zoomTarget = s;
      }
      break;
    }
  }
}

function moveGalaxy() {
  if (moveGalaxyMode) {
    galaxy.target = createVector(mouseX, mouseY);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  // Update button positions
  supernovaBtn.position(width / 2 - 150, 20);
  zoomBtn.position(width / 2 - 50, 20);
  moveGalaxyBtn.position(width / 2 + 50, 20);
}

class Galaxy {
  constructor(x, y, numStars) {
    this.center = createVector(x, y);
    this.target = this.center.copy();
    this.speed = 3; // speed of galaxy movement
    this.stars = [];
    this.blackHoleRadius = 10;

    for (let i = 0; i < numStars; i++) {
      let pos = p5.Vector.random2D().mult(random(50, 200)).add(this.center);
      this.stars.push({
        pos: pos,
        vel: createVector(0, 0),
        acc: createVector(0, 0),
        size: random(2, 5),
        trail: [],
        distance: p5.Vector.dist(pos, this.center),
        angle: atan2(pos.y - this.center.y, pos.x - this.center.x),
        color: randomizedColor(),
        noiseOffset: random(1000),
      });
    }
  }

  updateStars() {
    for (let star of this.stars) {
      star.angle += 0.01;
      star.pos.x = this.center.x + cos(star.angle) * star.distance * xScale;
      star.pos.y = this.center.y + sin(star.angle) * star.distance;

      let i = constrain(floor(star.pos.x / fieldSize), 0, cols - 1);
      let j = constrain(floor(star.pos.y / fieldSize), 0, rows - 1);
      let flow = flowField[i][j].copy().mult(0.5);
      star.pos.add(flow);

      star.trail.push(star.pos.copy());
      if (star.trail.length > 20) star.trail.shift();
    }
  }

  updateMovement() {
    let dir = p5.Vector.sub(this.target, this.center);
    if (dir.mag() > 1) {
      dir.setMag(this.speed);
      for (let star of this.stars) {
        star.pos.add(dir);
      }
      this.center.add(dir);
    }
  }

  showStars() {
    noStroke();
    fill(255, 200);
    for (let star of this.stars) {
      for (let i = 0; i < star.trail.length; i++) {
        let pos = star.trail[i];
        let alpha = map(i, 0, star.trail.length - 1, 0, 80);
        stroke(255, alpha);
        strokeWeight(star.size);
        point(pos.x, pos.y);
      }
    }

    push();
    noStroke();
    for (let r = this.blackHoleRadius * 6; r > 0; r--) {
      let alpha = map(r, this.blackHoleRadius * 6, 0, 0, 120);
      fill(0, 0, 0, alpha);
      ellipse(this.center.x, this.center.y, r * 2);
    }
    fill(0);
    ellipse(this.center.x, this.center.y, this.blackHoleRadius * 2);
    pop();
  }
}

class Supernova {
  constructor(pos) {
    this.pos = pos.copy();
    this.radius = 0;
    this.maxRadius = random(30, 80);
    this.lifespan = 30;
    this.age = 0;
  }

  update() {
    this.age++;
    this.radius = map(this.age, 0, this.lifespan, 0, this.maxRadius);
  }

  show() {
    push();     
    let c = color(random(220, 255));
    c.setAlpha(100);
    fill(c);
    stroke(255, map(this.lifespan - this.age, 0, this.lifespan, 0, 150));
    ellipse(this.pos.x, this.pos.y, this.radius * 2);
    pop();
  }

  isDead() {
    return this.age >= this.lifespan;
  }
}

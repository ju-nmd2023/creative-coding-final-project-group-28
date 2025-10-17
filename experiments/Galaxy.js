let galaxy;
let stars = [];
let supernovas = [];
let flowField = [];
let fieldSize = 20;
let cols, rows;
let nScale = 0.05;
let t = 0;
let xScale = 1.5;

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(0);
  noStroke();

  cols = ceil(width / fieldSize);
  rows = ceil(height / fieldSize);

  flowField = new Array(cols);
  for (let i = 0; i < cols; i++) {
    flowField[i] = new Array(rows);
  }

  for (let i = 0; i < 500; i++) {
    stars.push({
      x: random(width),
      y: random(height),
      size: random(1, 4),
      trail: [],
    });
  }
  galaxy = new Galaxy(width / 2, height / 2, 500);

  frameRate(120);
}

function draw() {
  background(0);
  // Fading background for trails
  fill(0, 0, 0, 20);
  rect(0, 0, width, height);

  updateFlowField();

  galaxy.updateStars();
  galaxy.showStars();

  for (let star of stars) {
    ellipse(star.x, star.y, star.size);
  }

  for (let i = supernovas.length - 1; i >= 0; i--) {
    supernovas[i].update();
    supernovas[i].show();
    if (supernovas[i].isDead()) supernovas.splice(i, 1);
  }

  galaxy.updateMovement();

  t += 0.01;
}

// Flow field influenced by Perlin noise
function updateFlowField() {
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      let angle = noise(i * nScale, j * nScale, t) * TWO_PI * 2;
      flowField[i][j] = p5.Vector.fromAngle(angle);
    }
  }
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
        size: random(1, 3),
        trail: [],
        distance: p5.Vector.dist(pos, this.center),
        angle: atan2(pos.y - this.center.y, pos.x - this.center.x)
      });
    }
  }

  updateStars() {
    for (let star of this.stars) {
      // Orbit around black hole
      star.angle += 0.01; // base orbital speed
      star.pos.x = this.center.x + cos(star.angle) * star.distance * xScale;
      star.pos.y = this.center.y + sin(star.angle) * star.distance;

      // Flow field influence
      let i = constrain(floor(star.pos.x / fieldSize), 0, cols - 1);
      let j = constrain(floor(star.pos.y / fieldSize), 0, rows - 1);
      let flow = flowField[i][j].copy().mult(0.5); // subtle influence
      star.pos.add(flow);

      // Trail
      star.trail.push(star.pos.copy());
      if (star.trail.length > 20) star.trail.shift();
    }
  }

  updateMovement() {
    // Smoothly move galaxy center toward target
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

    // Draw black hole
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
    fill(random(220, 255));
    stroke(255, map(this.lifespan - this.age, 0, this.lifespan, 0, 150));
    ellipse(this.pos.x, this.pos.y, this.radius * 2);
    pop();
  }

  isDead() {
    return this.age >= this.lifespan;
  }
}

function mousePressed() {

  let clickedOnStar = false;

  // Clicking on a background star triggers a supernova
  for (let i = stars.length - 1; i >= 0; i--) {
    let s = stars[i];
    let d = dist(mouseX, mouseY, s.x, s.y);
    if (d < 10) {
      supernovas.push(new Supernova(createVector(s.x, s.y)));
      stars.splice(i, 1);
      clickedOnStar = true;
      break;
    }
  }

  if (!clickedOnStar){
    galaxy.target = createVector(mouseX, mouseY);
  };
}

let galaxy = [];
let numStars = 200;
let blackHole;
let canvasWidth = 800;
let canvasHeight = 600;

function setup() {
  createCanvas(canvasWidth, canvasHeight);
  background(0);
  noStroke();
  
  // Black hole at the center
  blackHole = createVector(width / 2, height / 2);

  // Initialize stars orbiting the black hole
  for (let i = 0; i < numStars; i++) {
    let distance = random(50, 200); // distance from black hole
    let angle = random(TWO_PI);     // random angle
    let speed = random(0.001, 0.01); // angular speed
    let size = random(1, 3);        // star size

    // Random RGB or white color
    let starColor;
    if (random(1) < 0.5) {
      starColor = color(255); // white
    } else {
      starColor = color(random(200, 255), random(200, 255), random(200, 255));
    }

    galaxy.push({
      distance: distance,
      angle: angle,
      speed: speed,
      size: size,
      color: starColor,
      x: blackHole.x + cos(angle) * distance,
      y: blackHole.y + sin(angle) * distance,
      lastX: 0,
      lastY: 0
    });
  }
}

function draw() {
  // Fading background for trails
  fill(0, 20);
  rect(0, 0, width, height);

  // Draw black hole
  fill(0);
  ellipse(blackHole.x, blackHole.y, 20, 20);

  // Update and draw stars
  for (let star of galaxy) {
    star.lastX = star.x;
    star.lastY = star.y;

    // Update angle for orbit
    star.angle += star.speed;

    // Calculate new position
    star.x = blackHole.x + cos(star.angle) * star.distance;
    star.y = blackHole.y + sin(star.angle) * star.distance;

    // Draw trail
    stroke(star.color);
    strokeWeight(star.size);
    line(star.lastX, star.lastY, star.x, star.y);
  }
}

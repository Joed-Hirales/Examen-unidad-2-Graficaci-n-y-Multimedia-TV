let paddle, ball, blocks = [];
let level = 1;
let lives = 3;
let score = 0;
let totalLevels = 3;
let ballSpeed = 3;
let ballReleased = false;
let levelColors = ['#4CC9F0', '#F72585', '#B5179E'];
let paused = false;
let gameOver = false;
let gameWon = false;

function setup() {
  createCanvas(600, 400);
  paddle = new Paddle();
  ball = new Ball();
  createLevel(level);
}

function draw() {
  if (paused) {
    background(30);
    fill(255);
    textAlign(CENTER);
    textSize(24);
    text('Juego Pausado. Presiona ENTER para continuar.', width / 2, height / 2);
    return;
  }

  background('#1A1A2E');
  paddle.show();
  paddle.move();
  ball.update();
  ball.show();
  ball.checkPaddle(paddle);
  showHUD();

  for (let i = blocks.length - 1; i >= 0; i--) {
    blocks[i].show();
    if (ball.hits(blocks[i])) {
      ball.bounceBlock(blocks[i]);
      blocks[i].hit();
      if (blocks[i].destroyed) {
        blocks.splice(i, 1);
        score++;
      }
    }
  }

  if (blocks.length === 0 && level < totalLevels) {
    level++;
    lives = 3;
    createLevel(level);
    ball.reset();
  } else if (level === totalLevels && blocks.every(b => b.indestructible || b.destroyed)) {
    gameWon = true;
    noLoop();
    background(30);
    fill('#80FFDB');
    textAlign(CENTER);
    textSize(30);
    text('¡Felicidades, ganaste!', width / 2, height / 2);
  }

  if (ball.offScreen()) {
    lives--;
    ball.reset();
    if (lives <= 0) {
      gameOver = true;
      noLoop();
      background(30);
      fill('#FF4D4D');
      textAlign(CENTER);
      textSize(24);
      text('Haz perdido todas tus vidas. Presiona R para reiniciar.', width / 2, height / 2);
    }
  }

  if (!ballReleased && lives > 0 && !gameWon) {
    fill(255);
    textSize(20);
    textAlign(CENTER);
    text("Presiona ESPACIO para lanzar la pelota", width / 2, height / 2);
  }
}

function keyPressed() {
  if (key === ' ') ballReleased = true;
  if (key === 'Enter') paused = !paused;
  if ((key === 'r' || key === 'R') && gameOver) restartGame();
}

function restartGame() {
  level = 1;
  lives = 3;
  score = 0;
  gameOver = false;
  gameWon = false;
  ball.reset();
  createLevel(level);
  loop();
}

function showHUD() {
  fill('#FFFFFF');
  textSize(16);
  textAlign(LEFT);
  text(`Puntos: ${score}   ❤️ Vidas: ${lives}   Nivel: ${level}`, 15, 25);
}

class Paddle {
  constructor() {
    this.w = 100;
    this.h = 12;
    this.x = width / 2 - this.w / 2;
    this.speed = 7;
  }

  show() {
    fill('#EA3EFF');
    rect(this.x, height - 20, this.w, this.h, 8);
  }

  move() {
    if (keyIsDown(LEFT_ARROW)) this.x -= this.speed;
    if (keyIsDown(RIGHT_ARROW)) this.x += this.speed;
    this.x = constrain(this.x, 0, width - this.w);
  }
}

class Ball {
  constructor() {
    this.r = 10;
    this.reset();
  }

  reset() {
    ballReleased = false;
    this.x = paddle.x + paddle.w / 2;
    this.y = height - 30;
    this.setSpeedByLevel();
  }

  setSpeedByLevel() {
    if (level === 1) ballSpeed = 3;
    else if (level === 2) ballSpeed = 4;
    else if (level === 3) ballSpeed = 5;

    this.xSpeed = random([-1, 1]) * ballSpeed;
    this.ySpeed = -ballSpeed;
  }

  show() {
    fill('#F3FF00');
    circle(this.x, this.y, this.r * 2);
  }

  update() {
    if (!ballReleased) {
      this.x = paddle.x + paddle.w / 2;
      this.y = height - 30;
      return;
    }
    this.x += this.xSpeed;
    this.y += this.ySpeed;
    if (this.x < 0 || this.x > width) this.xSpeed *= -1;
    if (this.y < 0) this.ySpeed *= -1;
  }

  checkPaddle(p) {
    if (this.y + this.r > height - 20 && this.x > p.x && this.x < p.x + p.w) {
      this.ySpeed *= -1;
      this.y = height - 20 - this.r;
    }
  }

  hits(block) {
    return (
      this.x > block.x &&
      this.x < block.x + block.w &&
      this.y - this.r < block.y + block.h &&
      this.y + this.r > block.y
    );
  }

  bounceBlock(block) {
    let overlapLeft = this.x - block.x;
    let overlapRight = block.x + block.w - this.x;
    let overlapTop = this.y - block.y;
    let overlapBottom = block.y + block.h - this.y;

    let minOverlapX = min(overlapLeft, overlapRight);
    let minOverlapY = min(overlapTop, overlapBottom);

    if (minOverlapX < minOverlapY) {
      this.xSpeed *= -1;
    } else {
      this.ySpeed *= -1;
    }
  }

  offScreen() {
    return this.y > height;
  }
}

class Block {
  constructor(x, y, hitsToDestroy = 1, indestructible = false) {
    this.x = x;
    this.y = y;
    this.w = 50;
    this.h = 20;
    this.hits = 0;
    this.maxHits = hitsToDestroy;
    this.indestructible = indestructible;
    this.destroyed = false;
  }

  show() {
    if (this.destroyed) return;

    let col;
    if (this.indestructible) {
      col = color('#B0BEC5'); 
    } else if (this.maxHits > 1) {
      col = color('#FFD700'); 
    } else {
      col = color(levelColors[level - 1]);
    }

    let alphaVal = map(this.hits, 0, this.maxHits, 255, 80);
    col.setAlpha(alphaVal);

    fill(col);
    rect(this.x, this.y, this.w, this.h, 4);
  }

  hit() {
    if (!this.indestructible) {
      this.hits++;
      if (this.hits >= this.maxHits) this.destroyed = true;
    }
  }
}

function createLevel(n) {
  blocks = [];
  let rows = 4;
  let specialBlocks = [];

  if (n === 2) {
    rows = 5;
    specialBlocks.push({ row: 2, col: 5, hits: 3 });
  } else if (n === 3) {
    rows = 6;
    specialBlocks.push({ row: 2, col: 3, hits: 3 });
    specialBlocks.push({ row: 2, col: 6, hits: 3 });
    specialBlocks.push({ row: 3, col: 5, indestructible: true });
  }

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < 10; j++) {
      let x = j * 55 + 20;
      let y = i * 25 + 30;
      let special = specialBlocks.find(b => b.row === i && b.col === j);

      if (special) {
        if (special.indestructible) {
          blocks.push(new Block(x, y, 1, true));
        } else {
          blocks.push(new Block(x, y, special.hits));
        }
      } else {
        blocks.push(new Block(x, y));
      }
    }
  }
}

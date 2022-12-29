const canvas = document.querySelector("canvas");
const context = canvas.getContext("2d");
canvas.width = innerWidth;
canvas.height = innerHeight;

const scoreEl = document.querySelector("#scoreEl");
const startGameBtn = document.querySelector("#startGameBtn");
const modalEl = document.querySelector("#modalEl");
const bigScoreEl = document.querySelector("#bigScoreEl");

// classes

class Player {
  constructor(x, y, radius, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
  }

  draw() {
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    context.fillStyle = this.color;
    context.fill();
  }
}

class Projectile {
  constructor(x, y, radius, color, velocity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
  }

  draw() {
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    context.fillStyle = this.color;
    context.fill();
  }

  update() {
    this.draw();
    this.x += this.velocity.x;
    this.y += this.velocity.y;
  }
}

class Enemy {
  constructor(x, y, radius, color, velocity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
  }

  draw() {
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    context.fillStyle = this.color;
    context.fill();
  }

  update() {
    this.draw();
    this.x += this.velocity.x;
    this.y += this.velocity.y;
  }
}

const FRICTION = 0.99;

class Particle {
  constructor(x, y, radius, color, velocity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
    this.alpha = 1;
  }

  draw() {
    context.save();
    context.globalAlpha = this.alpha;
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    context.fillStyle = this.color;
    context.fill();
    context.restore();
  }

  update() {
    this.draw();
    this.velocity.x *= FRICTION;
    this.velocity.y *= FRICTION;
    this.x += this.velocity.x;
    this.y += this.velocity.y;
    this.alpha -= 0.01;
  }
}

// initializations

let projectiles = [];
let enemies = [];
let particles = [];
let player = new Player(canvas.width / 2, canvas.height / 2, 10, "white");
player.draw();

let animationId;
let score = 0;

// functions

function init() {
  projectiles = [];
  enemies = [];
  particles = [];
  player = new Player(canvas.width / 2, canvas.height / 2, 10, "white");
  score = 0;
  scoreEl.innerHTML = score;
  bigScoreEl.innerHTML = score;
}

function spawnEnemy() {
  setInterval(() => {
    const radius = Math.random() * (30 - 4) + 4;
    let x;
    let y;

    if (Math.random() < 0.5) {
      x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
      y = Math.random() * canvas.height;
    } else {
      x = Math.random() * canvas.width;
      y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
    }

    const color = `hsl(${Math.random() * 360}, 50%, 50%)`;
    const angle = Math.atan2(canvas.height / 2 - y, canvas.width / 2 - x);
    const velocity = {
      x: Math.cos(angle),
      y: Math.sin(angle),
    };

    enemies.push(new Enemy(x, y, radius, color, velocity));
  }, 1000);
}

function isOutOfCanvas(projectile) {
  return (
    projectile.x - projectile.radius < 0 ||
    projectile.x + projectile.radius > canvas.width ||
    projectile.y - projectile.radius < 0 ||
    projectile.y + projectile.radius > canvas.height
  );
}

function animate() {
  animationId = requestAnimationFrame(animate);
  context.fillStyle = "rgba(0,0,0, 0.1)";
  context.fillRect(0, 0, canvas.width, canvas.height);
  player.draw();
  particles.forEach((p, pIndex) => {
    if (p.alpha <= 0) {
      particles.splice(pIndex, 1);
    } else {
      p.update();
    }
  });
  projectiles.forEach((p, index) => {
    p.update();
    if (isOutOfCanvas(p)) {
      setTimeout(() => {
        projectiles.splice(index, 1);
      }, 0);
    }
  });
  enemies.forEach((e, eIndex) => {
    e.update();
    const dist = Math.hypot(player.x - e.x, player.y - e.y);
    if (dist - e.radius - player.radius < 1) {
      cancelAnimationFrame(animationId);
      bigScoreEl.innerHTML = score;
      modalEl.style.display = "flex";
    }
    projectiles.forEach((p, pIndex) => {
      const dist = Math.hypot(p.x - e.x, p.y - e.y);
      if (dist - e.radius - p.radius < 1) {
        for (let i = 0; i < e.radius * 2; i++) {
          particles.push(
            new Particle(p.x, p.y, Math.random() * 2, e.color, {
              x: (Math.random() - 0.5) * (Math.random() * 6),
              y: (Math.random() - 0.5) * (Math.random() * 6),
            })
          );
        }

        if (e.radius - 10 > 5) {
          score += 100;
          scoreEl.innerHTML = score;
          gsap.to(e, {
            radius: e.radius - 10,
          });

          setTimeout(() => {
            projectiles.splice(pIndex, 1);
          }, 0);
        } else {
          score += 250;
          scoreEl.innerHTML = score;
          setTimeout(() => {
            enemies.splice(eIndex, 1);
            projectiles.splice(pIndex, 1);
          }, 0);
        }
      }
    });
  });
}

//   event listeners

window.addEventListener("click", (event) => {
  const angle = Math.atan2(
    event.clientY - canvas.height / 2,
    event.clientX - canvas.width / 2
  );
  const velocity = {
    x: Math.cos(angle) * 5,
    y: Math.sin(angle) * 5,
  };
  projectiles.push(
    new Projectile(canvas.width / 2, canvas.height / 2, 5, "white", velocity)
  );
});

startGameBtn.addEventListener("click", () => {
  init();
  animate();
  spawnEnemy();
  modalEl.style.display = "none";
});

(function () {
  var canvas = document.getElementById('space-canvas');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var W, H, stars, shootingStars, nextShootTime;
  var NUM_STARS = 220;
  var SHOOT_MIN = 2500;
  var SHOOT_EXTRA = 3500;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    initStars();
  }

  function initStars() {
    stars = [];
    for (var i = 0; i < NUM_STARS; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.4 + 0.2,
        alpha: Math.random() * 0.5 + 0.4,
        ts: Math.random() * 0.014 + 0.003,
        td: Math.random() > 0.5 ? 1 : -1
      });
    }
    shootingStars = [];
    nextShootTime = SHOOT_MIN + Math.random() * SHOOT_EXTRA;
  }

  function spawnShootingStar() {
    var angle = Math.PI / 6 + Math.random() * (Math.PI / 6);
    var speed = 7 + Math.random() * 8;
    shootingStars.push({
      x: Math.random() * W * 0.75,
      y: Math.random() * H * 0.45,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      len: 80 + Math.random() * 100,
      alpha: 1,
      fade: 0.014 + Math.random() * 0.012
    });
  }

  function draw() {
    ctx.fillStyle = '#0a0a1e';
    ctx.fillRect(0, 0, W, H);

    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      s.alpha += s.ts * s.td;
      if (s.alpha >= 1)    { s.alpha = 1;    s.td = -1; }
      if (s.alpha <= 0.15) { s.alpha = 0.15; s.td =  1; }
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,' + s.alpha + ')';
      ctx.fill();
    }

    for (var j = shootingStars.length - 1; j >= 0; j--) {
      var ss = shootingStars[j];
      ss.x += ss.vx;
      ss.y += ss.vy;
      ss.alpha -= ss.fade;
      if (ss.alpha <= 0 || ss.x > W + 200 || ss.y > H + 200) {
        shootingStars.splice(j, 1);
        continue;
      }
      var spd = Math.sqrt(ss.vx * ss.vx + ss.vy * ss.vy);
      var nx = ss.vx / spd;
      var ny = ss.vy / spd;
      var tx = ss.x - nx * ss.len;
      var ty = ss.y - ny * ss.len;
      var grad = ctx.createLinearGradient(ss.x, ss.y, tx, ty);
      grad.addColorStop(0,   'rgba(255,255,255,' + ss.alpha + ')');
      grad.addColorStop(0.4, 'rgba(210,190,255,' + (ss.alpha * 0.5) + ')');
      grad.addColorStop(1,   'rgba(180,160,255,0)');
      ctx.beginPath();
      ctx.moveTo(ss.x, ss.y);
      ctx.lineTo(tx, ty);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(ss.x, ss.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,' + ss.alpha + ')';
      ctx.fill();
    }
  }

  var elapsed = 0;
  var last = null;
  function animate(ts) {
    if (last !== null) elapsed += ts - last;
    last = ts;
    draw();
    if (elapsed >= nextShootTime) {
      spawnShootingStar();
      elapsed = 0;
      nextShootTime = SHOOT_MIN + Math.random() * SHOOT_EXTRA;
    }
    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(animate);
})();

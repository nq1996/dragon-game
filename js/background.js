var theme = require('./theme.js');

function paintBackground(ctx, layout, now) {
  var w = layout.w;
  var h = layout.h;
  var horizonY = layout.horizonY;
  var shoreY = layout.shoreY;
  var time = now || 0;

  var sky = ctx.createLinearGradient(0, 0, 0, horizonY);
  sky.addColorStop(0, theme.skyTop);
  sky.addColorStop(0.55, theme.skyMid);
  sky.addColorStop(1, theme.skyHorizon);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, horizonY + 2);

  drawSun(ctx, w, h);
  drawClouds(ctx, w, h, time);
  drawIslands(ctx, w, horizonY);

  var sea = ctx.createLinearGradient(0, horizonY, 0, h);
  sea.addColorStop(0, theme.seaTop);
  sea.addColorStop(0.45, theme.seaMid);
  sea.addColorStop(1, theme.seaDeep);
  ctx.fillStyle = sea;
  ctx.fillRect(0, horizonY, w, h - horizonY);

  drawWaves(ctx, w, horizonY, shoreY, time);
  drawFishSchool(ctx, w, layout, time);

  var shore = ctx.createLinearGradient(0, shoreY, 0, h);
  shore.addColorStop(0, theme.shoreTop);
  shore.addColorStop(0.35, theme.shoreMid);
  shore.addColorStop(1, theme.shoreBottom);
  ctx.fillStyle = shore;
  ctx.fillRect(0, shoreY, w, h - shoreY);
  drawFoam(ctx, w, shoreY, time);
  drawVignette(ctx, w, h);
}

function drawSun(ctx, w, h) {
  var x = w * 0.74;
  var y = h * 0.15;
  var glow = ctx.createRadialGradient(x, y, w * 0.02, x, y, w * 0.42);
  glow.addColorStop(0, theme.sunCore);
  glow.addColorStop(0.35, theme.sunGlow);
  glow.addColorStop(1, 'rgba(120, 176, 214, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h * 0.48);

  ctx.fillStyle = 'rgba(255, 214, 156, 0.72)';
  ctx.beginPath();
  ctx.arc(x, y, Math.max(10, w * 0.028), 0, Math.PI * 2);
  ctx.fill();
}

function drawCloud(ctx, x, y, scale) {
  function puff(px, py, radius) {
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  puff(x, y, 16 * scale);
  puff(x + 20 * scale, y - 8 * scale, 22 * scale);
  puff(x + 44 * scale, y + 1 * scale, 15 * scale);
}

function drawClouds(ctx, w, h, time) {
  var s = w / 375;
  ctx.fillStyle = theme.cloud;
  var driftA = (time * 0.008) % (w + 180);
  var driftB = (time * 0.005) % (w + 220);
  drawCloud(ctx, -40 + driftA, h * 0.1, s);
  drawCloud(ctx, w * 0.18 + driftB * 0.35, h * 0.18, s * 0.8);
  drawCloud(ctx, w * 0.55 - driftA * 0.25, h * 0.08, s * 0.7);
}

function drawIslands(ctx, w, horizonY) {
  ctx.fillStyle = theme.islandFar;
  ctx.beginPath();
  ctx.moveTo(w * 0.58, horizonY);
  ctx.quadraticCurveTo(w * 0.68, horizonY - w * 0.035, w * 0.78, horizonY);
  ctx.fill();

  ctx.fillStyle = theme.island;
  ctx.beginPath();
  ctx.moveTo(-w * 0.02, horizonY + 1);
  ctx.quadraticCurveTo(w * 0.08, horizonY - w * 0.055, w * 0.16, horizonY - w * 0.01);
  ctx.quadraticCurveTo(w * 0.24, horizonY - w * 0.04, w * 0.32, horizonY + 1);
  ctx.fill();
}

function drawWaves(ctx, w, horizonY, shoreY, time) {
  var band = shoreY - horizonY;
  strokeWave(ctx, horizonY + band * 0.22, w * 0.012, 90, time / 900, theme.waveSoft, 2, w);
  strokeWave(ctx, horizonY + band * 0.42, w * 0.016, 70, time / 700 + 1, theme.wave, 2, w);
  strokeWave(ctx, horizonY + band * 0.64, w * 0.014, 110, time / 1100 + 2, theme.waveSoft, 2, w);
}

function strokeWave(ctx, y, amp, length, phase, color, width, w) {
  ctx.beginPath();
  var x = 0;
  var first = true;
  while (x <= w) {
    var yy = y + Math.sin(x / length + phase) * amp;
    if (first) ctx.moveTo(x, yy);
    else ctx.lineTo(x, yy);
    first = false;
    x += 8;
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function drawFoam(ctx, w, shoreY, time) {
  ctx.beginPath();
  var x = 0;
  var first = true;
  while (x <= w) {
    var yy = shoreY + Math.sin(x / 48 + time / 800) * 3 + 1;
    if (first) ctx.moveTo(x, yy);
    else ctx.lineTo(x, yy);
    first = false;
    x += 6;
  }
  ctx.strokeStyle = theme.foam;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawVignette(ctx, w, h) {
  var glow = ctx.createRadialGradient(w / 2, h * 0.45, w * 0.2, w / 2, h * 0.5, w * 0.95);
  glow.addColorStop(0, 'rgba(0, 0, 0, 0)');
  glow.addColorStop(1, theme.vignette);
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
}

function drawFish(ctx, x, y, scale, face, flap) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(face, 1);
  ctx.rotate(flap * 0.08);

  ctx.fillStyle = theme.dragon;
  ctx.beginPath();
  if (ctx.ellipse) {
    ctx.ellipse(0, 0, scale * 0.9, scale * 0.48, 0, 0, Math.PI * 2);
  } else {
    ctx.save();
    ctx.scale(1, 0.53);
    ctx.arc(0, 0, scale * 0.9, 0, Math.PI * 2);
    ctx.restore();
  }
  ctx.fill();

  ctx.fillStyle = theme.dragonBelly;
  ctx.beginPath();
  if (ctx.ellipse) {
    ctx.ellipse(scale * 0.08, scale * 0.12, scale * 0.42, scale * 0.2, 0, 0, Math.PI * 2);
  } else {
    ctx.arc(scale * 0.08, scale * 0.12, scale * 0.22, 0, Math.PI * 2);
  }
  ctx.fill();

  ctx.fillStyle = theme.dragonFin;
  ctx.beginPath();
  ctx.moveTo(-scale * 0.7, 0);
  ctx.quadraticCurveTo(-scale * 1.15, -scale * 0.42 + flap * scale * 0.2, -scale * 1.35, 0);
  ctx.quadraticCurveTo(-scale * 1.15, scale * 0.42 - flap * scale * 0.2, -scale * 0.7, 0);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-scale * 0.05, -scale * 0.35);
  ctx.quadraticCurveTo(scale * 0.05, -scale * 0.72, scale * 0.28, -scale * 0.32);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = theme.dragonRim;
  ctx.lineWidth = Math.max(1, scale * 0.08);
  ctx.beginPath();
  ctx.moveTo(scale * 0.05, -scale * 0.08);
  ctx.quadraticCurveTo(scale * 0.2, 0, scale * 0.05, scale * 0.12);
  ctx.stroke();

  ctx.fillStyle = theme.eye;
  ctx.beginPath();
  ctx.arc(scale * 0.42, -scale * 0.08, Math.max(1.6, scale * 0.12), 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = theme.pupil;
  ctx.beginPath();
  ctx.arc(scale * 0.46, -scale * 0.08, Math.max(0.9, scale * 0.06), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFishSchool(ctx, w, layout, time) {
  var horizonY = layout.horizonY;
  var shoreY = layout.shoreY;
  var midY = horizonY * 0.35 + shoreY * 0.65;
  var span = Math.max(24, shoreY - horizonY - w * 0.08);
  var fish = [
    { lane: 0.18, depth: 0.22, size: 0.034, speed: 0.018, phase: 0.2, face: 1 },
    { lane: 0.42, depth: 0.48, size: 0.046, speed: 0.014, phase: 1.1, face: 1 },
    { lane: 0.68, depth: 0.32, size: 0.03, speed: 0.02, phase: 2.4, face: -1 },
    { lane: 0.86, depth: 0.62, size: 0.028, speed: 0.016, phase: 3.3, face: 1 }
  ];
  var i;
  for (i = 0; i < fish.length; i++) {
    var f = fish[i];
    var travel = ((time * f.speed) + f.lane * w + f.phase * 40) % (w + w * 0.28);
    var x = f.face > 0 ? -w * 0.12 + travel : w + w * 0.12 - travel;
    var bob = Math.sin(time / 420 + f.phase) * span * 0.08;
    var y = midY - span * 0.28 + f.depth * span * 0.7 + bob;
    if (y > shoreY - w * 0.05) y = shoreY - w * 0.05;
    if (y < horizonY + w * 0.04) y = horizonY + w * 0.04;
    var flap = Math.sin(time / 160 + f.phase * 2);
    drawFish(ctx, x, y, w * f.size, f.face, flap);
  }
}

module.exports = {
  paintBackground: paintBackground
};

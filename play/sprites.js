function fillEllipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  if (ctx.ellipse) {
    ctx.ellipse(x, y, Math.max(0.5, rx), Math.max(0.5, ry), 0, 0, Math.PI * 2);
  } else {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, ry / Math.max(rx, 0.5));
    ctx.arc(0, 0, Math.max(0.5, rx), 0, Math.PI * 2);
    ctx.restore();
  }
  ctx.fill();
}

function drawDragon(ctx, x, y, size, facing, time, alpha) {
  var bob = Math.sin(time / 180) * size * 0.02;
  var flap = Math.sin(time / 140);
  var face = facing < 0 ? -1 : 1;
  var s = size * 0.42;
  ctx.save();
  ctx.globalAlpha = alpha == null ? 1 : alpha;
  ctx.translate(x, y + bob);
  ctx.scale(face, 1);
  ctx.rotate(flap * 0.05);

  // Tail on the left, head to the right.
  ctx.fillStyle = '#1E6A88';
  ctx.beginPath();
  ctx.moveTo(-s * 0.75, 0);
  ctx.quadraticCurveTo(-s * 1.2, -s * 0.55 + flap * s * 0.18, -s * 1.45, 0);
  ctx.quadraticCurveTo(-s * 1.2, s * 0.55 - flap * s * 0.18, -s * 0.75, 0);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#08283C';
  fillEllipse(ctx, 0, 0, s, s * 0.52);
  ctx.fillStyle = 'rgba(126, 198, 214, 0.42)';
  fillEllipse(ctx, s * 0.08, s * 0.12, s * 0.42, s * 0.22);

  ctx.fillStyle = '#0A334C';
  ctx.beginPath();
  ctx.moveTo(-s * 0.05, -s * 0.35);
  ctx.quadraticCurveTo(s * 0.08, -s * 0.78, s * 0.32, -s * 0.3);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-s * 0.1, s * 0.28);
  ctx.quadraticCurveTo(s * 0.05, s * 0.55, s * 0.22, s * 0.22);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(176, 226, 236, 0.55)';
  ctx.lineWidth = Math.max(1.2, size * 0.014);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(s * 0.05, -s * 0.08);
  ctx.quadraticCurveTo(s * 0.22, 0, s * 0.05, s * 0.12);
  ctx.stroke();

  ctx.fillStyle = '#F6E7B8';
  ctx.beginPath();
  ctx.arc(s * 0.48, -s * 0.08, Math.max(2, s * 0.12), 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1A1408';
  ctx.beginPath();
  ctx.arc(s * 0.52, -s * 0.08, Math.max(1.1, s * 0.06), 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFF8E8';
  ctx.beginPath();
  ctx.arc(s * 0.45, -s * 0.11, Math.max(0.6, s * 0.03), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function squidMouthOffset(scale) {
  return -scale * 1.28;
}

function drawSquid(ctx, x, footY, scale, time, puff) {
  ctx.save();
  ctx.translate(x, footY);
  var mantleY = -scale * 0.92;
  var i;
  ctx.strokeStyle = '#2A1844';
  ctx.lineCap = 'round';
  ctx.lineWidth = scale * 0.11;
  for (i = -2; i <= 2; i++) {
    var wave = Math.sin(time / 200 + i) * scale * 0.1;
    ctx.beginPath();
    ctx.moveTo(i * scale * 0.14, mantleY + scale * 0.2);
    ctx.quadraticCurveTo(i * scale * 0.2 + wave, -scale * 0.28, i * scale * 0.08 + wave * 0.6, -scale * 0.02);
    ctx.stroke();
  }

  ctx.fillStyle = '#4A2C78';
  fillEllipse(ctx, 0, mantleY, scale * 0.42, scale * 0.34);
  ctx.fillStyle = '#6E4CA0';
  fillEllipse(ctx, -scale * 0.06, mantleY + scale * 0.04, scale * 0.16, scale * 0.18);

  ctx.fillStyle = '#F4F1EA';
  fillEllipse(ctx, -scale * 0.14, mantleY - scale * 0.02, scale * 0.09, scale * 0.1);
  fillEllipse(ctx, scale * 0.14, mantleY - scale * 0.02, scale * 0.09, scale * 0.1);
  ctx.fillStyle = '#1A1024';
  ctx.beginPath();
  ctx.arc(-scale * 0.14, mantleY - scale * 0.05, scale * 0.04, 0, Math.PI * 2);
  ctx.arc(scale * 0.14, mantleY - scale * 0.05, scale * 0.04, 0, Math.PI * 2);
  ctx.fill();

  if (puff > 0) {
    ctx.fillStyle = 'rgba(20, 12, 32, ' + (0.55 * puff) + ')';
    fillEllipse(ctx, 0, mantleY - scale * 0.42, scale * 0.16 * puff, scale * 0.22 * puff);
  }
  ctx.restore();
}

function drawInk(ctx, x, y, radius, alpha) {
  if (alpha <= 0) return;
  ctx.fillStyle = 'rgba(18, 10, 28, ' + (0.78 * alpha) + ')';
  fillEllipse(ctx, x, y + radius * 0.55, radius * 0.45, radius * 0.55);
  fillEllipse(ctx, x, y + radius * 0.2, radius * 0.7, radius * 0.62);
  ctx.fillStyle = 'rgba(28, 16, 48, ' + (0.9 * alpha) + ')';
  fillEllipse(ctx, x, y, radius, radius * 0.86);
  ctx.fillStyle = 'rgba(92, 64, 140, ' + (0.35 * alpha) + ')';
  fillEllipse(ctx, x - radius * 0.15, y - radius * 0.12, radius * 0.28, radius * 0.2);
}

function drawOctopus(ctx, x, y, scale, time, chasing) {
  var wave = Math.sin(time / 180);
  var hurry = chasing ? 1.25 : 0.7;
  ctx.save();
  ctx.translate(x, y);

  ctx.strokeStyle = '#5A2E7A';
  ctx.lineCap = 'round';
  ctx.lineWidth = scale * 0.12;
  var i;
  for (i = -2; i <= 2; i++) {
    var sway = Math.sin(time / 160 * hurry + i) * scale * 0.16;
    ctx.beginPath();
    ctx.moveTo(i * scale * 0.12, scale * 0.08);
    ctx.quadraticCurveTo(
      i * scale * 0.22 + sway,
      scale * 0.42,
      i * scale * 0.08 + sway * 0.5,
      scale * 0.7
    );
    ctx.stroke();
  }

  ctx.fillStyle = '#6E3C96';
  fillEllipse(ctx, 0, -scale * 0.08, scale * 0.46, scale * 0.38);
  ctx.fillStyle = '#8A58B4';
  fillEllipse(ctx, -scale * 0.08, -scale * 0.02, scale * 0.18, scale * 0.2);

  ctx.fillStyle = '#F4F1EA';
  fillEllipse(ctx, -scale * 0.16, -scale * 0.12, scale * 0.1, scale * 0.11);
  fillEllipse(ctx, scale * 0.16, -scale * 0.12, scale * 0.1, scale * 0.11);
  ctx.fillStyle = '#1A1024';
  ctx.beginPath();
  ctx.arc(-scale * 0.14, -scale * 0.14, scale * 0.045, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(scale * 0.18, -scale * 0.14, scale * 0.045, 0, Math.PI * 2);
  ctx.fill();

  if (chasing) {
    ctx.strokeStyle = 'rgba(255, 170, 210, 0.45)';
    ctx.lineWidth = Math.max(1.2, scale * 0.04);
    ctx.beginPath();
    ctx.moveTo(-scale * 0.08, scale * 0.02);
    ctx.quadraticCurveTo(0, scale * 0.08 + wave * scale * 0.04, scale * 0.08, scale * 0.02);
    ctx.stroke();
  }
  ctx.restore();
}

function drawNest(ctx, x, y, scale, time) {
  var bob = Math.sin(time / 700) * scale * 0.03;
  ctx.save();
  ctx.translate(x, y + bob);

  ctx.fillStyle = '#14382C';
  fillEllipse(ctx, -scale * 0.15, scale * 0.42, scale * 0.95, scale * 0.28);
  fillEllipse(ctx, scale * 0.35, scale * 0.38, scale * 0.55, scale * 0.22);

  ctx.fillStyle = '#1C4A36';
  ctx.beginPath();
  ctx.moveTo(-scale * 0.95, scale * 0.35);
  ctx.quadraticCurveTo(-scale * 1.05, -scale * 0.15, -scale * 0.45, -scale * 0.55);
  ctx.quadraticCurveTo(0, -scale * 0.72, scale * 0.45, -scale * 0.5);
  ctx.quadraticCurveTo(scale * 0.95, -scale * 0.1, scale * 0.9, scale * 0.35);
  ctx.quadraticCurveTo(scale * 0.2, scale * 0.2, -scale * 0.95, scale * 0.35);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#0A2430';
  fillEllipse(ctx, 0, scale * 0.02, scale * 0.42, scale * 0.34);

  var glow = ctx.createRadialGradient(0, 0, scale * 0.05, 0, 0, scale * 0.4);
  glow.addColorStop(0, 'rgba(120, 210, 180, 0.35)');
  glow.addColorStop(1, 'rgba(120, 210, 180, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, scale * 0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#2F8A58';
  ctx.lineWidth = Math.max(1.5, scale * 0.05);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-scale * 0.55, -scale * 0.2);
  ctx.quadraticCurveTo(-scale * 0.35, -scale * 0.55, -scale * 0.1, -scale * 0.35);
  ctx.moveTo(scale * 0.2, -scale * 0.3);
  ctx.quadraticCurveTo(scale * 0.4, -scale * 0.6, scale * 0.55, -scale * 0.25);
  ctx.stroke();

  ctx.fillStyle = 'rgba(186, 230, 238, 0.45)';
  var i;
  for (i = 0; i < 3; i++) {
    var bx = -scale * 0.1 + i * scale * 0.12;
    var by = -scale * 0.05 - ((time / 400 + i) % 1) * scale * 0.45;
    ctx.beginPath();
    ctx.arc(bx, by, scale * 0.035, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawJelly(ctx, x, y, r, time, phase) {
  var bob = Math.sin(time / 520 + phase) * r * 0.12;
  var flap = Math.sin(time / 280 + phase);
  ctx.save();
  ctx.translate(x, y + bob);

  ctx.fillStyle = 'rgba(186, 230, 250, 0.35)';
  fillEllipse(ctx, 0, -r * 0.05, r * 0.95, r * 0.72);
  ctx.fillStyle = 'rgba(120, 196, 230, 0.55)';
  fillEllipse(ctx, 0, -r * 0.12, r * 0.72, r * 0.5);
  ctx.fillStyle = 'rgba(240, 252, 255, 0.55)';
  fillEllipse(ctx, -r * 0.18, -r * 0.22, r * 0.22, r * 0.16);

  ctx.strokeStyle = 'rgba(160, 220, 240, 0.55)';
  ctx.lineWidth = Math.max(1, r * 0.06);
  ctx.lineCap = 'round';
  var i;
  for (i = 0; i < 5; i++) {
    var ox = -r * 0.42 + i * r * 0.21;
    var sway = Math.sin(time / 240 + i + phase) * r * 0.12;
    ctx.beginPath();
    ctx.moveTo(ox, r * 0.15);
    ctx.quadraticCurveTo(ox + sway, r * (0.55 + flap * 0.08), ox - sway * 0.4, r * 0.95);
    ctx.stroke();
  }
  ctx.restore();
}

function snakeSway(t, time, amp) {
  // t: 0 at wall root, 1 at head tip. Fade to 0 near tip so neck meets head on axis.
  var fade = (1 - t) * (1 - t);
  var wave = Math.sin(t * Math.PI * 2.4 + time / 180) * 0.85;
  var drift = Math.sin(time / 240) * 0.18;
  return amp * (wave + drift) * (0.25 + 0.75 * t) * fade;
}

function drawSnakeBody(ctx, x, yRoot, yHead, scale, time) {
  var len = yHead - yRoot;
  var dist = Math.abs(len);
  if (dist < 2) return;
  var amp = scale * 0.2;
  var steps = Math.max(8, Math.floor(dist / (scale * 0.22)));
  var i;
  var thick = Math.max(3.2, scale * 0.3);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#2F8A4A';
  ctx.lineWidth = thick;
  ctx.beginPath();
  for (i = 0; i <= steps; i++) {
    var t = i / steps;
    var y = yRoot + len * t;
    // Slightly thicken into the head by continuing past nominal tip.
    var sway = snakeSway(t, time, amp);
    if (i === 0) ctx.moveTo(x + sway, y);
    else ctx.lineTo(x + sway, y);
  }
  ctx.stroke();
  ctx.strokeStyle = '#6BCF7A';
  ctx.lineWidth = Math.max(1.6, scale * 0.13);
  ctx.beginPath();
  for (i = 0; i <= steps; i++) {
    var u = i / steps;
    var yy = yRoot + len * u;
    var sx = snakeSway(u, time, amp);
    if (i === 0) ctx.moveTo(x + sx, yy);
    else ctx.lineTo(x + sx, yy);
  }
  ctx.stroke();
}

function drawSnakeHead(ctx, x, y, scale, time, facingDown) {
  var dir = facingDown ? 1 : -1;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, dir);
  // Neck stub so body and head share the same green mass.
  ctx.fillStyle = '#2F8A4A';
  fillEllipse(ctx, 0, -scale * 0.22, scale * 0.16, scale * 0.2);
  ctx.fillStyle = '#247A3E';
  fillEllipse(ctx, 0, 0, scale * 0.28, scale * 0.34);
  ctx.fillStyle = '#3FA85A';
  fillEllipse(ctx, 0, scale * 0.05, scale * 0.17, scale * 0.2);
  ctx.fillStyle = '#F4F1EA';
  ctx.beginPath();
  ctx.arc(-scale * 0.1, -scale * 0.04, scale * 0.055, 0, Math.PI * 2);
  ctx.arc(scale * 0.1, -scale * 0.04, scale * 0.055, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1A1024';
  ctx.beginPath();
  ctx.arc(-scale * 0.1, -scale * 0.05, scale * 0.028, 0, Math.PI * 2);
  ctx.arc(scale * 0.1, -scale * 0.05, scale * 0.028, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#E85A5A';
  ctx.lineWidth = Math.max(1, scale * 0.04);
  ctx.beginPath();
  ctx.moveTo(0, scale * 0.2);
  ctx.quadraticCurveTo(-scale * 0.07, scale * 0.34, -scale * 0.03, scale * 0.44);
  ctx.moveTo(0, scale * 0.2);
  ctx.quadraticCurveTo(scale * 0.07, scale * 0.34, scale * 0.03, scale * 0.44);
  ctx.stroke();
  ctx.restore();
}

function drawSnake(ctx, x, topY, bottomY, openY, openH, scale, time) {
  var gapTop = openY - openH / 2;
  var gapBot = openY + openH / 2;
  var headInset = scale * 0.12;
  ctx.save();
  if (gapTop > topY + 2) {
    var topHeadY = gapTop - scale * 0.02;
    // Body runs into the head center so the neck doesn't leave a kink/gap.
    drawSnakeBody(ctx, x, topY, topHeadY + headInset, scale, time);
    drawSnakeHead(ctx, x, topHeadY, scale, time, true);
  }
  if (bottomY > gapBot + 2) {
    var botHeadY = gapBot + scale * 0.02;
    drawSnakeBody(ctx, x, bottomY, botHeadY - headInset, scale, time + 80);
    drawSnakeHead(ctx, x, botHeadY, scale, time + 80, false);
  }
  ctx.restore();
}

function drawPuffer(ctx, x, y, r, time, phase) {
  var spike = Math.sin(time / 200 + phase) * 0.08;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#E8C45A';
  fillEllipse(ctx, 0, 0, r, r * 0.92);
  ctx.fillStyle = '#F4DEA0';
  fillEllipse(ctx, -r * 0.12, -r * 0.18, r * 0.42, r * 0.36);
  ctx.strokeStyle = '#C89A30';
  ctx.lineWidth = Math.max(1, r * 0.06);
  var i;
  for (i = 0; i < 10; i++) {
    var a = (i / 10) * Math.PI * 2 + phase * 0.2;
    var x0 = Math.cos(a) * r * 0.78;
    var y0 = Math.sin(a) * r * 0.72;
    var x1 = Math.cos(a) * r * (1.08 + spike);
    var y1 = Math.sin(a) * r * (1.02 + spike);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }
  ctx.fillStyle = '#1A1024';
  ctx.beginPath();
  ctx.arc(-r * 0.22, -r * 0.08, r * 0.08, 0, Math.PI * 2);
  ctx.arc(r * 0.18, -r * 0.1, r * 0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(-r * 0.25, -r * 0.11, r * 0.03, 0, Math.PI * 2);
  ctx.arc(r * 0.15, -r * 0.13, r * 0.03, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#8A5A28';
  ctx.lineWidth = Math.max(1, r * 0.05);
  ctx.beginPath();
  ctx.arc(0, r * 0.18, r * 0.16, 0.15, Math.PI - 0.15);
  ctx.stroke();
  ctx.restore();
}

function drawSweep(ctx, x, y, w, h, active, time) {
  var pulse = 0.45 + Math.sin(time / 120) * 0.2;
  ctx.save();
  if (active) {
    ctx.fillStyle = 'rgba(255, 120, 90, ' + pulse + ')';
    ctx.fillRect(x - w / 2, y, w, h);
    ctx.strokeStyle = 'rgba(255, 220, 180, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x - w / 2, y, w, h);
  } else {
    ctx.strokeStyle = 'rgba(255, 160, 120, 0.28)';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(x - w / 2, y, w, h);
    ctx.setLineDash([]);
  }
  ctx.restore();
}

module.exports = {
  drawDragon: drawDragon,
  drawSquid: drawSquid,
  drawInk: drawInk,
  drawOctopus: drawOctopus,
  drawNest: drawNest,
  drawJelly: drawJelly,
  drawSnake: drawSnake,
  drawCrab: drawSnake,
  drawPuffer: drawPuffer,
  drawSweep: drawSweep,
  squidMouthOffset: squidMouthOffset
};

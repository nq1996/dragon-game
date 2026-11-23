function seabedY(layout) {
  return layout.h * 0.84;
}

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

function buildKelpPatches(layout, goalX, dense) {
  var floorY = seabedY(layout);
  var patches = [];
  var gap = layout.w * (dense ? 0.58 : 0.72);
  var x = layout.w * 0.42;
  var i = 0;
  var bands = [
    { kind: 'bottom', y: floorY, rise: layout.px(dense ? 120 : 100) },
    { kind: 'mid', y: layout.h * 0.5, rise: layout.px(dense ? 54 : 46) },
    { kind: 'high', y: layout.h * 0.3, rise: layout.px(dense ? 48 : 40) }
  ];
  while (x < goalX + layout.w * 0.35) {
    var band = bands[i % bands.length];
    var hw = layout.px(dense ? 36 : 30);
    var jitter = ((i % 3) - 1) * layout.px(16);
    if (band.kind === 'bottom') {
      patches.push({
        kind: 'bottom',
        wx: x + jitter,
        top: floorY - band.rise,
        bottom: floorY,
        hw: hw
      });
    } else {
      var cy = band.y + ((i % 2) * 2 - 1) * layout.px(10);
      patches.push({
        kind: band.kind,
        wx: x + jitter,
        top: cy - band.rise * 0.55,
        bottom: cy + band.rise * 0.55,
        hw: hw
      });
    }
    x += gap + (i % 3) * layout.px(12);
    i += 1;
  }
  return patches;
}

function inKelp(wx, wy, patches) {
  var i;
  for (i = 0; i < patches.length; i++) {
    var p = patches[i];
    if (wx >= p.wx - p.hw && wx <= p.wx + p.hw && wy >= p.top && wy <= p.bottom) {
      return true;
    }
  }
  return false;
}

function paintOcean(ctx, layout, cameraX, time, kelp) {
  var w = layout.w;
  var h = layout.h;
  var floorY = seabedY(layout);
  var water = ctx.createLinearGradient(0, 0, 0, h);
  water.addColorStop(0, '#07384A');
  water.addColorStop(0.42, '#042838');
  water.addColorStop(1, '#02141C');
  ctx.fillStyle = water;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.globalAlpha = 0.045;
  ctx.fillStyle = '#C5EEF8';
  var i;
  for (i = 0; i < 4; i++) {
    var rayX = w * (0.12 + i * 0.24) + Math.sin(time / 1100 + i) * 10;
    ctx.beginPath();
    ctx.moveTo(rayX, 0);
    ctx.lineTo(rayX + w * 0.028, 0);
    ctx.lineTo(rayX + w * 0.09, floorY);
    ctx.lineTo(rayX - w * 0.02, floorY);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  ctx.fillStyle = 'rgba(186, 230, 238, 0.32)';
  for (i = 0; i < 16; i++) {
    var moteX = ((i * 91 + time * 0.02) % (w + 40)) - 20;
    var moteY = (i * 53 + Math.sin(time / 800 + i) * 18) % (floorY - 24);
    ctx.beginPath();
    ctx.arc(moteX, moteY + 12, (i % 3) + 1.1, 0, Math.PI * 2);
    ctx.fill();
  }

  var sand = ctx.createLinearGradient(0, floorY, 0, h);
  sand.addColorStop(0, '#14382C');
  sand.addColorStop(1, '#07140F');
  ctx.fillStyle = sand;
  ctx.fillRect(0, floorY, w, h - floorY);

  for (i = 0; i < 7; i++) {
    var rockX = ((i * 128 - cameraX * 0.45) % (w + 180) + (w + 180)) % (w + 180) - 70;
    ctx.fillStyle = i % 2 === 0 ? '#0E2E24' : '#184233';
    fillEllipse(ctx, rockX, floorY + 2, layout.px(34 + (i % 3) * 8), layout.px(12));
  }

  var patches = kelp || [];
  for (i = 0; i < patches.length; i++) {
    var patch = patches[i];
    var sx = patch.wx - cameraX;
    if (sx < -60 || sx > w + 60) continue;
    var sway = Math.sin(time / 480 + i * 1.3) * layout.px(12);
    var strands = patch.kind === 'bottom' ? 4 : 3;
    var n;
    for (n = 0; n < strands; n++) {
      var ox = (n - (strands - 1) / 2) * layout.px(patch.kind === 'bottom' ? 9 : 8);
      ctx.strokeStyle = n % 2 === 0 ? '#1C6A42' : '#258052';
      ctx.lineCap = 'round';
      ctx.lineWidth = layout.px(n % 2 === 0 ? 3.2 : 2.2);
      ctx.beginPath();
      if (patch.kind === 'bottom') {
        ctx.moveTo(sx + ox, patch.bottom);
        ctx.quadraticCurveTo(
          sx + ox + sway,
          (patch.top + patch.bottom) / 2,
          sx + ox + sway * 0.35,
          patch.top + layout.px(6)
        );
      } else {
        var midY = (patch.top + patch.bottom) / 2;
        ctx.moveTo(sx + ox, midY + (patch.bottom - patch.top) * 0.35);
        ctx.quadraticCurveTo(
          sx + ox + sway,
          midY,
          sx + ox - sway * 0.25,
          midY - (patch.bottom - patch.top) * 0.4
        );
      }
      ctx.stroke();
    }
  }
}

module.exports = {
  seabedY: seabedY,
  paintOcean: paintOcean,
  buildKelpPatches: buildKelpPatches,
  inKelp: inKelp
};

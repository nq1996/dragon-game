var theme = require('./theme.js');
var draw = require('./draw.js');

function gloss(ctx, rect) {
  ctx.save();
  draw.roundRect(ctx, rect.x, rect.y, rect.w, rect.h, rect.r);
  ctx.clip();
  var fade = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h * 0.55);
  fade.addColorStop(0, 'rgba(255, 255, 255, 0.34)');
  fade.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = fade;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h * 0.55);
  ctx.restore();
}

function drawPill(ctx, rect, text, scale) {
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.28)';
  ctx.shadowBlur = 10 * scale;
  ctx.shadowOffsetY = 3 * scale;
  var fill = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
  fill.addColorStop(0, theme.pillTop);
  fill.addColorStop(1, theme.pillBottom);
  ctx.fillStyle = fill;
  draw.roundRect(ctx, rect.x, rect.y, rect.w, rect.h, rect.r);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  gloss(ctx, rect);
  ctx.strokeStyle = theme.pillStroke;
  ctx.lineWidth = 1;
  draw.roundRect(ctx, rect.x + 0.5, rect.y + 0.5, rect.w - 1, rect.h - 1, rect.r);
  ctx.stroke();
  ctx.fillStyle = theme.pillText;
  ctx.font = draw.font('bold', 14, scale);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, rect.x + rect.w / 2, rect.y + rect.h / 2 + scale);
  ctx.restore();
}

function pillRect(ctx, layout, text, menu) {
  ctx.font = draw.font('bold', 14, layout.s);
  var textWidth = ctx.measureText(text).width;
  var width = textWidth + layout.px(28);
  var height = layout.pill.h;
  var x = (layout.w - width) / 2;
  var y = layout.pill.y;
  if (menu && x + width > menu.left - layout.px(10)) {
    x = menu.left - layout.px(10) - width;
  }
  if (x < layout.px(12)) x = layout.px(12);
  return {
    x: x,
    y: y,
    w: width,
    h: height,
    r: height / 2
  };
}

function drawPrimaryButton(ctx, rect, title, sub, scale, pressed) {
  var shift = pressed ? 2 * scale : 0;
  var box = {
    x: rect.x,
    y: rect.y + shift,
    w: rect.w,
    h: rect.h,
    r: rect.r
  };
  ctx.save();
  ctx.shadowColor = theme.btnShadow;
  ctx.shadowBlur = (pressed ? 6 : 14) * scale;
  ctx.shadowOffsetY = (pressed ? 2 : 6) * scale;
  var fill = ctx.createLinearGradient(0, box.y, 0, box.y + box.h);
  fill.addColorStop(0, pressed ? theme.btnTopPressed : theme.btnTop);
  fill.addColorStop(0.48, pressed ? theme.btnMidPressed : theme.btnMid);
  fill.addColorStop(1, pressed ? theme.btnBottomPressed : theme.btnBottom);
  ctx.fillStyle = fill;
  draw.roundRect(ctx, box.x, box.y, box.w, box.h, box.r);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  if (!pressed) gloss(ctx, box);
  ctx.strokeStyle = theme.btnStroke;
  ctx.lineWidth = 1.5;
  draw.roundRect(ctx, box.x + 0.75, box.y + 0.75, box.w - 1.5, box.h - 1.5, box.r);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = theme.btnText;
  if (sub) {
    ctx.font = draw.font('bold', 20, scale);
    ctx.fillText(title, box.x + box.w / 2, box.y + box.h * 0.38);
    ctx.font = draw.font('bold', 13, scale);
    ctx.fillStyle = theme.btnSub;
    ctx.fillText(sub, box.x + box.w / 2, box.y + box.h * 0.7);
  } else {
    ctx.font = draw.font('bold', 20, scale);
    ctx.fillText(title, box.x + box.w / 2, box.y + box.h / 2);
  }
  ctx.restore();
}

function drawSecondaryButton(ctx, rect, text, scale, pressed) {
  var shift = pressed ? 1 * scale : 0;
  var box = {
    x: rect.x,
    y: rect.y + shift,
    w: rect.w,
    h: rect.h,
    r: rect.r
  };
  ctx.save();
  var fill = ctx.createLinearGradient(0, box.y, 0, box.y + box.h);
  fill.addColorStop(0, pressed ? '#185C88' : theme.secondaryTop);
  fill.addColorStop(1, theme.secondaryBottom);
  ctx.fillStyle = fill;
  draw.roundRect(ctx, box.x, box.y, box.w, box.h, box.r);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.lineWidth = 1;
  draw.roundRect(ctx, box.x + 0.5, box.y + 0.5, box.w - 1, box.h - 1, box.r);
  ctx.stroke();
  ctx.fillStyle = theme.secondaryText;
  ctx.font = draw.font('bold', 14, scale);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, box.x + box.w / 2, box.y + box.h / 2);
  ctx.restore();
}

function drawTip(ctx, layout, text) {
  ctx.font = draw.font('normal', 13, layout.s);
  var width = ctx.measureText(text).width + layout.px(24);
  var height = layout.px(32);
  var x = (layout.w - width) / 2;
  var y = layout.startButton.y - height - layout.px(12);
  var rect = { x: x, y: y, w: width, h: height, r: height / 2 };
  ctx.save();
  ctx.fillStyle = theme.tipBg;
  draw.roundRect(ctx, rect.x, rect.y, rect.w, rect.h, rect.r);
  ctx.fill();
  ctx.fillStyle = theme.tipText;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, rect.x + rect.w / 2, rect.y + rect.h / 2);
  ctx.restore();
}

module.exports = {
  pillRect: pillRect,
  drawPill: drawPill,
  drawPrimaryButton: drawPrimaryButton,
  drawSecondaryButton: drawSecondaryButton,
  drawTip: drawTip,
  hit: draw.hit
};

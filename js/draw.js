function roundRect(ctx, x, y, w, h, r) {
  var radius = r;
  if (radius > w / 2) radius = w / 2;
  if (radius > h / 2) radius = h / 2;
  if (radius < 0) radius = 0;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function font(weight, size, scale) {
  return weight + ' ' + Math.round(size * scale) + 'px PingFang SC, Microsoft YaHei, sans-serif';
}

function hit(rect, x, y) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

module.exports = {
  roundRect: roundRect,
  font: font,
  hit: hit
};

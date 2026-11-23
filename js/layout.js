function createLayout(screen) {
  var w = screen.width;
  var h = screen.height;
  var s = w / 375;
  function px(value) {
    return value * s;
  }

  var horizonY = h * 0.4;
  var shoreY = h * 0.72;
  var btnW = Math.min(px(210), w * 0.58);
  var btnH = px(68);
  var mineW = px(44);
  var mineH = px(44);
  var stackGap = px(12);
  // Vertical stack: start centered, “我的” on the next row right-aligned.
  var mineX = w - px(20) - mineW;
  var mineY = h - screen.safeBottom - px(16) - mineH;
  var btnX = (w - btnW) / 2;
  var btnY = mineY - stackGap - btnH;
  var minY = shoreY + px(12);
  if (btnY < minY) {
    btnY = minY;
    mineY = btnY + btnH + stackGap;
  }

  var pillY = screen.safeTop + px(18);
  var pillH = px(34);

  var sideW = px(44);
  var sideH = px(44);
  var sideX = px(10);
  var settingsY = pillY + (pillH - sideH) / 2;
  var csY = settingsY + sideH + px(12);

  var giftW = px(58);
  var giftH = px(58);
  var giftX = sideX + (sideW - giftW) / 2;
  var giftY = Math.max(csY + sideH + px(14), h * 0.28);

  return {
    w: w,
    h: h,
    s: s,
    px: px,
    horizonY: horizonY,
    shoreY: shoreY,
    safeTop: screen.safeTop,
    safeBottom: screen.safeBottom,
    startButton: {
      x: btnX,
      y: btnY,
      w: btnW,
      h: btnH,
      r: px(20)
    },
    giftButton: {
      x: giftX,
      y: giftY,
      w: giftW,
      h: giftH,
      r: px(12)
    },
    settingsButton: {
      x: sideX,
      y: settingsY,
      w: sideW,
      h: sideH,
      r: px(12)
    },
    customerServiceButton: {
      x: sideX,
      y: csY,
      w: sideW,
      h: sideH,
      r: px(12)
    },
    mineButton: {
      x: mineX,
      y: mineY,
      w: mineW,
      h: mineH,
      r: px(12)
    },
    pill: {
      y: pillY,
      h: pillH
    },
    minePanel: {
      count: 1000,
      itemH: px(36),
      cols: 5,
      panelMaxH: Math.min(px(420), h * 0.68),
      panelPad: px(10),
      avatar: px(56)
    }
  };
}

module.exports = {
  createLayout: createLayout
};

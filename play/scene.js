var ocean = require('./ocean.js');
var sprites = require('./sprites.js');
var levels = require('./levels.js');

var INTRO_MS = 1400;
var INK_LIFE = 2600;
var MAX_LEVEL = levels.MAX_LEVEL;
var FREE_RETRIES = 2;

function createPlayScene(api) {
  var phase = 'intro';
  var introT = 0;
  var hintT = 0;
  var warnT = 0;
  var cameraX = 0;
  var level = 1;
  var tip = '';
  var failReason = '';
  var failCount = 0;
  var finger = null;
  var backPressed = false;
  var retryPressed = false;
  var homePressed = false;
  var nextPressed = false;
  var revivePressed = false;
  var invulnT = 0;
  var revivedOnce = false;
  var endTip = '';
  var endTipT = 0;
  var dragon = { sx: 0, sy: 0, facing: 1 };
  var squids = [];
  var inks = [];
  var kelp = [];
  var octopuses = [];
  var jellies = [];
  var crabs = [];
  var sweeps = [];
  var puffers = [];
  var hidden = false;
  var prevHidden = false;
  var octGone = false;
  var goalX = 0;
  var nest = null;
  var shotMs = 980;
  var inkSpeed = 0.46;
  var catchR = 0;
  var octSpeed = 0;
  var hideWaitMs = 0;
  var frontArmed = false;
  var frontCoolT = 0;
  var frontCoolMs = 5000;
  var frontGap = 0;
  var frontEnabled = true;
  var chaseWarnMs = 0;
  var hasSquid = false;
  var hasChase = false;
  var hasJelly = false;
  var hasCrab = false;
  var hasSweep = false;
  var hasPuffer = false;
  var playTime = 0;

  function clampLevel(value) {
    var next = parseInt(value, 10) || 1;
    if (next < 1) return 1;
    if (next > MAX_LEVEL) return MAX_LEVEL;
    return next;
  }

  function nextShotGap(base) {
    var lo = base * 0.55;
    var hi = base * 1.55;
    return lo + Math.random() * (hi - lo);
  }

  function adConfigured() {
    var ad = api.getRewardedAd && api.getRewardedAd();
    return !!(ad && ad.isConfigured && ad.isConfigured());
  }

  function needsAdToRetry() {
    return failCount >= FREE_RETRIES && adConfigured();
  }

  function freeRetriesLeft() {
    var left = FREE_RETRIES - failCount;
    return left > 0 ? left : 0;
  }

  function reset(fullIntro, levelNo) {
    var layout = api.layout();
    var nextLevel = clampLevel(levelNo || level || api.getProgress().getLevel());
    if (nextLevel !== level) failCount = 0;
    level = nextLevel;
    var size = dragonSize(layout);
    var setup = levels.buildLevel(layout, level, size);
    phase = fullIntro ? 'intro' : 'play';
    introT = 0;
    hintT = fullIntro ? 0 : 2200;
    tip = setup.tip || '';
    failReason = '';
    cameraX = 0;
    squids = setup.squids;
    kelp = setup.kelp;
    octopuses = setup.octopuses;
    jellies = setup.jellies;
    crabs = setup.crabs;
    sweeps = setup.sweeps;
    puffers = setup.puffers || [];
    goalX = setup.goalX;
    nest = setup.nest;
    shotMs = setup.shotMs;
    inkSpeed = setup.inkSpeed;
    hasSquid = setup.hasSquid;
    hasChase = setup.hasChase;
    hasJelly = setup.hasJelly;
    hasCrab = setup.hasCrab;
    hasSweep = setup.hasSweep;
    hasPuffer = setup.hasPuffer;
    playTime = 0;
    if (setup.chase) {
      chaseWarnMs = setup.chase.warnMs;
      warnT = setup.chase.delay > 0 ? 0 : setup.chase.warnMs;
      octSpeed = setup.chase.octSpeed;
      catchR = setup.chase.catchR;
      hideWaitMs = setup.chase.hideWaitMs;
      frontCoolMs = setup.chase.frontCoolMs;
      frontGap = setup.chase.frontGap;
      frontEnabled = setup.chase.front;
    } else {
      chaseWarnMs = 0;
      warnT = 0;
      octSpeed = 0;
      catchR = 0;
      hideWaitMs = 0;
      frontCoolMs = 5000;
      frontGap = layout.w * 0.75;
      frontEnabled = false;
    }
    hidden = false;
    prevHidden = false;
    octGone = false;
    frontArmed = false;
    frontCoolT = hasChase ? frontCoolMs * 0.45 : 0;
    finger = null;
    backPressed = false;
    retryPressed = false;
    homePressed = false;
    nextPressed = false;
    revivePressed = false;
    invulnT = 0;
    revivedOnce = false;
    endTip = '';
    endTipT = 0;
    inks = [];
    dragon.sx = fullIntro ? -layout.px(80) : layout.w * 0.28;
    dragon.sy = layout.h * 0.46;
    dragon.facing = 1;
    if (octopuses.length && !fullIntro) {
      var rear = octopuses[0];
      if (!rear.unlockAt) {
        rear.wx = dragonWorldX() - layout.w * 0.35;
        rear.sy = dragon.sy;
        rear.lastX = dragonWorldX();
        rear.lastY = dragon.sy;
        rear.state = warnT <= 0 ? 'chase' : 'warn';
        rear.waitT = 0;
      }
      frontArmed = false;
      frontCoolT = frontCoolMs * 0.55;
    }
  }

  function hasSide(side) {
    var i;
    for (i = 0; i < octopuses.length; i++) {
      if (octopuses[i].side === side) return true;
    }
    return false;
  }

  function spawnRearOctopus(layout, warnMs) {
    var fishX = dragonWorldX();
    octopuses.push({
      side: 'rear',
      wx: fishX - layout.w * 0.42,
      sy: dragon.sy,
      state: warnMs > 0 ? 'warn' : 'chase',
      lastX: fishX,
      lastY: dragon.sy,
      waitT: 0,
      unlockAt: 0
    });
    warnT = warnMs;
    octGone = false;
    frontArmed = false;
    frontCoolT = Math.max(frontCoolT, frontCoolMs * 0.5);
    if (warnMs <= 0) hintT = 1600;
    else hintT = Math.max(hintT, warnMs);
  }

  function spawnFrontOctopus(layout) {
    if (!frontEnabled) return;
    if (hasSide('front')) return;
    if (frontCoolT > 0) return;
    var fishX = dragonWorldX();
    // Spawn well ahead so it scrolls into view instead of flashing at the edge.
    octopuses.push({
      side: 'front',
      wx: fishX + layout.w * 1.45,
      sy: dragon.sy + (Math.random() - 0.5) * layout.px(48),
      state: 'warn',
      warnLeft: 1600,
      lastX: fishX,
      lastY: dragon.sy,
      waitT: 0,
      unlockAt: 0
    });
    frontArmed = false;
    frontCoolT = frontCoolMs;
    hintT = Math.max(hintT, 1600);
  }

  function dragonSize(layout) {
    return layout.px(78);
  }

  function bounds(layout) {
    var size = dragonSize(layout);
    return {
      left: layout.px(28),
      followRight: layout.w * 0.28,
      top: layout.safeTop + size * 0.32,
      bottom: ocean.seabedY(layout) - size * 0.32
    };
  }

  function backRect(layout) {
    return {
      x: layout.px(16),
      y: layout.safeTop + layout.px(8),
      w: layout.px(72),
      h: layout.px(34),
      r: layout.px(17)
    };
  }

  function endButtons(layout) {
    var width = Math.min(layout.px(168), layout.w * 0.58);
    var x = (layout.w - width) / 2;
    var showRevive = phase === 'over' && !revivedOnce;
    var retryY = showRevive ? layout.h * 0.5 : layout.h * 0.46;
    var buttons = {
      revive: null,
      retry: { x: x, y: retryY, w: width, h: layout.px(48), r: layout.px(16) },
      home: {
        x: x,
        y: retryY + layout.px(56),
        w: width,
        h: layout.px(42),
        r: layout.px(16)
      }
    };
    if (showRevive) {
      buttons.revive = {
        x: x,
        y: retryY - layout.px(56),
        w: width,
        h: layout.px(44),
        r: layout.px(16)
      };
    }
    return buttons;
  }

  function clearThreatsNearFish(layout) {
    var fishX = dragonWorldX();
    var keep = [];
    var i;
    for (i = 0; i < inks.length; i++) {
      var ink = inks[i];
      var dx = ink.wx - fishX;
      var dy = ink.y - dragon.sy;
      if (dx * dx + dy * dy > layout.px(90) * layout.px(90)) keep.push(ink);
    }
    inks = keep;
    for (i = 0; i < octopuses.length; i++) {
      var oct = octopuses[i];
      if (oct.side === 'rear') oct.wx = Math.min(oct.wx, fishX - layout.w * 0.35);
      else oct.wx = Math.max(oct.wx, fishX + layout.w * 0.4);
      oct.state = 'chase';
    }
  }

  function audio() {
    return api.getAudio && api.getAudio();
  }

  function takeHit(reason) {
    if (invulnT > 0) return false;
    if (api.getProgress().useShield()) {
      invulnT = 1600;
      hintT = 1400;
      clearThreatsNearFish(api.layout());
      var a = audio();
      if (a) {
        a.playSfx('hit');
        a.vibrate('short');
      }
      return false;
    }
    failReason = reason;
    failCount += 1;
    phase = 'over';
    finger = null;
    var a2 = audio();
    if (a2) {
      a2.playSfx('hit');
      a2.vibrate('long');
    }
    return true;
  }

  function reviveAfterAd() {
    phase = 'play';
    failReason = '';
    revivedOnce = true;
    invulnT = 2200;
    hintT = 1600;
    finger = null;
    clearThreatsNearFish(api.layout());
  }

  function showAd(onSuccess, failMsg) {
    var ad = api.getRewardedAd && api.getRewardedAd();
    if (!ad) {
      endTip = failMsg || '广告暂未开通';
      endTipT = 1800;
      return;
    }
    ad.show(
      function () {
        if (onSuccess) onSuccess();
      },
      function (msg) {
        endTip = msg || failMsg || '广告暂未开通';
        endTipT = 1800;
        if (api.toast) api.toast(endTip);
      },
      failMsg
    );
  }

  function requestRevive() {
    showAd(reviveAfterAd, '需看完广告才能复活');
  }

  function requestAdRetry() {
    showAd(function () {
      reset(false, level);
    }, '看完广告才能再试');
  }

  function stick() {
    if (!finger || phase !== 'play') return { x: 0, y: 0 };
    var layout = api.layout();
    var dx = finger.x - finger.ox;
    var dy = finger.y - finger.oy;
    var radius = layout.px(70);
    var dead = layout.px(12);
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < dead) return { x: 0, y: 0 };
    if (dist > radius) {
      dx = dx / dist * radius;
      dy = dy / dist * radius;
    }
    return { x: dx / radius, y: dy / radius };
  }

  function dragonWorldX() {
    return cameraX + dragon.sx;
  }

  function moveDragon(dt, layout) {
    var vector = stick();
    var speed = layout.w * 0.46 * dt / 1000;
    var box = bounds(layout);
    dragon.sx += vector.x * speed;
    dragon.sy += vector.y * speed;
    if (vector.x > 0.2) dragon.facing = 1;
    if (vector.x < -0.2) dragon.facing = -1;
    if (dragon.sy < box.top) dragon.sy = box.top;
    if (dragon.sy > box.bottom) dragon.sy = box.bottom;

    if (dragon.sx > box.followRight) {
      cameraX += dragon.sx - box.followRight;
      dragon.sx = box.followRight;
    }

    if (dragon.sx < box.left) {
      var overflow = box.left - dragon.sx;
      if (cameraX > 0) {
        var scroll = cameraX < overflow ? cameraX : overflow;
        cameraX -= scroll;
        dragon.sx += scroll;
      }
      if (dragon.sx < box.left) dragon.sx = box.left;
    }
  }

  function shootFrom(squid, layout) {
    var scale = layout.px(58);
    var mouthY = ocean.seabedY(layout) + sprites.squidMouthOffset(scale);
    inks.push({
      wx: squid.wx,
      y: mouthY,
      vy: -layout.h * inkSpeed,
      r: layout.px(15),
      life: INK_LIFE
    });
    squid.puff = 1;
  }

  function updateInks(dt, layout) {
    var i;
    if (phase === 'play' && hasSquid) {
      for (i = 0; i < squids.length; i++) {
        var squid = squids[i];
        squid.shotT += dt;
        if (squid.shotT >= squid.nextShot) {
          squid.shotT = 0;
          squid.nextShot = nextShotGap(shotMs);
          shootFrom(squid, layout);
        }
        squid.puff = Math.max(0, squid.puff - dt / 220);
      }
    } else {
      for (i = 0; i < squids.length; i++) {
        squids[i].puff = Math.max(0, squids[i].puff - dt / 220);
      }
    }
    var keep = [];
    for (i = 0; i < inks.length; i++) {
      var ink = inks[i];
      ink.life -= dt;
      ink.y += ink.vy * dt / 1000;
      ink.r += dt * 0.01;
      if (ink.life > 0 && ink.y > -ink.r) keep.push(ink);
    }
    inks = keep;
  }

  function hitByInk(layout) {
    var size = dragonSize(layout);
    var wx = dragonWorldX();
    var face = dragon.facing < 0 ? -1 : 1;
    var points = [
      { x: wx + face * size * 0.22, y: dragon.sy },
      { x: wx + face * size * 0.08, y: dragon.sy - size * 0.08 },
      { x: wx + face * size * 0.08, y: dragon.sy + size * 0.08 },
      { x: wx - face * size * 0.08, y: dragon.sy },
      { x: wx - face * size * 0.28, y: dragon.sy }
    ];
    var i;
    var n;
    for (i = 0; i < inks.length; i++) {
      var ink = inks[i];
      var reach = size * 0.18 + ink.r * 0.62;
      for (n = 0; n < points.length; n++) {
        var dx = points[n].x - ink.wx;
        var dy = points[n].y - ink.y;
        if (dx * dx + dy * dy < reach * reach) return true;
      }
    }
    return false;
  }

  function hitByJelly(layout) {
    var size = dragonSize(layout);
    var wx = dragonWorldX();
    var i;
    for (i = 0; i < jellies.length; i++) {
      var jelly = jellies[i];
      var jy = jelly.sy + Math.sin(playTime / 520 + jelly.phase) * jelly.r * 0.12;
      var dx = wx - jelly.wx;
      var dy = dragon.sy - jy;
      var reach = size * 0.22 + jelly.r * 0.72;
      if (dx * dx + dy * dy < reach * reach) return true;
    }
    return false;
  }

  function hitByPuffer(layout) {
    var size = dragonSize(layout);
    var wx = dragonWorldX();
    var i;
    for (i = 0; i < puffers.length; i++) {
      var puffer = puffers[i];
      var inflate = 0.78 + Math.sin(playTime / 420 + puffer.phase) * 0.22;
      var pr = puffer.r * inflate;
      var py = puffer.sy + Math.sin(playTime / 640 + puffer.phase) * layout.px(10);
      var dx = wx - puffer.wx;
      var dy = dragon.sy - py;
      var reach = size * 0.2 + pr * 0.78;
      if (dx * dx + dy * dy < reach * reach) return true;
    }
    return false;
  }

  function crabGap(crab) {
    var t = ((playTime / crab.period) + crab.phase) % 1;
    if (t < 0) t += 1;
    var wave = (Math.sin(t * Math.PI * 2) + 1) / 2;
    var openFrac = crab.open * (0.38 + wave * 0.62);
    return crab.gateH * openFrac;
  }

  function hitByCrab(layout) {
    var size = dragonSize(layout);
    var box = bounds(layout);
    var wx = dragonWorldX();
    var clawW = layout.px(30);
    var i;
    for (i = 0; i < crabs.length; i++) {
      var crab = crabs[i];
      if (Math.abs(wx - crab.wx) > clawW * 0.55 + size * 0.18) continue;
      var openH = crabGap(crab);
      var mid = (box.top + box.bottom) / 2;
      var gapTop = mid - openH / 2;
      var gapBot = mid + openH / 2;
      if (dragon.sy < gapTop + size * 0.12 || dragon.sy > gapBot - size * 0.12) return true;
    }
    return false;
  }

  function sweepActive(sweep) {
    var t = ((playTime / sweep.period) + sweep.phase) % 1;
    if (t < 0) t += 1;
    return t * sweep.period < sweep.active;
  }

  function hitBySweep(layout) {
    var size = dragonSize(layout);
    var wx = dragonWorldX();
    var i;
    for (i = 0; i < sweeps.length; i++) {
      var sweep = sweeps[i];
      if (!sweepActive(sweep)) continue;
      if (Math.abs(wx - sweep.wx) > sweep.w * 0.5 + size * 0.16) continue;
      if (dragon.sy > sweep.y - size * 0.1 && dragon.sy < sweep.y + sweep.h + size * 0.1) return true;
    }
    return false;
  }

  function moveOctopusToward(oct, targetX, targetY, dt, speedScale) {
    var step = octSpeed * speedScale * dt / 1000;
    var dx = targetX - oct.wx;
    if (oct.side === 'front') {
      if (Math.abs(dx) <= step) oct.wx = targetX;
      else oct.wx += dx > 0 ? step : -step;
    } else if (dx > 0) {
      oct.wx += Math.min(step, dx);
    }
    var dy = targetY - oct.sy;
    var yStep = step * 0.92;
    if (Math.abs(dy) <= yStep) oct.sy = targetY;
    else oct.sy += dy > 0 ? yStep : -yStep;
  }

  function caughtBy(oct, fishX, fishY) {
    var dx = fishX - oct.wx;
    var dy = fishY - oct.sy;
    return dx * dx + dy * dy < catchR * catchR;
  }

  function updateOneOctopus(oct, dt, layout, fishX, fishY) {
    if (oct.unlockAt && fishX < oct.unlockAt) {
      oct.wx = fishX - layout.w * 0.55;
      oct.sy = fishY;
      return false;
    }
    if (oct.unlockAt && !oct.unlocked) {
      oct.unlocked = true;
      oct.state = 'warn';
      oct.wx = fishX - layout.w * 0.7;
      warnT = chaseWarnMs || 1600;
      hintT = Math.max(hintT, warnT);
    }

    if (oct.state === 'warn') {
      if (oct.side === 'rear') {
        warnT -= dt;
        if (warnT <= 0) {
          warnT = 0;
          oct.state = 'chase';
          frontArmed = false;
          frontCoolT = Math.max(frontCoolT, frontCoolMs * 0.35);
          hintT = 1800;
        }
      } else {
        // Front octopus drifts into view during warn, then starts chasing.
        oct.warnLeft = (oct.warnLeft || 1200) - dt;
        oct.wx -= octSpeed * 0.38 * dt / 1000;
        if (oct.warnLeft <= 0 || oct.wx - cameraX < layout.w * 0.82) {
          oct.state = 'chase';
          hintT = Math.max(hintT, 1400);
        }
      }
      oct.sy += (fishY - oct.sy) * Math.min(1, dt / 520);
      return false;
    }

    if (oct.state === 'wait') {
      oct.waitT -= dt;
      if (oct.side === 'rear') oct.wx += octSpeed * 0.15 * dt / 1000;
      else oct.wx -= octSpeed * 0.12 * dt / 1000;
      if (!hidden) {
        oct.state = 'chase';
        oct.lastX = fishX;
        oct.lastY = fishY;
      } else if (oct.waitT <= 0) {
        oct.state = 'leave';
      }
      return false;
    }

    if (oct.state === 'leave') {
      if (oct.side === 'rear') oct.wx += octSpeed * 1.7 * dt / 1000;
      else oct.wx -= octSpeed * 1.7 * dt / 1000;
      var screenX = oct.wx - cameraX;
      if (oct.side === 'rear' && screenX > layout.w + layout.px(90)) oct.gone = true;
      if (oct.side === 'front' && screenX < -layout.px(90)) {
        oct.gone = true;
        frontCoolT = Math.max(frontCoolT, frontCoolMs);
      }
      return false;
    }

    if (hidden) {
      oct.state = 'wait';
      oct.waitT = hideWaitMs;
      return false;
    }

    oct.lastX = fishX;
    oct.lastY = fishY;
    moveOctopusToward(oct, oct.lastX, oct.lastY, dt, oct.side === 'front' ? 1.08 : 1);
    return caughtBy(oct, fishX, fishY);
  }

  function updateChase(dt, layout) {
    var fishX = dragonWorldX();
    var fishY = dragon.sy;
    var caught = false;
    var keep = [];
    var i;
    hidden = ocean.inKelp(fishX, fishY, kelp);

    if (frontCoolT > 0) frontCoolT -= dt;

    if (!octopuses.length) {
      if (octGone && prevHidden && !hidden) {
        spawnRearOctopus(layout, 900);
      }
      prevHidden = hidden;
      return false;
    }

    if (frontEnabled && !hasSide('front') && frontCoolT <= 0) {
      var rear = null;
      for (i = 0; i < octopuses.length; i++) {
        if (octopuses[i].side === 'rear' && octopuses[i].state === 'chase') rear = octopuses[i];
      }
      if (rear && fishX - rear.wx > frontGap) spawnFrontOctopus(layout);
    }

    for (i = 0; i < octopuses.length; i++) {
      var oct = octopuses[i];
      if (updateOneOctopus(oct, dt, layout, fishX, fishY)) caught = true;
      if (!oct.gone) keep.push(oct);
    }
    octopuses = keep;
    if (!octopuses.length) octGone = true;
    prevHidden = hidden;
    return caught;
  }

  function reachedGoal() {
    if (!nest) return dragonWorldX() > goalX;
    var dx = (dragonWorldX() - nest.wx) / nest.rx;
    var dy = (dragon.sy - nest.cy) / nest.ry;
    return dx * dx + dy * dy <= 1;
  }

  function onLevelClear() {
    var a = audio();
    if (a) {
      a.playSfx('clear');
      a.vibrate('short');
    }
    // Only push unlock forward; replaying earlier levels must not reset progress.
    var unlocked = api.getProgress().getLevel();
    if (level >= unlocked && level < MAX_LEVEL) {
      api.getProgress().setLevel(level + 1);
    }
  }

  function introLine() {
    return tip || '游到鱼窝就算过关';
  }

  function playHint() {
    if (invulnT > 0) return '护盾生效中';
    if (hasChase && octopuses.length) {
      var i;
      for (i = 0; i < octopuses.length; i++) {
        if (octopuses[i].unlockAt && dragonWorldX() < octopuses[i].unlockAt) continue;
        if (octopuses[i].state === 'warn') return '小心被章鱼攻击';
      }
      for (i = 0; i < octopuses.length; i++) {
        if (octopuses[i].state === 'chase') return '它追过来了';
      }
    }
    if (hasCrab) return '卡住水蛇开口再通过';
    if (hasPuffer) return '躲开鼓起的河豚';
    if (hasJelly) return '躲开水母';
    if (hasSweep) return '注意脉冲光带';
    if (hasSquid) return '按住滑动控制方向';
    return tip || '';
  }

  function failText() {
    if (failReason === 'octopus') return '被章鱼抓住了';
    if (failReason === 'jelly') return '碰到水母了';
    if (failReason === 'crab') return '被水蛇挡住了';
    if (failReason === 'puffer') return '碰到河豚了';
    if (failReason === 'sweep') return '撞上光带了';
    return '';
  }

  function drawIntro(ctx, layout) {
    var p = introT / INTRO_MS;
    if (p > 1) p = 1;
    var fade = p < 0.18 ? p / 0.18 : (p > 0.72 ? 1 - (p - 0.72) / 0.28 : 1);
    var i;
    ctx.save();
    ctx.strokeStyle = 'rgba(214, 244, 252, ' + ((1 - p) * 0.75) + ')';
    ctx.lineWidth = layout.px(3);
    ctx.beginPath();
    ctx.arc(layout.w * 0.5, layout.h * 0.46, p * Math.max(layout.w, layout.h) * 0.75, 0, Math.PI * 2);
    ctx.stroke();
    for (i = 0; i < 8; i++) {
      var rise = (p * 1.15 + i / 8) % 1;
      var bx = layout.w * (0.2 + (i % 4) * 0.2);
      var by = layout.h * (0.72 - rise * 0.5);
      ctx.fillStyle = 'rgba(226, 246, 252, ' + ((1 - rise) * 0.45) + ')';
      ctx.beginPath();
      ctx.arc(bx, by, layout.px(4 + (i % 3)), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = Math.max(0, fade);
    ctx.fillStyle = '#E7F6FF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = api.font('bold', 34, layout.s);
    ctx.fillText('第' + level + '关', layout.w / 2, layout.h * 0.32);
    ctx.font = api.font('normal', 14, layout.s);
    ctx.fillStyle = 'rgba(214, 238, 246, 0.9)';
    ctx.fillText(introLine(), layout.w / 2, layout.h * 0.38);
    ctx.restore();
  }

  function drawStick(ctx, layout) {
    if (!finger || phase !== 'play') return;
    var radius = layout.px(70);
    var dx = finger.x - finger.ox;
    var dy = finger.y - finger.oy;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > radius && dist > 0) {
      dx = dx / dist * radius;
      dy = dy / dist * radius;
    }
    ctx.save();
    ctx.strokeStyle = 'rgba(232, 248, 255, 0.35)';
    ctx.lineWidth = layout.px(2);
    ctx.beginPath();
    ctx.arc(finger.ox, finger.oy, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(232, 248, 255, 0.45)';
    ctx.beginPath();
    ctx.arc(finger.ox + dx, finger.oy + dy, layout.px(16), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawHint(ctx, layout, text, floorY) {
    if (!text || hintT <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.min(1, hintT / 500);
    ctx.font = api.font('normal', 13, layout.s);
    var hintW = ctx.measureText(text).width + layout.px(22);
    var hintH = layout.px(28);
    var hintX = (layout.w - hintW) / 2;
    var hintY = floorY - layout.px(46);
    ctx.fillStyle = 'rgba(2, 12, 18, 0.55)';
    ctx.beginPath();
    ctx.moveTo(hintX + hintH / 2, hintY);
    ctx.arcTo(hintX + hintW, hintY, hintX + hintW, hintY + hintH, hintH / 2);
    ctx.arcTo(hintX + hintW, hintY + hintH, hintX, hintY + hintH, hintH / 2);
    ctx.arcTo(hintX, hintY + hintH, hintX, hintY, hintH / 2);
    ctx.arcTo(hintX, hintY, hintX + hintW, hintY, hintH / 2);
    ctx.fill();
    ctx.fillStyle = '#E7F6FF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, layout.w / 2, hintY + hintH / 2);
    ctx.restore();
  }

  function drawAheadMarker(ctx, layout, worldX, worldY, tint) {
    var sx = worldX - cameraX;
    if (sx < layout.w - layout.px(12) || sx > layout.w + layout.w * 1.2) return;
    var edgeX = layout.w - layout.px(14);
    var pulse = 0.45 + Math.sin(playTime / 160) * 0.3;
    var y = worldY;
    if (y < layout.safeTop + layout.px(24)) y = layout.safeTop + layout.px(24);
    if (y > layout.h - layout.safeBottom - layout.px(24)) y = layout.h - layout.safeBottom - layout.px(24);
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.fillStyle = tint || 'rgba(255, 170, 90, 0.9)';
    ctx.beginPath();
    ctx.moveTo(edgeX + layout.px(6), y);
    ctx.lineTo(edgeX - layout.px(10), y - layout.px(9));
    ctx.lineTo(edgeX - layout.px(10), y + layout.px(9));
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  function drawShieldBadge(ctx, cx, cy, size, active) {
    var s = size;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.48);
    ctx.quadraticCurveTo(s * 0.48, -s * 0.42, s * 0.42, -s * 0.05);
    ctx.quadraticCurveTo(s * 0.34, s * 0.28, 0, s * 0.5);
    ctx.quadraticCurveTo(-s * 0.34, s * 0.28, -s * 0.42, -s * 0.05);
    ctx.quadraticCurveTo(-s * 0.48, -s * 0.42, 0, -s * 0.48);
    ctx.closePath();
    var fill = ctx.createLinearGradient(0, -s * 0.5, 0, s * 0.5);
    if (active) {
      fill.addColorStop(0, '#FFE08A');
      fill.addColorStop(1, '#E0A028');
    } else {
      fill.addColorStop(0, '#7EC8E8');
      fill.addColorStop(1, '#2F7CA8');
    }
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = Math.max(1, s * 0.06);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.28);
    ctx.quadraticCurveTo(s * 0.22, -s * 0.22, s * 0.2, -s * 0.02);
    ctx.quadraticCurveTo(s * 0.16, s * 0.16, 0, s * 0.28);
    ctx.quadraticCurveTo(-s * 0.16, s * 0.16, -s * 0.2, -s * 0.02);
    ctx.quadraticCurveTo(-s * 0.22, -s * 0.22, 0, -s * 0.28);
    ctx.closePath();
    ctx.fillStyle = active ? 'rgba(255, 248, 220, 0.55)' : 'rgba(220, 244, 255, 0.45)';
    ctx.fill();
    ctx.restore();
  }

  function drawShieldHud(ctx, layout) {
    var shields = api.getProgress().getShields();
    var active = invulnT > 0;
    var badge = layout.px(28);
    var x = layout.px(16);
    var y = layout.h - layout.safeBottom - layout.px(22);
    var boxW = layout.px(58);
    var boxH = layout.px(32);
    ctx.save();
    ctx.fillStyle = 'rgba(2, 12, 18, 0.45)';
    ctx.beginPath();
    ctx.moveTo(x + boxH / 2, y - boxH / 2);
    ctx.arcTo(x + boxW, y - boxH / 2, x + boxW, y + boxH / 2, boxH / 2);
    ctx.arcTo(x + boxW, y + boxH / 2, x, y + boxH / 2, boxH / 2);
    ctx.arcTo(x, y + boxH / 2, x, y - boxH / 2, boxH / 2);
    ctx.arcTo(x, y - boxH / 2, x + boxW, y - boxH / 2, boxH / 2);
    ctx.fill();
    drawShieldBadge(ctx, x + layout.px(18), y, badge, active);
    ctx.fillStyle = '#E7F6FF';
    ctx.font = api.font('bold', 14, layout.s);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('×' + shields, x + layout.px(34), y + layout.px(1));
    ctx.restore();
  }

  function drawEnd(ctx, layout) {
    var buttons = endButtons(layout);
    var cleared = phase === 'clear';
    var finalClear = cleared && level >= MAX_LEVEL;
    var title = cleared ? (finalClear ? '全部通关' : ('通过第' + level + '关')) : '游戏结束';
    var retryNeedsAd = !cleared && needsAdToRetry();
    var sub = cleared
      ? (finalClear ? '闯过了全部关卡' : '准备进入下一关')
      : (retryNeedsAd
        ? '免费次数已用完'
        : (adConfigured()
          ? ('还可免费再试' + freeRetriesLeft() + '次')
          : failText()));
    var primary = cleared
      ? (finalClear ? '再玩一次' : '下一关')
      : (retryNeedsAd ? '看广告再试' : '再试一次');
    var titleAnchor = buttons.revive || buttons.retry;
    var titleY = sub
      ? titleAnchor.y - layout.px(58)
      : titleAnchor.y - layout.px(36);
    var subY = titleAnchor.y - layout.px(28);
    ctx.save();
    ctx.fillStyle = 'rgba(2, 10, 16, 0.62)';
    ctx.fillRect(0, 0, layout.w, layout.h);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#EAF7FF';
    ctx.font = api.font('bold', 32, layout.s);
    ctx.fillText(title, layout.w / 2, titleY);
    if (sub) {
      ctx.fillStyle = 'rgba(214, 236, 244, 0.88)';
      ctx.font = api.font('normal', 15, layout.s);
      ctx.fillText(sub, layout.w / 2, subY);
    }
    ctx.restore();
    if (buttons.revive) {
      api.ui.drawPrimaryButton(
        ctx,
        buttons.revive,
        '看广告复活',
        '',
        layout.s,
        revivePressed
      );
    }
    api.ui.drawPrimaryButton(
      ctx,
      buttons.retry,
      primary,
      '',
      layout.s,
      cleared ? nextPressed : retryPressed
    );
    api.ui.drawSecondaryButton(ctx, buttons.home, '返回', layout.s, homePressed);
    if (endTip && endTipT > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, endTipT / 400);
      ctx.fillStyle = 'rgba(214, 236, 244, 0.95)';
      ctx.font = api.font('normal', 13, layout.s);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(endTip, layout.w / 2, buttons.home.y + buttons.home.h + layout.px(24));
      ctx.restore();
    }
  }

  return {
    enter: function (params) {
      reset(true, params && params.level);
      var a = audio();
      if (a) {
        a.unlock();
        a.playMusic(true);
      }
    },
    update: function (dt) {
      var layout = api.layout();
      var targetX = layout.w * 0.28;
      if (phase === 'intro') {
        introT += dt;
        var p = introT / INTRO_MS;
        if (p > 1) p = 1;
        var ease = 1 - Math.pow(1 - p, 3);
        dragon.sx = -layout.px(90) + (targetX + layout.px(90)) * ease;
        dragon.sy = layout.h * 0.46;
        if (octopuses.length && !octopuses[0].unlockAt) {
          octopuses[0].wx = dragonWorldX() - layout.w * 0.38;
          octopuses[0].sy = dragon.sy;
          octopuses[0].lastX = dragonWorldX();
          octopuses[0].lastY = dragon.sy;
        }
        if (introT >= INTRO_MS) {
          phase = 'play';
          dragon.sx = targetX;
          hintT = hasChase ? Math.max(warnT, 2400) : 2400;
          if (octopuses.length && !octopuses[0].unlockAt) {
            octopuses[0].wx = dragonWorldX() - layout.w * 0.38;
            octopuses[0].sy = dragon.sy;
          }
        }
        return;
      }
      if (phase === 'play') {
        playTime += dt;
        hintT -= dt;
        if (invulnT > 0) invulnT -= dt;
        moveDragon(dt, layout);
        if (hasSquid) {
          updateInks(dt, layout);
          if (hitByInk(layout) && takeHit('ink')) return;
        } else {
          updateInks(dt, layout);
        }
        if (hasChase && updateChase(dt, layout) && takeHit('octopus')) return;
        else if (!hasChase) hidden = false;
        if (hasJelly && hitByJelly(layout) && takeHit('jelly')) return;
        if (hasPuffer && hitByPuffer(layout) && takeHit('puffer')) return;
        if (hasCrab && hitByCrab(layout) && takeHit('crab')) return;
        if (hasSweep && hitBySweep(layout) && takeHit('sweep')) return;
        if (reachedGoal()) {
          phase = 'clear';
          finger = null;
          onLevelClear();
        }
        return;
      }
      if (phase === 'over' || phase === 'clear') {
        if (endTipT > 0) endTipT -= dt;
        updateInks(dt, layout);
      }
    },
    render: function (ctx, now) {
      var layout = api.layout();
      var size = dragonSize(layout);
      var floorY = ocean.seabedY(layout);
      var squidScale = layout.px(58);
      var octScale = layout.px(52);
      var box = bounds(layout);
      var i;
      ocean.paintOcean(ctx, layout, cameraX, now || 0, kelp);

      for (i = 0; i < crabs.length; i++) {
        var crab = crabs[i];
        var cx = crab.wx - cameraX;
        if (cx < -layout.px(60) || cx > layout.w + layout.px(60)) continue;
        var openH = crabGap(crab);
        var mid = (box.top + box.bottom) / 2;
        sprites.drawSnake(ctx, cx, box.top, box.bottom, mid, openH, layout.px(42), now || 0);
      }

      for (i = 0; i < sweeps.length; i++) {
        var sweep = sweeps[i];
        var swx = sweep.wx - cameraX;
        if (swx < -layout.px(80) || swx > layout.w + layout.px(80)) continue;
        sprites.drawSweep(ctx, swx, sweep.y, sweep.w, sweep.h, sweepActive(sweep), now || 0);
      }

      for (i = 0; i < jellies.length; i++) {
        var jelly = jellies[i];
        var jx = jelly.wx - cameraX;
        if (jx < -layout.px(80) || jx > layout.w + layout.px(80)) continue;
        var jy = jelly.sy + Math.sin(playTime / 520 + jelly.phase) * jelly.r * 0.12;
        sprites.drawJelly(ctx, jx, jy, jelly.r, now || 0, jelly.phase);
      }
      for (i = 0; i < puffers.length; i++) {
        var puffer = puffers[i];
        var px = puffer.wx - cameraX;
        if (px < -layout.px(80) || px > layout.w + layout.px(80)) continue;
        var py = puffer.sy + Math.sin(playTime / 640 + puffer.phase) * layout.px(10);
        var inflate = 0.78 + Math.sin(playTime / 420 + puffer.phase) * 0.22;
        sprites.drawPuffer(ctx, px, py, puffer.r * inflate, now || 0, puffer.phase);
      }

      for (i = 0; i < squids.length; i++) {
        var squid = squids[i];
        var sx = squid.wx - cameraX;
        if (sx < -layout.px(80) || sx > layout.w + layout.px(80)) continue;
        sprites.drawSquid(ctx, sx, floorY, squidScale, now || 0, squid.puff);
      }
      for (i = 0; i < inks.length; i++) {
        var ink = inks[i];
        sprites.drawInk(ctx, ink.wx - cameraX, ink.y, ink.r, ink.life / INK_LIFE);
      }
      for (i = 0; i < octopuses.length; i++) {
        var oct = octopuses[i];
        if (oct.unlockAt && dragonWorldX() < oct.unlockAt - layout.w * 0.2) continue;
        sprites.drawOctopus(
          ctx,
          oct.wx - cameraX,
          oct.sy,
          octScale,
          now || 0,
          oct.state === 'chase' || oct.state === 'wait' || (oct.side === 'front' && oct.state === 'warn')
        );
        if (oct.side === 'front') drawAheadMarker(ctx, layout, oct.wx, oct.sy, 'rgba(255, 140, 170, 0.95)');
      }
      for (i = 0; i < jellies.length; i++) {
        drawAheadMarker(ctx, layout, jellies[i].wx, jellies[i].sy, 'rgba(140, 210, 240, 0.9)');
      }
      for (i = 0; i < crabs.length; i++) {
        drawAheadMarker(ctx, layout, crabs[i].wx, (box.top + box.bottom) / 2, 'rgba(120, 210, 140, 0.9)');
      }
      for (i = 0; i < sweeps.length; i++) {
        drawAheadMarker(ctx, layout, sweeps[i].wx, sweeps[i].y + sweeps[i].h * 0.5, 'rgba(255, 150, 100, 0.9)');
      }
      for (i = 0; i < puffers.length; i++) {
        drawAheadMarker(ctx, layout, puffers[i].wx, puffers[i].sy, 'rgba(240, 200, 100, 0.95)');
      }
      if (nest) {
        var nestX = nest.wx - cameraX;
        if (nestX > -layout.px(120) && nestX < layout.w + layout.px(120)) {
          sprites.drawNest(ctx, nestX, nest.cy, layout.px(58), now || 0);
        }
      }
      var fishAlpha = hidden ? 0.38 : 1;
      if (invulnT > 0) fishAlpha = 0.55 + Math.sin((now || 0) / 60) * 0.25;
      sprites.drawDragon(
        ctx,
        dragon.sx,
        dragon.sy,
        size,
        dragon.facing,
        now || 0,
        fishAlpha
      );
      if (phase === 'intro') drawIntro(ctx, layout);
      drawStick(ctx, layout);
      if (phase === 'play') {
        drawShieldHud(ctx, layout);
        drawHint(ctx, layout, playHint(), floorY);
      }
      if (phase === 'play' || phase === 'intro') {
        api.ui.drawSecondaryButton(ctx, backRect(layout), '返回', layout.s, backPressed);
      }
      if (phase === 'over' || phase === 'clear') drawEnd(ctx, layout);
    },
    onTouchStart: function (x, y) {
      var layout = api.layout();
      if (phase === 'over' || phase === 'clear') {
        var buttons = endButtons(layout);
        revivePressed = !!(buttons.revive && api.ui.hit(buttons.revive, x, y));
        if (phase === 'clear') nextPressed = api.ui.hit(buttons.retry, x, y);
        else retryPressed = !revivePressed && api.ui.hit(buttons.retry, x, y);
        homePressed = !revivePressed && api.ui.hit(buttons.home, x, y);
        return;
      }
      if (api.ui.hit(backRect(layout), x, y)) {
        backPressed = true;
        return;
      }
      if (phase !== 'play') return;
      finger = { x: x, y: y, ox: x, oy: y };
    },
    onTouchMove: function (x, y) {
      if (!finger) return;
      finger.x = x;
      finger.y = y;
    },
    onTouchEnd: function (x, y) {
      var layout = api.layout();
      if (phase === 'over' || phase === 'clear') {
        var buttons = endButtons(layout);
        var revive = revivePressed && buttons.revive && api.ui.hit(buttons.revive, x, y);
        var primary = (phase === 'clear' ? nextPressed : retryPressed) && api.ui.hit(buttons.retry, x, y);
        var home = homePressed && api.ui.hit(buttons.home, x, y);
        retryPressed = false;
        nextPressed = false;
        homePressed = false;
        revivePressed = false;
        if (revive) {
          requestRevive();
          return;
        }
        if (primary) {
          if (phase === 'clear') {
            var advance = function () {
              failCount = 0;
              if (level >= MAX_LEVEL) {
                api.getProgress().setLevel(1);
                reset(true, 1);
              } else {
                reset(true, level + 1);
              }
            };
            if (api.showBreakAd) api.showBreakAd(advance);
            else advance();
          } else if (needsAdToRetry()) {
            requestAdRetry();
          } else {
            reset(false, level);
          }
        }
        if (home) {
          failCount = 0;
          api.goHome();
        }
        return;
      }
      var back = backPressed && api.ui.hit(backRect(layout), x, y);
      backPressed = false;
      finger = null;
      if (back) api.goHome();
    },
    onTouchCancel: function () {
      finger = null;
      backPressed = false;
      retryPressed = false;
      homePressed = false;
      nextPressed = false;
      revivePressed = false;
    }
  };
}

module.exports = createPlayScene;

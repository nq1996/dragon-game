var ocean = require('./ocean.js');

var MAX_LEVEL = 1000;
// Course stretch: recipe.length is in "screens"; this multiplies final distance.
var LENGTH_SCALE = 1.58;

function clamp(value, lo, hi) {
  if (value < lo) return lo;
  if (value > hi) return hi;
  return value;
}

function round1(value) {
  return Math.round(value * 10) / 10;
}

// Levels 1-50: hand-authored. 51-1000: generated from modules.
var RECIPES = [
  // 1-10 foundation
  { tip: '滑动画面前进、后退、上浮、下潜', length: 3.2, kelp: 'sparse', squid: { count: 3, interval: 1200, speed: 0.28 } },
  { tip: '躲开乌贼的墨汁', length: 3.6, kelp: 'sparse', squid: { count: 4, interval: 1050, speed: 0.3 } },
  { tip: '躲开乌贼的墨汁', length: 4.0, kelp: 'sparse', squid: { count: 5, interval: 920, speed: 0.32 } },
  { tip: '小心被章鱼攻击', length: 4.4, kelp: 'dense', chase: { warn: 3200, speed: 0.34, catch: 0.72, wait: 2000, frontCool: 5600, frontGap: 0.78, front: true } },
  { tip: '小心被章鱼攻击', length: 5.0, kelp: 'dense', chase: { warn: 2400, speed: 0.46, catch: 0.86, wait: 1500, frontCool: 4800, frontGap: 0.7, front: true } },
  { tip: '小心被章鱼攻击', length: 5.6, kelp: 'sparse', chase: { warn: 1600, speed: 0.58, catch: 0.98, wait: 1100, frontCool: 4000, frontGap: 0.62, front: true } },
  { tip: '躲开乌贼的墨汁', length: 3.4, kelp: 'sparse', squid: { count: 4, interval: 1100, speed: 0.3 } },
  { tip: '小心被章鱼攻击', length: 4.8, kelp: 'dense', chase: { warn: 2600, speed: 0.4, catch: 0.8, wait: 1800, frontCool: 5200, frontGap: 0.74, front: false } },
  { tip: '先躲墨汁，再小心章鱼', length: 5.2, kelp: 'dense', squid: { count: 3, interval: 1000, speed: 0.3 }, chase: { warn: 2200, speed: 0.42, catch: 0.8, wait: 1600, frontCool: 5000, frontGap: 0.72, front: true, delay: 0.45 } },
  { tip: '小心前后夹击', length: 5.8, kelp: 'dense', chase: { warn: 1800, speed: 0.5, catch: 0.9, wait: 1300, frontCool: 4200, frontGap: 0.65, front: true } },

  // 11-20 jelly / crab / sweep intro
  { tip: '靠近水母会受伤', length: 4.0, kelp: 'sparse', jelly: { count: 5, radius: 34 } },
  { tip: '躲开墨汁和水母', length: 4.6, kelp: 'sparse', squid: { count: 3, interval: 1100, speed: 0.3 }, jelly: { count: 4, radius: 32 } },
  { tip: '追击中还有水母', length: 5.2, kelp: 'dense', chase: { warn: 2400, speed: 0.42, catch: 0.82, wait: 1700, frontCool: 5200, frontGap: 0.74, front: true }, jelly: { count: 4, radius: 30 } },
  { tip: '卡住水蛇的开口再通过', length: 4.2, kelp: 'sparse', crab: { count: 3, period: 2400, open: 0.48 } },
  { tip: '墨汁和水蛇一起来了', length: 4.8, kelp: 'sparse', squid: { count: 3, interval: 1050, speed: 0.3 }, crab: { count: 3, period: 2300, open: 0.46 } },
  { tip: '追击时别贴着海底', length: 5.4, kelp: 'dense', chase: { warn: 2200, speed: 0.44, catch: 0.84, wait: 1500, frontCool: 4800, frontGap: 0.7, front: true }, crab: { count: 3, period: 2200, open: 0.44 } },
  { tip: '拉开距离会有前方拦截', length: 5.0, kelp: 'dense', chase: { warn: 2000, speed: 0.48, catch: 0.88, wait: 1400, frontCool: 5600, frontGap: 0.8, front: true } },
  { tip: '躲开脉冲光带', length: 5.0, kelp: 'sparse', sweep: { count: 3, period: 2400, active: 900, thickness: 32, width: 76 } },
  { tip: '水母和水蛇都在挡路', length: 5.0, kelp: 'sparse', jelly: { count: 4, radius: 30 }, crab: { count: 3, period: 2200, open: 0.45 } },
  { tip: '两段挑战：墨汁后是追击', length: 5.6, kelp: 'dense', squid: { count: 3, interval: 1000, speed: 0.31 }, chase: { warn: 2000, speed: 0.45, catch: 0.85, wait: 1500, frontCool: 4800, frontGap: 0.7, front: true, delay: 0.4 } },
  { tip: '综合考验，注意脉冲光带', length: 6.2, kelp: 'dense', chase: { warn: 1800, speed: 0.5, catch: 0.9, wait: 1300, frontCool: 4200, frontGap: 0.66, front: true }, jelly: { count: 2, radius: 28 }, sweep: { count: 2, period: 2400, active: 850, thickness: 32, width: 78 } },

  // 21-30 snake / puffer chapter
  { tip: '更多水蛇闸门', length: 4.6, kelp: 'sparse', crab: { count: 4, period: 2200, open: 0.44 } },
  { tip: '闸门开合更快了', length: 4.8, kelp: 'sparse', crab: { count: 4, period: 1900, open: 0.42 } },
  { tip: '墨汁穿过蛇门', length: 5.0, kelp: 'sparse', squid: { count: 4, interval: 980, speed: 0.32 }, crab: { count: 3, period: 2100, open: 0.43 } },
  { tip: '水母漂在蛇门附近', length: 5.2, kelp: 'sparse', jelly: { count: 4, radius: 30 }, crab: { count: 4, period: 2100, open: 0.42 } },
  { tip: '追击穿过蛇群', length: 5.6, kelp: 'dense', chase: { warn: 2100, speed: 0.46, catch: 0.86, wait: 1400, frontCool: 4600, frontGap: 0.7, front: true }, crab: { count: 4, period: 2000, open: 0.42 } },
  { tip: '先墨汁，再蛇门', length: 5.4, kelp: 'sparse', squid: { count: 3, interval: 1000, speed: 0.31 }, crab: { count: 4, period: 2000, open: 0.41 } },
  { tip: '开口更窄，节奏更快', length: 5.0, kelp: 'sparse', crab: { count: 5, period: 1800, open: 0.4 } },
  { tip: '追击里混着河豚', length: 5.8, kelp: 'dense', chase: { warn: 2000, speed: 0.48, catch: 0.88, wait: 1350, frontCool: 4400, frontGap: 0.68, front: true }, puffer: { count: 4, radius: 28 } },
  { tip: '分段：墨汁后追击', length: 6.0, kelp: 'dense', squid: { count: 3, interval: 960, speed: 0.32 }, chase: { warn: 1900, speed: 0.47, catch: 0.87, wait: 1400, frontCool: 4600, frontGap: 0.69, front: true, delay: 0.38 } },
  { tip: '河豚挡路，鼓起时躲开', length: 5.8, kelp: 'sparse', puffer: { count: 5, radius: 30 } },
  { tip: '蛇门与前后夹击', length: 6.2, kelp: 'dense', chase: { warn: 1800, speed: 0.5, catch: 0.9, wait: 1250, frontCool: 4000, frontGap: 0.64, front: true }, crab: { count: 4, period: 1900, open: 0.4 } },

  // 31-40 sweep chapter + mixes
  { tip: '躲开脉冲光带', length: 4.6, kelp: 'sparse', sweep: { count: 3, period: 2400, active: 900, thickness: 32, width: 76 } },
  { tip: '光带亮起时别硬闯', length: 4.8, kelp: 'sparse', sweep: { count: 4, period: 2200, active: 880, thickness: 34, width: 78 } },
  { tip: '墨汁和光带交替', length: 5.2, kelp: 'sparse', squid: { count: 3, interval: 1000, speed: 0.32 }, sweep: { count: 3, period: 2300, active: 860, thickness: 32, width: 74 } },
  { tip: '水母夹在光带之间', length: 5.4, kelp: 'sparse', jelly: { count: 4, radius: 28 }, sweep: { count: 3, period: 2200, active: 840, thickness: 32, width: 74 } },
  { tip: '追击时注意光带', length: 5.8, kelp: 'dense', chase: { warn: 2000, speed: 0.48, catch: 0.88, wait: 1300, frontCool: 4400, frontGap: 0.68, front: true }, sweep: { count: 3, period: 2100, active: 820, thickness: 30, width: 72 } },
  { tip: '蛇门和光带连环', length: 5.6, kelp: 'sparse', crab: { count: 3, period: 2000, open: 0.41 }, sweep: { count: 3, period: 2100, active: 820, thickness: 30, width: 72 } },
  { tip: '光带亮得更久了', length: 5.2, kelp: 'sparse', sweep: { count: 4, period: 2000, active: 1000, thickness: 34, width: 80 } },
  { tip: '墨汁、水母、光带', length: 5.8, kelp: 'sparse', squid: { count: 3, interval: 980, speed: 0.33 }, jelly: { count: 3, radius: 28 }, sweep: { count: 3, period: 2100, active: 800, thickness: 30, width: 70 } },
  { tip: '追击穿过光带与蛇门', length: 6.2, kelp: 'dense', chase: { warn: 1800, speed: 0.5, catch: 0.9, wait: 1250, frontCool: 4200, frontGap: 0.66, front: true }, crab: { count: 3, period: 1900, open: 0.4 }, sweep: { count: 2, period: 2000, active: 800, thickness: 30, width: 70 } },
  { tip: '河豚后还有追击', length: 6.4, kelp: 'dense', puffer: { count: 4, radius: 28 }, chase: { warn: 1700, speed: 0.5, catch: 0.9, wait: 1300, frontCool: 4200, frontGap: 0.66, front: true, delay: 0.35 } },
  { tip: '分段综合：墨汁后追击', length: 6.4, kelp: 'dense', squid: { count: 4, interval: 940, speed: 0.33 }, chase: { warn: 1700, speed: 0.52, catch: 0.92, wait: 1200, frontCool: 4000, frontGap: 0.64, front: true, delay: 0.36 }, jelly: { count: 2, radius: 26 } },

  // 41-50 finale pressure
  { tip: '高压蛇群', length: 5.4, kelp: 'sparse', crab: { count: 5, period: 1700, open: 0.38 } },
  { tip: '光带密布', length: 5.6, kelp: 'sparse', sweep: { count: 5, period: 1900, active: 920, thickness: 32, width: 76 } },
  { tip: '河豚与蛇门', length: 5.8, kelp: 'sparse', puffer: { count: 5, radius: 28 }, crab: { count: 4, period: 1800, open: 0.39 } },
  { tip: '全程追击，少海带', length: 6.0, kelp: 'sparse', chase: { warn: 1500, speed: 0.54, catch: 0.94, wait: 1100, frontCool: 3800, frontGap: 0.6, front: true } },
  { tip: '墨汁、蛇门、光带', length: 6.2, kelp: 'sparse', squid: { count: 4, interval: 920, speed: 0.34 }, crab: { count: 3, period: 1800, open: 0.39 }, sweep: { count: 3, period: 1900, active: 820, thickness: 30, width: 72 } },
  { tip: '追击 + 水母 + 光带', length: 6.4, kelp: 'dense', chase: { warn: 1600, speed: 0.53, catch: 0.93, wait: 1150, frontCool: 3900, frontGap: 0.62, front: true }, jelly: { count: 4, radius: 26 }, sweep: { count: 3, period: 1900, active: 800, thickness: 30, width: 70 } },
  { tip: '双段：墨汁后高压追击', length: 6.6, kelp: 'dense', squid: { count: 4, interval: 900, speed: 0.34 }, chase: { warn: 1500, speed: 0.55, catch: 0.95, wait: 1100, frontCool: 3700, frontGap: 0.6, front: true, delay: 0.34 }, crab: { count: 3, period: 1750, open: 0.38 } },
  { tip: '几乎没有容错', length: 6.6, kelp: 'sparse', jelly: { count: 5, radius: 26 }, crab: { count: 4, period: 1700, open: 0.37 }, sweep: { count: 3, period: 1800, active: 860, thickness: 32, width: 74 } },
  { tip: '最终夹击', length: 6.8, kelp: 'dense', chase: { warn: 1400, speed: 0.56, catch: 0.96, wait: 1050, frontCool: 3600, frontGap: 0.58, front: true }, crab: { count: 3, period: 1700, open: 0.37 }, sweep: { count: 3, period: 1800, active: 820, thickness: 30, width: 72 } },
  { tip: '终章：全模块综合', length: 7.0, kelp: 'dense', squid: { count: 3, interval: 900, speed: 0.34 }, chase: { warn: 1400, speed: 0.56, catch: 0.96, wait: 1000, frontCool: 3500, frontGap: 0.58, front: true, delay: 0.32 }, jelly: { count: 3, radius: 26 }, crab: { count: 3, period: 1700, open: 0.36 }, sweep: { count: 2, period: 1800, active: 800, thickness: 30, width: 70 } }
];

function generateRecipe(levelNo) {
  var t = clamp((levelNo - 51) / (MAX_LEVEL - 51), 0, 1);
  var chapter = Math.floor((levelNo - 1) / 50);
  var slot = (levelNo - 1) % 20;
  var length = round1(5.6 + t * 4.2 + (chapter % 3) * 0.25);
  var kelp = t > 0.55 && slot % 4 === 0 ? 'sparse' : (slot % 3 === 0 ? 'dense' : 'sparse');
  var recipe = { tip: '继续闯关，游到鱼窝', length: length, kelp: kelp };
  var patterns = [
    ['squid'],
    ['chase'],
    ['jelly'],
    ['crab'],
    ['sweep'],
    ['puffer'],
    ['squid', 'puffer'],
    ['squid', 'jelly'],
    ['chase', 'jelly'],
    ['puffer', 'chase'],
    ['jelly', 'crab'],
    ['puffer', 'jelly'],
    ['sweep', 'puffer'],
    ['chase', 'sweep'],
    ['squid', 'chase'],
    ['crab', 'sweep'],
    ['chase', 'puffer'],
    ['jelly', 'crab', 'sweep'],
    ['puffer', 'crab'],
    ['chase', 'jelly', 'crab']
  ];
  var mods = patterns[(slot + chapter) % patterns.length];
  var i;
  for (i = 0; i < mods.length; i++) {
    var m = mods[i];
    if (m === 'squid') {
      recipe.squid = {
        count: clamp(4 + Math.floor(t * 4), 4, 8),
        interval: Math.round(1000 - t * 300),
        speed: round1(0.32 + t * 0.1)
      };
    } else if (m === 'chase') {
      recipe.chase = {
        warn: Math.round(2200 - t * 900),
        speed: round1(0.44 + t * 0.22),
        catch: round1(0.84 + t * 0.16),
        wait: Math.round(1500 - t * 500),
        frontCool: Math.round(4600 - t * 1400),
        frontGap: round1(0.7 - t * 0.14),
        front: true,
        delay: mods.indexOf('squid') >= 0 || mods.indexOf('puffer') >= 0 ? 0.38 : 0
      };
      recipe.tip = recipe.chase.delay ? '先躲障碍，再小心追击' : '小心被章鱼攻击';
    } else if (m === 'jelly') {
      recipe.jelly = {
        count: clamp(4 + Math.floor(t * 5), 4, 9),
        radius: Math.round(34 - t * 5)
      };
      if (!recipe.chase) recipe.tip = '躲开水母';
    } else if (m === 'crab') {
      recipe.crab = {
        count: clamp(4 + Math.floor(t * 4), 4, 8),
        period: Math.round(2100 - t * 600),
        open: round1(0.42 - t * 0.1)
      };
      if (!recipe.chase) recipe.tip = '卡住水蛇开口再通过';
    } else if (m === 'sweep') {
      recipe.sweep = {
        count: clamp(3 + Math.floor(t * 4), 3, 7),
        period: Math.round(2200 - t * 500),
        active: Math.round(900 + t * 140),
        thickness: 34,
        width: 78
      };
      if (!recipe.chase) recipe.tip = '注意脉冲光带';
    } else if (m === 'puffer') {
      recipe.puffer = {
        count: clamp(4 + Math.floor(t * 4), 4, 8),
        radius: Math.round(32 - t * 3)
      };
      if (!recipe.chase) recipe.tip = '躲开鼓起的河豚';
    }
  }
  return recipe;
}

function recipeFor(levelNo) {
  var idx = levelNo - 1;
  if (idx < 0) idx = 0;
  if (idx < RECIPES.length) return RECIPES[idx];
  if (levelNo > MAX_LEVEL) levelNo = MAX_LEVEL;
  return generateRecipe(levelNo);
}

function makeNest(layout, wx) {
  var floorY = ocean.seabedY(layout);
  var top = layout.safeTop + layout.px(40);
  return {
    wx: wx,
    cy: (top + floorY) * 0.5,
    rx: layout.px(46),
    ry: layout.px(38)
  };
}

function nextShotGap(base) {
  var lo = base * 0.55;
  var hi = base * 1.55;
  return lo + Math.random() * (hi - lo);
}

function densifyCount(baseCount, screens, spacingScreens, maxCount) {
  var span = Math.max(0.8, screens - 1.4);
  var needed = Math.ceil(span / spacingScreens);
  var count = Math.max(baseCount || 1, needed);
  if (maxCount && count > maxCount) count = maxCount;
  return count;
}

function buildLevel(layout, levelNo, fishSize) {
  var recipe = recipeFor(levelNo);
  var screens = recipe.length * LENGTH_SCALE;
  var endX = layout.w * screens;
  var floorY = ocean.seabedY(layout);
  var top = layout.safeTop + fishSize * 0.4;
  var bottom = floorY - fishSize * 0.35;
  var mid = (top + bottom) / 2;
  var kelpDense = recipe.kelp === 'dense';
  var kelp = recipe.kelp === 'none' ? [] : ocean.buildKelpPatches(layout, endX, kelpDense);
  var squids = [];
  var octopuses = [];
  var jellies = [];
  var crabs = [];
  var sweeps = [];
  var shotMs = 980;
  var inkSpeed = 0.3;
  var chase = null;
  var i;

  if (recipe.squid) {
    shotMs = recipe.squid.interval;
    inkSpeed = recipe.squid.speed;
    var squidCount = densifyCount(recipe.squid.count, screens, 1.05, 10);
    var squidFirst = layout.w * 0.68;
    var squidLast = endX - layout.w * 0.55;
    var squidGap = squidCount <= 1 ? 0 : (squidLast - squidFirst) / (squidCount - 1);
    for (i = 0; i < squidCount; i++) {
      squids.push({
        wx: squidFirst + i * squidGap,
        shotT: 0,
        nextShot: (i * shotMs) / Math.max(1, squidCount) + nextShotGap(shotMs) * 0.3,
        puff: 0
      });
    }
  }

  if (recipe.chase) {
    chase = {
      warnMs: Math.max(1100, Math.round(recipe.chase.warn * 0.92)),
      octSpeed: layout.w * (recipe.chase.speed + 0.04),
      catchR: fishSize * Math.min(1.05, recipe.chase.catch + 0.04),
      hideWaitMs: Math.max(900, Math.round(recipe.chase.wait * 0.92)),
      frontCoolMs: Math.max(2800, Math.round(recipe.chase.frontCool * 0.9)),
      frontGap: layout.w * Math.max(0.52, recipe.chase.frontGap - 0.04),
      front: !!recipe.chase.front,
      delay: recipe.chase.delay || 0
    };
    octopuses.push({
      side: 'rear',
      wx: layout.w * 0.08,
      sy: layout.h * 0.5,
      state: 'warn',
      lastX: layout.w * 0.28,
      lastY: layout.h * 0.46,
      waitT: 0,
      unlockAt: chase.delay > 0 ? endX * chase.delay : 0
    });
  }

  if (recipe.jelly) {
    var jellyCount = densifyCount(recipe.jelly.count, screens, 0.9, 12);
    var jellyFirst = layout.w * 1.05;
    var jellyLast = endX - layout.w * 0.5;
    var jellyGap = jellyCount <= 1 ? 0 : (jellyLast - jellyFirst) / (jellyCount - 1);
    for (i = 0; i < jellyCount; i++) {
      var band = i % 3;
      var jy = band === 0 ? mid - layout.px(70) : band === 1 ? mid : mid + layout.px(60);
      if (jy < top + layout.px(20)) jy = top + layout.px(20);
      if (jy > bottom - layout.px(20)) jy = bottom - layout.px(20);
      jellies.push({
        wx: jellyFirst + i * jellyGap,
        sy: jy,
        r: layout.px(recipe.jelly.radius),
        phase: i * 0.9
      });
    }
  }

  if (recipe.crab) {
    var crabCount = densifyCount(recipe.crab.count, screens, 1.05, 10);
    var crabOpen = Math.max(0.32, (recipe.crab.open || 0.44) - 0.03);
    var crabPeriod = Math.max(1400, Math.round((recipe.crab.period || 2200) * 0.92));
    var crabFirst = layout.w * 1.05;
    var crabLast = endX - layout.w * 0.5;
    var crabGap = crabCount <= 1 ? 0 : (crabLast - crabFirst) / (crabCount - 1);
    for (i = 0; i < crabCount; i++) {
      crabs.push({
        wx: crabFirst + i * crabGap,
        period: crabPeriod,
        open: crabOpen,
        phase: i * 0.37,
        gateH: bottom - top
      });
    }
  }

  if (recipe.sweep) {
    var sweepCount = densifyCount(recipe.sweep.count, screens, 1.0, 10);
    var sweepFirst = layout.w * 1.05;
    var sweepLast = endX - layout.w * 0.5;
    var sweepGap = sweepCount <= 1 ? 0 : (sweepLast - sweepFirst) / (sweepCount - 1);
    for (i = 0; i < sweepCount; i++) {
      sweeps.push({
        wx: sweepFirst + i * sweepGap,
        y: top + (bottom - top) * (0.25 + (i % 3) * 0.2),
        h: layout.px((recipe.sweep.thickness || 34) + 2),
        period: Math.max(1600, Math.round((recipe.sweep.period || 2600) * 0.9)),
        active: Math.round((recipe.sweep.active || 900) * 1.08),
        phase: i * 0.5,
        w: layout.px((recipe.sweep.width || 70) + 4)
      });
    }
  }

  var puffers = [];
  if (recipe.puffer) {
    var pufferCount = densifyCount(recipe.puffer.count, screens, 0.95, 10);
    var pufferFirst = layout.w * 1.05;
    var pufferLast = endX - layout.w * 0.5;
    var pufferGap = pufferCount <= 1 ? 0 : (pufferLast - pufferFirst) / (pufferCount - 1);
    for (i = 0; i < pufferCount; i++) {
      var pband = i % 3;
      var py = pband === 0 ? mid - layout.px(55) : pband === 1 ? mid + layout.px(20) : mid - layout.px(10);
      if (py < top + layout.px(24)) py = top + layout.px(24);
      if (py > bottom - layout.px(24)) py = bottom - layout.px(24);
      puffers.push({
        wx: pufferFirst + i * pufferGap,
        sy: py,
        r: layout.px((recipe.puffer.radius || 30) + 2),
        phase: i * 0.8
      });
    }
  }

  return {
    tip: recipe.tip,
    goalX: endX,
    nest: makeNest(layout, endX),
    kelp: kelp,
    squids: squids,
    octopuses: octopuses,
    jellies: jellies,
    crabs: crabs,
    sweeps: sweeps,
    puffers: puffers,
    shotMs: shotMs,
    inkSpeed: inkSpeed,
    chase: chase,
    hasSquid: squids.length > 0,
    hasChase: !!chase,
    hasJelly: jellies.length > 0,
    hasCrab: crabs.length > 0,
    hasSweep: sweeps.length > 0,
    hasPuffer: puffers.length > 0
  };
}

module.exports = {
  MAX_LEVEL: MAX_LEVEL,
  buildLevel: buildLevel,
  recipeFor: recipeFor
};

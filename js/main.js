var createPlatform = require('./platform.js').createPlatform;
var createRegistry = require('./registry.js').createRegistry;
var createLoader = require('./loader.js').createLoader;
var createProgress = require('./progress.js').createProgress;
var createHomeScene = require('./scenes/home.js').createHomeScene;
var paintBackground = require('./background.js').paintBackground;
var createLayout = require('./layout.js').createLayout;
var draw = require('./draw.js');
var ui = require('./ui.js');
var createSidebar = require('./sidebar.js').createSidebar;
var createAds = require('./ads.js').createAds;
var adUnits = require('./adUnits.js');
var createCustomerService = require('./customerService.js').createCustomerService;
var createSensitiveInput = require('./sensitiveInput.js').createSensitiveInput;
var createAudio = require('./audio.js').createAudio;

var ttApi = (typeof tt !== 'undefined') ? tt : null;
if (!ttApi) {
  throw new Error('tt api missing');
}

var platform = createPlatform(ttApi);
var registry = createRegistry();
var loader = createLoader(ttApi);
var progress = createProgress(platform.storage);
var sidebar = createSidebar(ttApi);
var ads = createAds(ttApi, adUnits);
var customerService = createCustomerService(ttApi);
var sensitiveInput = createSensitiveInput(ttApi);
var audio = createAudio(ttApi, platform.storage);
var state = { loadingPlay: false };
var playScene = null;
var current = null;

var api = {
  layout: function () {
    var screen = platform.getScreen();
    screen.bannerHeight = ads.getBannerHeight();
    return createLayout(screen);
  },
  paintBackground: paintBackground,
  font: draw.font,
  ui: ui,
  getProgress: function () {
    return progress;
  },
  getSidebar: function () {
    return sidebar;
  },
  getRewardedAd: function () {
    return ads;
  },
  getAds: function () {
    return ads;
  },
  watchAdForShield: function () {
    ads.show(function () {
      progress.addShields(1);
      platform.toast('护盾 +1');
    }, function (msg) {
      platform.toast(msg || '广告未完成');
    }, '需看完广告才能获得护盾');
  },
  showBreakAd: function (done) {
    var paused = false;
    ads.showInterstitial(function () {
      if (paused) audio.playMusic(true);
      if (done) done();
    }, function () {
      paused = true;
      audio.pauseMusic();
    });
  },
  getCustomerService: function () {
    return customerService;
  },
  getSensitiveInput: function () {
    return sensitiveInput;
  },
  getAudio: function () {
    return audio;
  },
  toast: function (title) {
    platform.toast(title);
  },
  getMenuButton: function () {
    return platform.getMenuButton();
  },
  isLoadingPlay: function () {
    return state.loadingPlay;
  },
  startGame: function (level) {
    var next = parseInt(level, 10);
    if (next >= 1) progress.setLevel(next);
    ads.hideBanner();
    audio.unlock();
    audio.playSfx('start');
    audio.vibrate('short');
    beginPlay();
  },
  goHome: function () {
    switchTo(home);
    ads.hideBanner();
    api.showBreakAd(function () {
      ads.showBanner();
    });
  }
};

var home = createHomeScene(api);

function switchTo(scene, params) {
  current = scene;
  if (scene.enter) scene.enter(params || {});
}

function beginPlay() {
  if (state.loadingPlay) return;
  if (playScene) {
    switchTo(playScene, { level: progress.getLevel() });
    return;
  }
  state.loadingPlay = true;
  loader.loadPlay(function () {
    state.loadingPlay = false;
    var factory = registry.getScene('play');
    if (!factory) {
      ads.showBanner();
      home.showTip('加载失败，请重试');
      return;
    }
    playScene = factory(api);
    switchTo(playScene, { level: progress.getLevel() });
  }, function (err) {
    state.loadingPlay = false;
    console.error('分包加载失败', err);
    ads.showBanner();
    home.showTip('加载失败，请重试');
  });
}

platform.listenTouch(function () {
  return current;
});

switchTo(home);
ads.showBanner();

var last = 0;
function frame(now) {
  if (!last) last = now;
  var dt = now - last;
  last = now;
  if (dt > 48) dt = 48;
  if (current && current.update) current.update(dt, now);
  if (current && current.render) current.render(platform.ctx, now);
  platform.nextFrame(frame);
}

platform.nextFrame(frame);

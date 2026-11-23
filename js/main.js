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
var createRewardedAd = require('./rewardedAd.js').createRewardedAd;
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
var rewardedAd = createRewardedAd(ttApi, { adUnitId: '' });
var customerService = createCustomerService(ttApi);
var sensitiveInput = createSensitiveInput(ttApi);
var audio = createAudio(ttApi, platform.storage);
var state = { loadingPlay: false };
var playScene = null;
var current = null;

var api = {
  layout: function () {
    return createLayout(platform.getScreen());
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
    return rewardedAd;
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
    audio.unlock();
    audio.playSfx('start');
    audio.vibrate('short');
    beginPlay();
  },
  goHome: function () {
    audio.playMusic(true);
    switchTo(home);
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
      home.showTip('加载失败，请重试');
      return;
    }
    playScene = factory(api);
    switchTo(playScene, { level: progress.getLevel() });
  }, function (err) {
    state.loadingPlay = false;
    console.error('分包加载失败', err);
    home.showTip('加载失败，请重试');
  });
}

platform.listenTouch(function () {
  return current;
});

switchTo(home);

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

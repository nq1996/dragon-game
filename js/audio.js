var SETTINGS_KEY = 'audioSettings';

function defaultSettings() {
  return { music: true, sound: true, vibrate: true };
}

function createAudio(ttApi, storage) {
  var settings = defaultSettings();
  var bgm = null;
  var sfx = {};
  var unlocked = false;
  var ready = false;

  function loadSettings() {
    try {
      var raw = storage.get(SETTINGS_KEY);
      if (!raw) return;
      var parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!parsed || typeof parsed !== 'object') return;
      settings.music = parsed.music !== false;
      settings.sound = parsed.sound !== false;
      settings.vibrate = parsed.vibrate !== false;
    } catch (err) {}
  }

  function saveSettings() {
    try {
      storage.set(SETTINGS_KEY, JSON.stringify(settings));
    } catch (err) {}
  }

  function makeAudio(src, loop) {
    if (!ttApi || !ttApi.createInnerAudioContext) return null;
    var ctx = ttApi.createInnerAudioContext();
    ctx.src = src;
    ctx.loop = !!loop;
    ctx.obeyMuteSwitch = false;
    ctx.volume = loop ? 0.45 : 0.85;
    if (ctx.onError) {
      ctx.onError(function (err) {
        console.warn('audio error', src, err);
      });
    }
    return ctx;
  }

  function init() {
    if (ready) return;
    loadSettings();
    bgm = makeAudio('audio/bgm.wav', true);
    sfx.click = makeAudio('audio/click.wav', false);
    sfx.hit = makeAudio('audio/hit.wav', false);
    sfx.clear = makeAudio('audio/clear.wav', false);
    sfx.start = makeAudio('audio/start.wav', false);
    ready = true;
    if (ttApi && ttApi.onShow) {
      ttApi.onShow(function () {
        if (settings.music) playMusic(true);
      });
    }
    if (ttApi && ttApi.onHide) {
      ttApi.onHide(function () {
        pauseMusic();
      });
    }
  }

  function unlock() {
    unlocked = true;
    if (settings.music) playMusic(true);
  }

  function playMusic(force) {
    if (!ready) init();
    if (!bgm) return;
    if (!settings.music) {
      try {
        bgm.pause();
      } catch (err) {}
      return;
    }
    if (!unlocked && !force) return;
    try {
      bgm.play();
    } catch (err) {}
  }

  function pauseMusic() {
    if (!bgm) return;
    try {
      bgm.pause();
    } catch (err) {}
  }

  function stopMusic() {
    if (!bgm) return;
    try {
      bgm.stop();
    } catch (err) {}
  }

  function playSfx(name) {
    if (!ready) init();
    if (!settings.sound) return;
    var clip = sfx[name];
    if (!clip) return;
    try {
      if (typeof clip.stop === 'function') clip.stop();
      if (typeof clip.seek === 'function') clip.seek(0);
      clip.play();
    } catch (err) {}
  }

  function vibrate(kind) {
    if (!settings.vibrate || !ttApi) return;
    try {
      if (kind === 'long' && ttApi.vibrateLong) {
        ttApi.vibrateLong({ fail: function () {} });
      } else if (ttApi.vibrateShort) {
        ttApi.vibrateShort({ fail: function () {} });
      }
    } catch (err) {}
  }

  function getSettings() {
    return {
      music: !!settings.music,
      sound: !!settings.sound,
      vibrate: !!settings.vibrate
    };
  }

  function setFlag(key, value) {
    if (key !== 'music' && key !== 'sound' && key !== 'vibrate') return getSettings();
    settings[key] = !!value;
    saveSettings();
    if (key === 'music') {
      if (settings.music) {
        unlocked = true;
        playMusic(true);
      } else {
        pauseMusic();
      }
    }
    if (key === 'sound' && settings.sound) playSfx('click');
    if (key === 'vibrate' && settings.vibrate) vibrate('short');
    return getSettings();
  }

  function toggle(key) {
    var cur = getSettings();
    return setFlag(key, !cur[key]);
  }

  init();

  return {
    init: init,
    unlock: unlock,
    playMusic: playMusic,
    pauseMusic: pauseMusic,
    stopMusic: stopMusic,
    playSfx: playSfx,
    vibrate: vibrate,
    getSettings: getSettings,
    setFlag: setFlag,
    toggle: toggle
  };
}

module.exports = {
  createAudio: createAudio
};

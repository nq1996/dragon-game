function createPlatform(ttApi) {
  var canvas = ttApi.createCanvas();
  var ctx = canvas.getContext('2d');
  var screen = {
    width: 0,
    height: 0,
    pixelRatio: 1,
    safeTop: 0,
    safeBottom: 0
  };
  var menu = null;

  function readScreen() {
    var info = ttApi.getSystemInfoSync();
    screen.width = info.windowWidth;
    screen.height = info.windowHeight;
    screen.pixelRatio = info.pixelRatio || 1;
    screen.safeTop = (info.safeArea && info.safeArea.top) || info.statusBarHeight || 0;
    var bottom = 0;
    if (info.safeArea && typeof info.safeArea.bottom === 'number') {
      bottom = info.windowHeight - info.safeArea.bottom;
      if (bottom < 0) bottom = 0;
    }
    screen.safeBottom = bottom;
    menu = readMenu(info);
  }

  function readMenu(info) {
    var fallback = {
      left: screen.width - 100,
      top: screen.safeTop,
      right: screen.width - 8,
      bottom: screen.safeTop + 32,
      width: 92,
      height: 32
    };
    if (!ttApi.getMenuButtonBoundingClientRect) return fallback;
    try {
      var rect = ttApi.getMenuButtonBoundingClientRect();
      if (!rect || !rect.width) return fallback;
      return rect;
    } catch (err) {
      return fallback;
    }
  }

  function applyCanvas() {
    canvas.width = Math.round(screen.width * screen.pixelRatio);
    canvas.height = Math.round(screen.height * screen.pixelRatio);
    ctx.setTransform(screen.pixelRatio, 0, 0, screen.pixelRatio, 0, 0);
  }

  function resize() {
    readScreen();
    applyCanvas();
  }

  resize();

  if (ttApi.onWindowResize) {
    ttApi.onWindowResize(function () {
      resize();
    });
  }

  function nextFrame(callback) {
    if (canvas.requestAnimationFrame) return canvas.requestAnimationFrame(callback);
    if (typeof requestAnimationFrame === 'function') return requestAnimationFrame(callback);
    return setTimeout(function () {
      callback(Date.now());
    }, 16);
  }

  function listenTouch(getScene) {
    function pointOf(list) {
      if (!list || !list.length) return null;
      var touch = list[0];
      var x = (typeof touch.clientX === 'number') ? touch.clientX : touch.x;
      var y = (typeof touch.clientY === 'number') ? touch.clientY : touch.y;
      if (typeof x !== 'number' || typeof y !== 'number') return null;
      return { x: x, y: y };
    }

    function emit(name, list) {
      var scene = getScene();
      if (!scene || !scene[name]) return;
      var point = pointOf(list);
      if (!point) return;
      scene[name](point.x, point.y);
    }

    ttApi.onTouchStart(function (event) {
      emit('onTouchStart', event.touches);
    });
    ttApi.onTouchMove(function (event) {
      emit('onTouchMove', event.touches);
    });
    ttApi.onTouchEnd(function (event) {
      emit('onTouchEnd', event.changedTouches || event.touches);
    });
    if (ttApi.onTouchCancel) {
      ttApi.onTouchCancel(function () {
        var scene = getScene();
        if (scene && scene.onTouchCancel) scene.onTouchCancel();
      });
    }
  }

  return {
    ctx: ctx,
    canvas: canvas,
    getScreen: function () {
      return screen;
    },
    getMenuButton: function () {
      return menu;
    },
    resize: resize,
    nextFrame: nextFrame,
    listenTouch: listenTouch,
    storage: {
      get: function (key) {
        try {
          if (!ttApi.getStorageSync) return '';
          var value = ttApi.getStorageSync(key);
          if (value === undefined || value === null) return '';
          return value;
        } catch (err) {
          return '';
        }
      },
      set: function (key, value) {
        try {
          if (ttApi.setStorageSync) ttApi.setStorageSync(key, value);
        } catch (err) {
          console.warn('storage set fail', err);
        }
      }
    },
    toast: function (title) {
      if (!ttApi.showToast) return;
      ttApi.showToast({ title: title, icon: 'none' });
    }
  };
}

module.exports = {
  createPlatform: createPlatform
};

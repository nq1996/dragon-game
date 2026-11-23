var latestShow = null;
var fromSidebar = false;
var supportChecked = false;
var supportExist = false;
var bound = false;

function isSidebarLaunch(res) {
  return !!(res && res.launch_from === 'homepage' && res.location === 'sidebar_card');
}

function applyShow(res) {
  latestShow = res || null;
  if (isSidebarLaunch(res)) fromSidebar = true;
}

function bindEarly(ttApi) {
  if (bound || !ttApi || !ttApi.onShow) return;
  bound = true;
  try {
    if (ttApi.getLaunchOptionsSync) applyShow(ttApi.getLaunchOptionsSync());
  } catch (err) {}
  ttApi.onShow(function (res) {
    applyShow(res);
  });
}

function checkSupport(ttApi, done) {
  if (!ttApi || !ttApi.checkScene) {
    supportChecked = true;
    supportExist = false;
    if (done) done(false);
    return;
  }
  ttApi.checkScene({
    scene: 'sidebar',
    success: function (res) {
      supportChecked = true;
      supportExist = !!(res && res.isExist);
      if (done) done(supportExist);
    },
    fail: function () {
      supportChecked = true;
      supportExist = false;
      if (done) done(false);
    }
  });
}

function navigate(ttApi, onOk, onFail) {
  if (!ttApi || !ttApi.navigateToScene) {
    if (onFail) onFail('当前环境不支持侧边栏');
    return;
  }
  ttApi.navigateToScene({
    scene: 'sidebar',
    success: function () {
      if (onOk) onOk();
    },
    fail: function (err) {
      if (onFail) onFail((err && err.errMsg) || '跳转侧边栏失败');
    }
  });
}

function createSidebar(ttApi) {
  bindEarly(ttApi);
  checkSupport(ttApi);

  return {
    refreshSupport: function (done) {
      checkSupport(ttApi, done);
    },
    isSupported: function () {
      return supportExist;
    },
    isReady: function () {
      return supportChecked;
    },
    isFromSidebar: function () {
      return fromSidebar || isSidebarLaunch(latestShow);
    },
    getLatestShow: function () {
      return latestShow;
    },
    markConsumed: function () {
      // Keep fromSidebar true for the session so user can open panel again after claim.
    },
    goSidebar: function (onOk, onFail) {
      navigate(ttApi, onOk, onFail);
    }
  };
}

module.exports = {
  bindEarly: bindEarly,
  createSidebar: createSidebar
};

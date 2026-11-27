var LAUNCH_GAP = 30000;
var INTERSTITIAL_GAP = 60000;
var REWARDED_GAP = 60000;

function createAds(ttApi, units) {
  var bannerId = (units && units.banner) || '';
  var interstitialId = (units && units.interstitial) || '';
  var rewardedId = (units && units.rewarded) || '';

  var banner = null;
  var bannerHeight = 0;
  var bannerVisible = false;
  var bannerFailed = false;

  var interstitial = null;
  var interstitialReady = false;
  var interstitialShowing = false;
  var interstitialShown = false;
  var interstitialCloseHook = null;
  var interstitialRetryTimer = null;

  var rewarded = null;
  var rewardedBusy = false;
  var rewardedShown = false;
  var pendingReward = null;

  var launchedAt = Date.now();
  var lastInterstitialAt = 0;
  var lastRewardedAt = 0;

  function systemSize() {
    try {
      var info = ttApi.getSystemInfoSync();
      return {
        w: info.windowWidth || 375,
        h: info.windowHeight || 667
      };
    } catch (err) {
      return { w: 375, h: 667 };
    }
  }

  function bannerWidth(screen) {
    var width = Math.min(screen.w, 360);
    if (width < 300 && screen.w >= 300) width = 300;
    if (width > screen.w) width = screen.w;
    return Math.round(width);
  }

  function estimatedBannerHeight(screen) {
    return Math.round(bannerWidth(screen) / 16 * 9);
  }

  function placeBanner(size) {
    if (!banner || !banner.style) return;
    var screen = systemSize();
    var width = (size && size.width) || banner.style.width || bannerWidth(screen);
    var height = (size && size.height) || bannerHeight || 0;
    if (size && size.height) bannerHeight = size.height;
    var left = Math.max(0, (screen.w - width) / 2);
    var top = screen.h - (height > 0 ? height : estimatedBannerHeight(screen));
    if (Math.abs((banner.style.left || 0) - left) > 0.5) banner.style.left = left;
    if (Math.abs((banner.style.top || 0) - top) > 0.5) banner.style.top = top;
  }

  function ensureBanner() {
    if (banner || !ttApi || !ttApi.createBannerAd || !bannerId) return banner;
    var screen = systemSize();
    var width = bannerWidth(screen);
    try {
      banner = ttApi.createBannerAd({
        adUnitId: bannerId,
        style: {
          left: Math.max(0, (screen.w - width) / 2),
          top: screen.h - estimatedBannerHeight(screen),
          width: width
        }
      });
    } catch (err) {
      banner = null;
      return null;
    }
    banner.onResize(function (size) {
      placeBanner(size);
    });
    banner.onError(function (err) {
      console.warn('banner ad error', err && (err.errMsg || err.errorCode || err.errCode));
      bannerFailed = true;
      bannerHeight = 0;
    });
    banner.onLoad(function () {
      if (!bannerVisible || !banner) return;
      banner.show().catch(function () {});
    });
    return banner;
  }

  function destroyBanner() {
    if (!banner) return;
    try {
      if (banner.hide) banner.hide();
      if (banner.destroy) banner.destroy();
    } catch (err) {}
    banner = null;
    bannerHeight = 0;
  }

  function showBanner() {
    bannerVisible = true;
    bannerFailed = false;
    if (!bannerId) return;
    var ad = ensureBanner();
    if (!ad) return;
    placeBanner();
    ad.show().catch(function () {});
  }

  function hideBanner() {
    bannerVisible = false;
    destroyBanner();
  }

  function finishInterstitial() {
    interstitialShowing = false;
    interstitialShown = false;
    var hook = interstitialCloseHook;
    interstitialCloseHook = null;
    if (hook) hook();
  }

  function scheduleInterstitialLoad() {
    if (interstitialRetryTimer) return;
    interstitialRetryTimer = setTimeout(function () {
      interstitialRetryTimer = null;
      if (!interstitial || !interstitial.load || interstitialShowing) return;
      interstitial.load().catch(function () {});
    }, 30000);
  }

  function ensureInterstitial() {
    if (interstitial || !ttApi || !ttApi.createInterstitialAd || !interstitialId) return interstitial;
    try {
      interstitial = ttApi.createInterstitialAd({ adUnitId: interstitialId });
    } catch (err) {
      interstitial = null;
      return null;
    }
    interstitial.onLoad(function () {
      interstitialReady = true;
    });
    interstitial.onError(function (err) {
      interstitialReady = false;
      console.warn('interstitial ad error', err && (err.errMsg || err.errCode));
      if (interstitialShowing && !interstitialShown) finishInterstitial();
      scheduleInterstitialLoad();
    });
    interstitial.onClose(function () {
      interstitialReady = false;
      lastInterstitialAt = Date.now();
      finishInterstitial();
      if (interstitial && interstitial.load) interstitial.load().catch(function () {});
    });
    if (interstitial.load) interstitial.load().catch(function () {});
    return interstitial;
  }

  function canShowInterstitial() {
    var now = Date.now();
    if (!interstitialId) return false;
    if (interstitialShowing) return false;
    if (now - launchedAt < LAUNCH_GAP) return false;
    if (lastInterstitialAt && now - lastInterstitialAt < INTERSTITIAL_GAP) return false;
    if (lastRewardedAt && now - lastRewardedAt < REWARDED_GAP) return false;
    return true;
  }

  function showInterstitial(onDone, onShown) {
    if (!canShowInterstitial()) {
      if (onDone) onDone();
      return;
    }
    var ad = ensureInterstitial();
    if (!ad) {
      if (onDone) onDone();
      return;
    }
    interstitialShowing = true;
    interstitialShown = false;
    interstitialCloseHook = onDone || null;

    function reveal() {
      ad.show().then(function () {
        interstitialShown = true;
        lastInterstitialAt = Date.now();
        if (onShown) onShown();
      }).catch(function () {
        if (!interstitialShown) finishInterstitial();
      });
    }

    if (interstitialReady) {
      reveal();
      return;
    }
    if (!ad.load) {
      finishInterstitial();
      return;
    }
    ad.load().then(function () {
      interstitialReady = true;
      reveal();
    }).catch(function () {
      if (!interstitialShown) finishInterstitial();
    });
  }

  function settleReward(ok, msg) {
    var job = pendingReward;
    pendingReward = null;
    rewardedBusy = false;
    if (!job) return;
    if (ok) {
      if (job.onSuccess) job.onSuccess();
    } else if (job.onFail) {
      job.onFail(msg || job.incomplete || '广告未完成');
    }
  }

  function ensureRewarded() {
    if (rewarded || !ttApi || !ttApi.createRewardedVideoAd || !rewardedId) return rewarded;
    try {
      rewarded = ttApi.createRewardedVideoAd({ adUnitId: rewardedId });
    } catch (err) {
      rewarded = null;
      return null;
    }
    rewarded.onClose(function (res) {
      rewardedShown = false;
      if (res && res.isEnded) settleReward(true);
      else settleReward(false);
    });
    rewarded.onError(function (err) {
      console.warn('rewarded ad error', err && (err.errMsg || err.errCode));
      if (pendingReward && !rewardedShown) settleReward(false, '广告播放失败');
    });
    if (rewarded.load) rewarded.load().catch(function () {});
    return rewarded;
  }

  function showRewarded(onSuccess, onFail, incompleteMsg) {
    if (!rewardedId) {
      if (onFail) onFail('广告暂未开通');
      return;
    }
    if (rewardedBusy) {
      if (onFail) onFail('广告播放中');
      return;
    }
    var video = ensureRewarded();
    if (!video) {
      if (onFail) onFail('广告加载失败');
      return;
    }
    rewardedBusy = true;
    rewardedShown = false;
    pendingReward = {
      onSuccess: onSuccess,
      onFail: onFail,
      incomplete: incompleteMsg || '需看完广告才能获得奖励'
    };
    video.show().then(function () {
      rewardedShown = true;
      lastRewardedAt = Date.now();
    }).catch(function () {
      return video.load().then(function () {
        return video.show().then(function () {
          rewardedShown = true;
          lastRewardedAt = Date.now();
        });
      });
    }).catch(function () {
      settleReward(false, '广告加载失败');
    });
  }

  ensureInterstitial();
  ensureRewarded();

  return {
    getBannerHeight: function () {
      if (!bannerVisible || !bannerId || bannerFailed) return 0;
      if (bannerHeight > 0) return bannerHeight;
      return estimatedBannerHeight(systemSize());
    },
    showBanner: showBanner,
    hideBanner: hideBanner,
    showInterstitial: showInterstitial,
    isConfigured: function () {
      return !!rewardedId;
    },
    show: showRewarded
  };
}

module.exports = {
  createAds: createAds
};

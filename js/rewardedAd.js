// Placeholder for Douyin rewarded video. Fill in adUnitId later.
function createRewardedAd(ttApi, options) {
  var adUnitId = (options && options.adUnitId) || '';
  var ad = null;

  function ensureAd() {
    if (ad || !ttApi || !ttApi.createRewardedVideoAd || !adUnitId) return ad;
    try {
      ad = ttApi.createRewardedVideoAd({ adUnitId: adUnitId });
    } catch (err) {
      ad = null;
    }
    return ad;
  }

  return {
    isConfigured: function () {
      return !!adUnitId;
    },
    show: function (onSuccess, onFail) {
      if (!adUnitId) {
        if (onFail) onFail('广告暂未开通');
        return;
      }
      var video = ensureAd();
      if (!video) {
        if (onFail) onFail('广告加载失败');
        return;
      }
      var settled = false;
      function finish(ok, msg) {
        if (settled) return;
        settled = true;
        if (ok) {
          if (onSuccess) onSuccess();
        } else if (onFail) {
          onFail(msg || '广告未完成');
        }
      }
      if (video.offClose) video.offClose();
      if (video.offError) video.offError();
      video.onClose(function (res) {
        if (res && res.isEnded) finish(true);
        else finish(false, '需看完广告才能复活');
      });
      video.onError(function () {
        finish(false, '广告播放失败');
      });
      video
        .show()
        .catch(function () {
          return video.load().then(function () {
            return video.show();
          });
        })
        .catch(function () {
          finish(false, '广告加载失败');
        });
    }
  };
}

module.exports = {
  createRewardedAd: createRewardedAd
};

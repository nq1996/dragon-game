// Douyin customer service.
// type 3 = 抖音客服平台 (base lib >= 3.41.0)
// type 2 = 抖音 IM 客服
// Docs: https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/operation1/user-ops/user-service/bytehi-im

function createCustomerService(ttApi) {
  function hasApi() {
    return !!(ttApi && typeof ttApi.openCustomerServiceConversation === 'function');
  }

  function canIUse(key) {
    try {
      return !!(ttApi && ttApi.canIUse && ttApi.canIUse(key));
    } catch (err) {
      return false;
    }
  }

  // Show entry whenever the conversation API exists.
  // type.3 may be unavailable on older base libs / some IDE builds.
  function isSupported() {
    return hasApi();
  }

  function preferredType() {
    if (canIUse('openCustomerServiceConversation.type.3')) return 3;
    if (canIUse('openCustomerServiceConversation.type.2')) return 2;
    // Prefer ByteHi when canIUse path is missing; runtime may still accept 3.
    return 3;
  }

  function openWithType(type, done) {
    ttApi.openCustomerServiceConversation({
      type: type,
      success: function () {
        if (done) done(true, type);
      },
      fail: function (err) {
        if (done) done(false, type, err || { errMsg: 'open fail' });
      }
    });
  }

  // Must be called synchronously inside onTouchEnd.
  function open(done) {
    if (!hasApi()) {
      if (done) done(false, 0, { errMsg: 'customer service unsupported' });
      return;
    }
    var first = preferredType();
    openWithType(first, function (ok, type, err) {
      if (ok) {
        if (done) done(true, type);
        return;
      }
      // Fallback: try the other common type once.
      var second = first === 3 ? 2 : 3;
      if (second === first) {
        if (done) done(false, type, err);
        return;
      }
      openWithType(second, function (ok2, type2, err2) {
        if (done) done(!!ok2, type2, ok2 ? null : err2 || err);
      });
    });
  }

  return {
    isSupported: isSupported,
    preferredType: preferredType,
    open: open
  };
}

module.exports = {
  createCustomerService: createCustomerService
};

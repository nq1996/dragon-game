// Douyin required sensitive-word flow for custom text input.
// Docs: https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/guide/minigame/essential-skills
// Final text MUST come from onKeyboardComplete / onKeyboardConfirm (platform-filtered).
// onKeyboardInput is live preview only and must NOT be treated as final.

function createSensitiveInput(ttApi) {
  var active = false;
  var draft = '';
  var finalValue = '';
  var onDraft = null;
  var onDone = null;
  var bound = false;

  function onInput(data) {
    draft = data && typeof data.value === 'string' ? data.value : '';
    if (onDraft) onDraft(draft);
  }

  function finish(value) {
    if (!active) return;
    finalValue = typeof value === 'string' ? value : '';
    active = false;
    var cb = onDone;
    onDone = null;
    onDraft = null;
    draft = '';
    hideKeyboard();
    unbind();
    if (cb) cb(finalValue);
  }

  function onConfirm(data) {
    // Filtered when user taps keyboard confirm.
    finish(data && data.value);
  }

  function onComplete(data) {
    // Authoritative filtered value when keyboard dismisses (confirm or close).
    finish(data && data.value);
  }

  function bind() {
    if (bound || !ttApi) return;
    bound = true;
    if (ttApi.onKeyboardInput) ttApi.onKeyboardInput(onInput);
    if (ttApi.onKeyboardConfirm) ttApi.onKeyboardConfirm(onConfirm);
    if (ttApi.onKeyboardComplete) ttApi.onKeyboardComplete(onComplete);
  }

  function unbind() {
    if (!bound || !ttApi) return;
    bound = false;
    // Essential-skills listed off* APIs — always detach after use.
    if (ttApi.offKeyboardInput) ttApi.offKeyboardInput(onInput);
    if (ttApi.offKeyboardConfirm) ttApi.offKeyboardConfirm(onConfirm);
    if (ttApi.offKeyboardComplete) ttApi.offKeyboardComplete(onComplete);
  }

  function hideKeyboard() {
    if (!ttApi || !ttApi.hideKeyboard) return;
    try {
      ttApi.hideKeyboard({});
    } catch (err) {}
  }

  function isOpen() {
    return active;
  }

  function getDraft() {
    return draft;
  }

  function open(options) {
    var opts = options || {};
    if (!ttApi || !ttApi.showKeyboard) {
      if (opts.fail) opts.fail({ errMsg: 'showKeyboard unavailable' });
      return false;
    }
    if (active) hideKeyboard();
    active = true;
    draft = opts.defaultValue || '';
    finalValue = '';
    onDraft = typeof opts.onDraft === 'function' ? opts.onDraft : null;
    onDone = typeof opts.onDone === 'function' ? opts.onDone : null;
    bind();
    ttApi.showKeyboard({
      defaultValue: draft,
      maxLength: opts.maxLength || 12,
      multiple: !!opts.multiple,
      confirmHold: false,
      confirmType: opts.confirmType || 'done',
      success: function () {
        if (opts.success) opts.success();
      },
      fail: function (err) {
        active = false;
        onDone = null;
        onDraft = null;
        unbind();
        if (opts.fail) opts.fail(err || { errMsg: 'showKeyboard fail' });
      }
    });
    return true;
  }

  function cancel() {
    if (!active) return;
    active = false;
    onDone = null;
    onDraft = null;
    draft = '';
    hideKeyboard();
    unbind();
  }

  return {
    isOpen: isOpen,
    getDraft: getDraft,
    open: open,
    cancel: cancel
  };
}

module.exports = {
  createSensitiveInput: createSensitiveInput
};

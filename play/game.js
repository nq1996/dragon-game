var createPlayScene = require('./scene.js');

function sharedRoot() {
  if (typeof GameGlobal !== 'undefined') return GameGlobal;
  if (typeof window !== 'undefined') return window;
  if (typeof global !== 'undefined') return global;
  return {};
}

var root = sharedRoot();
if (root.__dragonSwim && root.__dragonSwim.registerScene) {
  root.__dragonSwim.registerScene('play', createPlayScene);
}

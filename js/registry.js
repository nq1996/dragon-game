function sharedRoot() {
  if (typeof GameGlobal !== 'undefined') return GameGlobal;
  if (typeof window !== 'undefined') return window;
  if (typeof global !== 'undefined') return global;
  return {};
}

function createRegistry() {
  var root = sharedRoot();
  if (!root.__dragonSwim) {
    root.__dragonSwim = { scenes: {} };
  }
  var bag = root.__dragonSwim;
  bag.registerScene = function (name, factory) {
    bag.scenes[name] = factory;
  };
  bag.getScene = function (name) {
    return bag.scenes[name] || null;
  };
  return bag;
}

module.exports = {
  createRegistry: createRegistry
};

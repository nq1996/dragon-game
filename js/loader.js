// 关卡玩法放在 play 分包。主包只保留启动和首页，点「开始游戏」再下载。
// 新客户端走 loadSubpackage（会自动执行 play/game.js）；
// 旧客户端没有该接口，后台会打成整包，直接 require。
function createLoader(ttApi) {
  function loadPlay(done, fail) {
    if (ttApi && ttApi.loadSubpackage) {
      var task = ttApi.loadSubpackage({
        name: 'play',
        success: function () {
          done();
        },
        fail: function (err) {
          fail(err || new Error('load subpackage fail'));
        }
      });
      return task;
    }

    try {
      require('../play/game.js');
      done();
    } catch (err) {
      fail(err);
    }
    return null;
  }

  return {
    loadPlay: loadPlay
  };
}

module.exports = {
  createLoader: createLoader
};

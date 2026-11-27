var LEVEL_KEY = 'currentLevel';
var SHIELD_KEY = 'shieldCount';
var SIDEBAR_CLAIM_KEY = 'sidebarClaimDate';
var NICK_KEY = 'playerNick';
var DEFAULT_NICK = '小鱼选手';

function todayKey() {
  var d = new Date();
  var m = d.getMonth() + 1;
  var day = d.getDate();
  return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
}

function titleForLevel(level) {
  if (level >= 1000) return '深海神话';
  if (level >= 800) return '万顷潮主';
  if (level >= 600) return '沧海霸主';
  if (level >= 400) return '海域王者';
  if (level >= 200) return '远洋征服者';
  if (level >= 100) return '百关潜行者';
  if (level >= 50) return '水中鱼游神';
  if (level >= 46) return '海域传奇';
  if (level >= 41) return '深渊霸主';
  if (level >= 36) return '光带舞者';
  if (level >= 31) return '暗潮先锋';
  if (level >= 26) return '蛇影猎手';
  if (level >= 21) return '深海潜行者';
  if (level >= 16) return '礁石穿行者';
  if (level >= 11) return '水母旅人';
  if (level >= 7) return '追击幸存者';
  if (level >= 4) return '墨汁规避者';
  return '浅海新鱼';
}

function createProgress(storage) {
  function read(key) {
    try {
      var value = storage.get(key);
      if (value === undefined || value === null) return '';
      return String(value);
    } catch (err) {
      return '';
    }
  }

  function write(key, value) {
    storage.set(key, value);
  }

  return {
    getLevel: function () {
      var level = parseInt(read(LEVEL_KEY), 10);
      if (!level || level < 1) return 1;
      if (level > 1000) return 1000;
      return level;
    },
    getTitle: function () {
      return titleForLevel(this.getLevel());
    },
    getNick: function () {
      var nick = read(NICK_KEY).trim();
      if (!nick) return DEFAULT_NICK;
      if (nick.length > 12) nick = nick.slice(0, 12);
      return nick;
    },
    setNick: function (value) {
      var nick = String(value || '').trim();
      if (!nick) return this.getNick();
      // Platform already masks sensitive words with *; reject empty-after-mask.
      if (/^\*+$/.test(nick)) return this.getNick();
      if (nick.length > 12) nick = nick.slice(0, 12);
      write(NICK_KEY, nick);
      return nick;
    },
    setLevel: function (level) {
      var next = parseInt(level, 10);
      if (!next || next < 1) return;
      write(LEVEL_KEY, next);
    },
    getShields: function () {
      var n = parseInt(read(SHIELD_KEY), 10);
      if (!n || n < 0) return 0;
      return n;
    },
    addShields: function (count) {
      var add = parseInt(count, 10) || 0;
      if (add <= 0) return this.getShields();
      var next = this.getShields() + add;
      write(SHIELD_KEY, next);
      return next;
    },
    useShield: function () {
      var n = this.getShields();
      if (n <= 0) return false;
      write(SHIELD_KEY, n - 1);
      return true;
    },
    hasClaimedSidebarToday: function () {
      return read(SIDEBAR_CLAIM_KEY) === todayKey();
    },
    claimSidebarReward: function () {
      if (this.hasClaimedSidebarToday()) return { ok: false, reason: '今日已领取' };
      write(SIDEBAR_CLAIM_KEY, todayKey());
      var shields = this.addShields(1);
      return { ok: true, shields: shields };
    }
  };
}

module.exports = {
  createProgress: createProgress
};

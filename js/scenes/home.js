function createHomeScene(api) {
  var pressed = false;
  var giftPressed = false;
  var giftActionPressed = false;
  var giftClosePressed = false;
  var csPressed = false;
  var settingsPressed = false;
  var settingsClosePressed = false;
  var settingsToggleKey = '';
  var nickPressed = false;
  var minePressed = false;
  var mineClosePressed = false;
  var itemPressed = null;
  var giftOpen = false;
  var settingsOpen = false;
  var mineOpen = false;
  var selected = 1;
  var scrollY = 0;
  var drag = null;
  var tip = '';
  var tipUntil = 0;
  var nickDraft = '';
  var nickHit = null;
  var recordFrom = 0;
  var recordTo = 0;
  var recordHit = null;

  function buttonRect() {
    return api.layout().startButton;
  }

  function giftRect(layout) {
    return layout.giftButton;
  }

  function csRect(layout) {
    return layout.customerServiceButton;
  }

  function settingsRect(layout) {
    return layout.settingsButton;
  }

  function mineRect(layout) {
    return layout.mineButton;
  }

  function settingsPanel(layout) {
    var w = Math.min(layout.px(300), layout.w * 0.86);
    var h = layout.px(278);
    var y = (layout.h - h) / 2 - layout.px(8);
    if (y < layout.safeTop + layout.px(8)) y = layout.safeTop + layout.px(8);
    return {
      x: (layout.w - w) / 2,
      y: y,
      w: w,
      h: h,
      r: layout.px(16),
      headerH: layout.px(48),
      rowH: layout.px(54)
    };
  }

  function settingsCloseRect(layout) {
    var panel = settingsPanel(layout);
    return {
      x: panel.x + panel.w - layout.px(40),
      y: panel.y + layout.px(10),
      w: layout.px(28),
      h: layout.px(28),
      r: layout.px(14)
    };
  }

  function settingsRows(layout) {
    var panel = settingsPanel(layout);
    var keys = [
      { key: 'music', label: '音乐' },
      { key: 'sound', label: '声音' },
      { key: 'vibrate', label: '震动' }
    ];
    var startY = panel.y + panel.headerH + layout.px(18);
    var i;
    var rows = [];
    for (i = 0; i < keys.length; i++) {
      rows.push({
        key: keys[i].key,
        label: keys[i].label,
        x: panel.x + layout.px(20),
        y: startY + i * (panel.rowH + layout.px(10)),
        w: panel.w - layout.px(40),
        h: panel.rowH,
        r: layout.px(14)
      });
    }
    return rows;
  }

  function hitSettingsToggle(layout, x, y) {
    var rows = settingsRows(layout);
    var i;
    for (i = 0; i < rows.length; i++) {
      if (api.ui.hit(rows[i], x, y)) return rows[i].key;
    }
    return '';
  }

  function unlockedLevel() {
    return api.getProgress().getLevel();
  }

  function isLevelUnlocked(level) {
    return level >= 1 && level <= unlockedLevel();
  }

  function minePanel(layout) {
    var cfg = layout.minePanel;
    var w = Math.min(layout.px(300), layout.w * 0.86);
    var h = Math.min(layout.px(360), layout.h * 0.58);
    var y = (layout.h - h) / 2 - layout.px(4);
    if (y < layout.safeTop + layout.px(8)) y = layout.safeTop + layout.px(8);
    return {
      x: (layout.w - w) / 2,
      y: y,
      w: w,
      h: h,
      r: layout.px(16),
      headerH: layout.px(48),
      pad: cfg.panelPad,
      cols: cfg.cols,
      itemH: cfg.itemH,
      avatar: cfg.avatar
    };
  }

  function mineCloseRect(layout) {
    var panel = minePanel(layout);
    return {
      x: panel.x + panel.w - layout.px(40),
      y: panel.y + layout.px(10),
      w: layout.px(28),
      h: layout.px(28),
      r: layout.px(14)
    };
  }

  function recordRange() {
    var cur = unlockedLevel();
    var from = recordFrom > 0 ? recordFrom : cur;
    var to = recordTo > 0 ? recordTo : Math.min(1000, cur + 10);
    if (from < 1) from = 1;
    if (to > 1000) to = 1000;
    if (to < from) to = from;
    return { from: from, to: to, cur: cur };
  }

  function buildRecordItems() {
    var range = recordRange();
    var items = [];
    if (range.from > 1) items.push({ kind: 'dots', dir: 'prev' });
    var i;
    for (i = range.from; i <= range.to; i++) {
      items.push({ kind: 'level', level: i });
    }
    if (range.to < 1000) items.push({ kind: 'dots', dir: 'next' });
    return items;
  }

  function mineProfileHits(ctx, layout) {
    var panel = minePanel(layout);
    var progress = api.getProgress();
    var input = api.getSensitiveInput && api.getSensitiveInput();
    var nick = input && input.isOpen() ? (nickDraft || '输入昵称') : progress.getNick();
    var avatar = panel.avatar;
    var top = panel.y + panel.headerH + layout.px(16);
    var avatarX = panel.x + (panel.w - avatar) / 2;
    ctx.font = api.font('bold', 15, layout.s);
    var nickW = Math.min(panel.w - layout.px(48), Math.max(layout.px(96), ctx.measureText(nick).width + layout.px(28)));
    var nickX = panel.x + (panel.w - nickW) / 2;
    var nickY = top + avatar + layout.px(12);
    return {
      avatar: {
        x: avatarX,
        y: top,
        w: avatar,
        h: avatar,
        r: avatar / 2
      },
      nick: {
        x: nickX,
        y: nickY,
        w: nickW,
        h: layout.px(32),
        r: layout.px(16),
        text: nick
      },
      recordLabelY: nickY + layout.px(32) + layout.px(16)
    };
  }

  function levelGridMetrics(layout) {
    var panel = minePanel(layout);
    var profile = mineProfileHits(
      {
        font: '',
        measureText: function () {
          return { width: 72 };
        }
      },
      layout
    );
    var items = buildRecordItems();
    var gridTop = profile.recordLabelY + layout.px(22);
    var bodyH = panel.y + panel.h - panel.pad - gridTop;
    var rows = Math.ceil(items.length / panel.cols);
    var contentH = rows * panel.itemH;
    var gap = layout.px(6);
    var cellW = (panel.w - panel.pad * 2 - gap * (panel.cols - 1)) / panel.cols;
    return {
      panel: panel,
      items: items,
      gridTop: gridTop,
      bodyH: Math.max(40, bodyH),
      contentH: contentH,
      maxScroll: Math.max(0, contentH - Math.max(40, bodyH)),
      gap: gap,
      cellW: cellW,
      rows: rows
    };
  }

  function giftPanel(layout) {
    var w = Math.min(layout.px(300), layout.w * 0.86);
    var h = layout.px(300);
    var y = (layout.h - h) / 2 - layout.px(8);
    if (y < layout.safeTop + layout.px(8)) y = layout.safeTop + layout.px(8);
    return {
      x: (layout.w - w) / 2,
      y: y,
      w: w,
      h: h,
      r: layout.px(16),
      headerH: layout.px(48)
    };
  }

  function giftActionRect(layout) {
    var panel = giftPanel(layout);
    var w = panel.w - layout.px(48);
    return {
      x: panel.x + (panel.w - w) / 2,
      y: panel.y + panel.h - layout.px(28),
      w: w,
      h: layout.px(50),
      r: layout.px(25)
    };
  }

  function giftCloseRect(layout) {
    var panel = giftPanel(layout);
    return {
      x: panel.x + panel.w - layout.px(40),
      y: panel.y + layout.px(10),
      w: layout.px(28),
      h: layout.px(28),
      r: layout.px(14)
    };
  }

  function clampScroll(layout, value) {
    var grid = levelGridMetrics(layout);
    if (value < 0) return 0;
    if (value > grid.maxScroll) return grid.maxScroll;
    return value;
  }

  function ensureSelectedVisible(layout) {
    scrollY = 0;
  }

  function hitRecordItem(layout, x, y) {
    if (!mineOpen) return null;
    var grid = levelGridMetrics(layout);
    var panel = grid.panel;
    var bodyTop = grid.gridTop;
    var bodyLeft = panel.x + panel.pad;
    var bodyRight = panel.x + panel.w - panel.pad;
    var bodyBottom = panel.y + panel.h - panel.pad;
    if (x < bodyLeft || x > bodyRight || y < bodyTop || y > bodyBottom) return null;
    var localX = x - bodyLeft;
    var localY = y - bodyTop + scrollY;
    var col = Math.floor(localX / (grid.cellW + grid.gap));
    var row = Math.floor(localY / panel.itemH);
    if (col < 0 || col >= panel.cols || row < 0) return null;
    var index = row * panel.cols + col;
    if (index < 0 || index >= grid.items.length) return null;
    var cellX = bodyLeft + col * (grid.cellW + grid.gap);
    if (x > cellX + grid.cellW) return null;
    return grid.items[index];
  }

  function expandRecords(dir) {
    var range = recordRange();
    if (dir === 'prev') {
      recordFrom = Math.max(1, range.from - 10);
      recordTo = range.to;
    } else {
      recordFrom = range.from;
      recordTo = Math.min(1000, range.to + 10);
    }
  }

  function roundRectPath(ctx, x, y, w, h, r) {
    var radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function giftState() {
    var progress = api.getProgress();
    var sidebar = api.getSidebar();
    var claimed = progress.hasClaimedSidebarToday();
    var fromSidebar = sidebar.isFromSidebar();
    if (claimed) {
      return { mode: 'claimed', label: '今日已领取', canPrimary: false };
    }
    if (fromSidebar) {
      return { mode: 'claim', label: '领取奖励', canPrimary: true };
    }
    return { mode: 'go', label: '去侧边栏领取', canPrimary: true };
  }

  function drawGiftIcon(ctx, cx, cy, size, pressed, pulse) {
    var s = size;
    var lift = pressed ? s * 0.04 : 0;
    ctx.save();
    ctx.translate(cx, cy - lift);

    ctx.beginPath();
    ctx.arc(0, 0, s * 0.52, 0, Math.PI * 2);
    var bg = ctx.createRadialGradient(0, -s * 0.1, s * 0.1, 0, 0, s * 0.52);
    bg.addColorStop(0, '#FFE08A');
    bg.addColorStop(1, '#E09A20');
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = Math.max(1, s * 0.04);
    ctx.stroke();

    // Gift box body
    ctx.fillStyle = '#D4543A';
    ctx.fillRect(-s * 0.28, -s * 0.02, s * 0.56, s * 0.34);
    ctx.fillStyle = '#F0C24A';
    ctx.fillRect(-s * 0.04, -s * 0.02, s * 0.08, s * 0.34);
    ctx.fillRect(-s * 0.28, s * 0.1, s * 0.56, s * 0.08);

    // Lid
    ctx.fillStyle = '#E86A48';
    ctx.fillRect(-s * 0.32, -s * 0.2, s * 0.64, s * 0.18);
    ctx.fillStyle = '#F0C24A';
    ctx.fillRect(-s * 0.04, -s * 0.2, s * 0.08, s * 0.18);

    // Bow
    ctx.strokeStyle = '#F8E08A';
    ctx.lineWidth = Math.max(1.2, s * 0.05);
    ctx.beginPath();
    ctx.arc(-s * 0.1, -s * 0.22, s * 0.1, Math.PI * 0.15, Math.PI * 1.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(s * 0.1, -s * 0.22, s * 0.1, Math.PI * 1.8, Math.PI * 0.85);
    ctx.stroke();
    ctx.fillStyle = '#FFF0B0';
    ctx.beginPath();
    ctx.arc(0, -s * 0.2, s * 0.055, 0, Math.PI * 2);
    ctx.fill();

    if (pulse > 0) {
      ctx.strokeStyle = 'rgba(255, 220, 140, ' + (0.25 + pulse * 0.35) + ')';
      ctx.lineWidth = Math.max(1, s * 0.05);
      ctx.beginPath();
      ctx.arc(0, 0, s * (0.56 + pulse * 0.08), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawSettingsEntry(ctx, layout) {
    var rect = settingsRect(layout);
    var cx = rect.x + rect.w / 2;
    var cy = rect.y + rect.h / 2;
    var pressed = settingsPressed || settingsOpen;
    var r = Math.min(rect.w, rect.h) * 0.42;
    ctx.save();
    ctx.shadowColor = 'rgba(0, 16, 32, 0.35)';
    ctx.shadowBlur = pressed ? 4 : 8;
    ctx.shadowOffsetY = pressed ? 1 : 3;
    ctx.fillStyle = pressed ? 'rgba(28, 78, 128, 0.92)' : 'rgba(18, 62, 108, 0.82)';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = 'rgba(180, 220, 255, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.strokeStyle = '#EAF7FF';
    ctx.lineWidth = Math.max(1.5, layout.px(2));
    ctx.beginPath();
    ctx.arc(cx, cy, layout.px(5.5), 0, Math.PI * 2);
    ctx.stroke();
    var i;
    for (i = 0; i < 6; i++) {
      var a = (i / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * layout.px(7.2), cy + Math.sin(a) * layout.px(7.2));
      ctx.lineTo(cx + Math.cos(a) * layout.px(9.5), cy + Math.sin(a) * layout.px(9.5));
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawToggle(ctx, x, y, on, scale) {
    var w = 44 * scale;
    var h = 26 * scale;
    var r = h / 2;
    ctx.save();
    ctx.fillStyle = on ? '#3DBE8A' : 'rgba(120, 150, 180, 0.55)';
    roundRectPath(ctx, x, y, w, h, r);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(on ? x + w - r : x + r, y + r, r - 3 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawSettingsModal(ctx, layout) {
    if (!settingsOpen) return;
    var panel = settingsPanel(layout);
    var close = settingsCloseRect(layout);
    var audio = api.getAudio && api.getAudio();
    var flags = audio ? audio.getSettings() : { music: true, sound: true, vibrate: true };
    var rows = settingsRows(layout);
    var i;

    ctx.save();
    ctx.fillStyle = 'rgba(4, 18, 34, 0.58)';
    ctx.fillRect(0, 0, layout.w, layout.h);
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = layout.px(16);
    ctx.shadowOffsetY = layout.px(6);
    ctx.fillStyle = '#F4FBFF';
    roundRectPath(ctx, panel.x, panel.y, panel.w, panel.h, panel.r);
    ctx.fill();
    ctx.shadowColor = 'transparent';

    ctx.fillStyle = '#1E6BB8';
    roundRectPath(ctx, panel.x, panel.y, panel.w, panel.headerH, panel.r);
    ctx.fill();
    ctx.fillRect(panel.x, panel.y + panel.headerH - layout.px(16), panel.w, layout.px(16));

    ctx.fillStyle = '#FFFFFF';
    ctx.font = api.font('bold', 17, layout.s);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('设置', panel.x + panel.w / 2, panel.y + panel.headerH / 2);

    ctx.fillStyle = settingsClosePressed ? '#4F86D8' : '#6AA0EE';
    ctx.beginPath();
    ctx.arc(close.x + close.w / 2, close.y + close.h / 2, close.w / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = api.font('bold', 16, layout.s);
    ctx.fillText('×', close.x + close.w / 2, close.y + close.h / 2 + layout.px(1));

    for (i = 0; i < rows.length; i++) {
      var row = rows[i];
      var on = !!flags[row.key];
      var hot = settingsToggleKey === row.key;
      ctx.fillStyle = hot ? '#E8F4FF' : '#F0F7FC';
      roundRectPath(ctx, row.x, row.y, row.w, row.h, row.r);
      ctx.fill();
      ctx.strokeStyle = 'rgba(80, 140, 190, 0.25)';
      ctx.lineWidth = 1;
      roundRectPath(ctx, row.x + 0.5, row.y + 0.5, row.w - 1, row.h - 1, row.r);
      ctx.stroke();
      ctx.fillStyle = '#1F3F5F';
      ctx.font = api.font('bold', 16, layout.s);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(row.label, row.x + layout.px(16), row.y + row.h / 2);
      ctx.fillStyle = on ? '#2FA876' : '#8AA0B5';
      ctx.font = api.font('normal', 12, layout.s);
      ctx.textAlign = 'right';
      ctx.fillText(on ? '开' : '关', row.x + row.w - layout.px(62), row.y + row.h / 2);
      drawToggle(ctx, row.x + row.w - layout.px(52), row.y + (row.h - 26 * layout.s) / 2, on, layout.s);
    }
    ctx.restore();
  }

  function drawCsEntry(ctx, layout) {
    var cs = api.getCustomerService && api.getCustomerService();
    if (!cs || !cs.isSupported()) return;
    var rect = csRect(layout);
    var cx = rect.x + rect.w / 2;
    var cy = rect.y + rect.h / 2;
    var pressed = csPressed;
    var r = Math.min(rect.w, rect.h) * 0.42;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 16, 32, 0.35)';
    ctx.shadowBlur = pressed ? 4 : 8;
    ctx.shadowOffsetY = pressed ? 1 : 3;
    ctx.fillStyle = pressed ? 'rgba(28, 78, 128, 0.92)' : 'rgba(18, 62, 108, 0.82)';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = 'rgba(180, 220, 255, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.strokeStyle = '#EAF7FF';
    ctx.fillStyle = '#EAF7FF';
    ctx.lineWidth = Math.max(1.5, layout.px(2));
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy - layout.px(1), layout.px(6), Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx - layout.px(6), cy + layout.px(1), layout.px(2.8), 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + layout.px(6), cy + layout.px(1), layout.px(2.8), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawGiftEntry(ctx, layout, progress, now) {
    var sidebar = api.getSidebar();
    if (sidebar.isReady() && !sidebar.isSupported()) return;
    var rect = giftRect(layout);
    var dot = !progress.hasClaimedSidebarToday();
    var cx = rect.x + rect.w / 2;
    var iconY = rect.y + layout.px(24);
    var pulse = dot ? (Math.sin((now || 0) / 280) + 1) * 0.5 : 0;
    var pressed = giftPressed || giftOpen;

    drawGiftIcon(ctx, cx, iconY, layout.px(40), pressed, pulse);

    ctx.save();
    ctx.font = api.font('bold', 11, layout.s);
    ctx.fillStyle = pressed ? '#FFFFFF' : '#EAF7FF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.shadowColor = 'rgba(0, 12, 24, 0.45)';
    ctx.shadowBlur = 4;
    ctx.fillText('入口有奖', cx, rect.y + layout.px(48));
    ctx.restore();

    if (dot) {
      ctx.save();
      ctx.fillStyle = '#FF5A45';
      ctx.beginPath();
      ctx.arc(cx + layout.px(18), iconY - layout.px(16), layout.px(5), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function fillRoundRect(ctx, x, y, w, h, r) {
    roundRectPath(ctx, x, y, w, h, r);
    ctx.fill();
  }

  function drawStepReward(ctx, x, y, w, h, layout) {
    ctx.fillStyle = '#E8F4FF';
    fillRoundRect(ctx, x, y, w, h, layout.px(10));
    var cx = x + w / 2;
    var cy = y + h * 0.42;
    drawGiftIcon(ctx, cx, cy, layout.px(34), false, 0);
    ctx.fillStyle = '#4A5A6A';
    ctx.font = api.font('bold', 12, layout.s);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('护盾 x1', cx, y + h * 0.82);
  }

  function drawGiftModal(ctx, layout) {
    if (!giftOpen) return;
    var panel = giftPanel(layout);
    var state = giftState();
    var close = giftCloseRect(layout);
    var action = giftActionRect(layout);
    var bodyTop = panel.y + panel.headerH;
    var bodyH = panel.h - panel.headerH;
    var pad = layout.px(18);

    ctx.save();
    ctx.fillStyle = 'rgba(8, 18, 28, 0.45)';
    ctx.fillRect(0, 0, layout.w, layout.h);

    // Full white card, then blue header on top (no leftover blue strip)
    ctx.shadowColor = 'rgba(0, 0, 0, 0.22)';
    ctx.shadowBlur = layout.px(16);
    ctx.shadowOffsetY = layout.px(6);
    ctx.fillStyle = '#FFFFFF';
    fillRoundRect(ctx, panel.x, panel.y, panel.w, panel.h, panel.r);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.save();
    roundRectPath(ctx, panel.x, panel.y, panel.w, panel.h, panel.r);
    ctx.clip();
    var headerGrad = ctx.createLinearGradient(0, panel.y, 0, bodyTop);
    headerGrad.addColorStop(0, '#7EB6FF');
    headerGrad.addColorStop(1, '#5B98F0');
    ctx.fillStyle = headerGrad;
    ctx.fillRect(panel.x, panel.y, panel.w, panel.headerH);
    ctx.restore();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = api.font('bold', 17, layout.s);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('侧边栏进入领奖励', panel.x + panel.w / 2, panel.y + panel.headerH * 0.52);

    // Close circle
    ctx.beginPath();
    ctx.arc(close.x + close.w / 2, close.y + close.h / 2, close.w * 0.45, 0, Math.PI * 2);
    ctx.fillStyle = giftClosePressed ? '#4F86D8' : '#6AA0EE';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = api.font('bold', 16, layout.s);
    ctx.fillText('×', close.x + close.w / 2, close.y + close.h / 2 + layout.px(1));

    // Steps: keep all 3 texts, no sidebar-bar / recent-list illustrations
    var contentX = panel.x + pad;
    var contentW = panel.w - pad * 2;
    var y1 = bodyTop + layout.px(26);
    ctx.fillStyle = '#2A3340';
    ctx.font = api.font('bold', 14, layout.s);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('1、点击侧边栏图标 ☰', contentX, y1);

    var y2 = y1 + layout.px(34);
    ctx.fillText('2、点击「水中游」', contentX, y2);

    var y3 = y2 + layout.px(34);
    ctx.fillText('3、领取奖励', contentX, y3);
    drawStepReward(ctx, contentX + contentW * 0.28, y3 + layout.px(12), contentW * 0.44, layout.px(86), layout);

    // CTA button overlapping bottom
    var shift = giftActionPressed ? layout.px(1) : 0;
    var btn = {
      x: action.x,
      y: action.y + shift,
      w: action.w,
      h: action.h,
      r: action.r
    };
    ctx.shadowColor = 'rgba(180, 90, 20, 0.35)';
    ctx.shadowBlur = layout.px(10);
    ctx.shadowOffsetY = layout.px(4);
    var btnGrad = ctx.createLinearGradient(0, btn.y, 0, btn.y + btn.h);
    if (state.canPrimary) {
      btnGrad.addColorStop(0, giftActionPressed ? '#F0B24A' : '#FFD56A');
      btnGrad.addColorStop(1, giftActionPressed ? '#E08820' : '#F4A02A');
    } else {
      btnGrad.addColorStop(0, '#C8D0D8');
      btnGrad.addColorStop(1, '#A8B4C0');
    }
    ctx.fillStyle = btnGrad;
    fillRoundRect(ctx, btn.x, btn.y, btn.w, btn.h, btn.r);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = api.font('bold', 18, layout.s);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.label, btn.x + btn.w / 2, btn.y + btn.h / 2);
    ctx.restore();
  }

  function handleGiftAction() {
    var state = giftState();
    var progress = api.getProgress();
    var sidebar = api.getSidebar();
    if (state.mode === 'claimed') {
      showTip('今日已领取');
      return;
    }
    if (state.mode === 'claim') {
      var result = progress.claimSidebarReward();
      if (result.ok) {
        giftOpen = false;
      } else {
        showTip(result.reason || '领取失败');
      }
      return;
    }
    sidebar.goSidebar(
      function () {},
      function (msg) {
        showTip(msg || '跳转失败');
      }
    );
  }

  function showTip(text) {
    tip = text;
    tipUntil = Date.now() + 1800;
  }

  function drawDefaultAvatar(ctx, rect) {
    var cx = rect.x + rect.w / 2;
    var cy = rect.y + rect.h / 2;
    var r = rect.w / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    var bg = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.25, r * 0.2, cx, cy, r);
    bg.addColorStop(0, '#7EC8F5');
    bg.addColorStop(1, '#2F78C8');
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // simple fish silhouette
    ctx.fillStyle = '#F4FBFF';
    ctx.save();
    ctx.translate(cx - r * 0.06, cy);
    ctx.scale(1.45, 1);
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.beginPath();
    ctx.moveTo(cx + r * 0.28, cy);
    ctx.lineTo(cx + r * 0.55, cy - r * 0.22);
    ctx.lineTo(cx + r * 0.55, cy + r * 0.22);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#1A3A5C';
    ctx.beginPath();
    ctx.arc(cx - r * 0.18, cy - r * 0.04, r * 0.06, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawMineEntry(ctx, layout) {
    var rect = mineRect(layout);
    var cx = rect.x + rect.w / 2;
    var cy = rect.y + rect.h / 2;
    var hot = minePressed || mineOpen;
    var r = layout.px(18);
    ctx.save();
    ctx.shadowColor = 'rgba(0, 16, 32, 0.35)';
    ctx.shadowBlur = hot ? 4 : 8;
    ctx.shadowOffsetY = hot ? 1 : 3;
    ctx.fillStyle = hot ? 'rgba(28, 78, 128, 0.92)' : 'rgba(18, 62, 108, 0.82)';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = 'rgba(180, 220, 255, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#EAF7FF';
    ctx.beginPath();
    ctx.arc(cx, cy - layout.px(3.5), layout.px(5), 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - layout.px(8), cy + layout.px(8));
    ctx.quadraticCurveTo(cx, cy + layout.px(1), cx + layout.px(8), cy + layout.px(8));
    ctx.quadraticCurveTo(cx, cy + layout.px(12), cx - layout.px(8), cy + layout.px(8));
    ctx.fill();
    ctx.restore();
  }

  function drawMineModal(ctx, layout) {
    if (!mineOpen) return;
    var grid = levelGridMetrics(layout);
    var panel = grid.panel;
    var close = mineCloseRect(layout);
    var profile = mineProfileHits(ctx, layout);
    var unlocked = unlockedLevel();
    var input = api.getSensitiveInput && api.getSensitiveInput();
    var editing = !!(input && input.isOpen());
    var i;
    nickHit = profile.nick;
    recordHit = null;

    ctx.save();
    ctx.fillStyle = 'rgba(4, 18, 34, 0.58)';
    ctx.fillRect(0, 0, layout.w, layout.h);
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = layout.px(16);
    ctx.shadowOffsetY = layout.px(6);
    ctx.fillStyle = '#F4FBFF';
    roundRectPath(ctx, panel.x, panel.y, panel.w, panel.h, panel.r);
    ctx.fill();
    ctx.shadowColor = 'transparent';

    ctx.fillStyle = '#1E6BB8';
    roundRectPath(ctx, panel.x, panel.y, panel.w, panel.headerH, panel.r);
    ctx.fill();
    ctx.fillRect(panel.x, panel.y + panel.headerH - layout.px(16), panel.w, layout.px(16));
    ctx.fillStyle = '#FFFFFF';
    ctx.font = api.font('bold', 17, layout.s);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('我的', panel.x + panel.w / 2, panel.y + panel.headerH / 2);

    ctx.fillStyle = mineClosePressed ? '#4F86D8' : '#6AA0EE';
    ctx.beginPath();
    ctx.arc(close.x + close.w / 2, close.y + close.h / 2, close.w / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = api.font('bold', 16, layout.s);
    ctx.fillText('×', close.x + close.w / 2, close.y + close.h / 2 + layout.px(1));

    drawDefaultAvatar(ctx, profile.avatar);
    ctx.fillStyle = nickPressed || editing ? '#DCEEFF' : '#E8F4FF';
    roundRectPath(ctx, profile.nick.x, profile.nick.y, profile.nick.w, profile.nick.h, profile.nick.r);
    ctx.fill();
    ctx.strokeStyle = 'rgba(80, 140, 190, 0.35)';
    ctx.lineWidth = 1;
    roundRectPath(ctx, profile.nick.x + 0.5, profile.nick.y + 0.5, profile.nick.w - 1, profile.nick.h - 1, profile.nick.r);
    ctx.stroke();
    ctx.fillStyle = '#1F3F5F';
    ctx.font = api.font('bold', 15, layout.s);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(profile.nick.text, profile.nick.x + profile.nick.w / 2, profile.nick.y + profile.nick.h / 2);

    ctx.fillStyle = '#1F3F5F';
    ctx.font = api.font('bold', 13, layout.s);
    ctx.textAlign = 'left';
    ctx.fillText('闯关记录', panel.x + panel.pad, profile.recordLabelY + layout.px(4));

    ctx.save();
    roundRectPath(ctx, panel.x, grid.gridTop - layout.px(4), panel.w, panel.y + panel.h - grid.gridTop + layout.px(4), panel.r);
    ctx.clip();
    var bodyLeft = panel.x + panel.pad;
    for (i = 0; i < grid.items.length; i++) {
      var item = grid.items[i];
      var row = Math.floor(i / panel.cols);
      var col = i % panel.cols;
      var cellX = bodyLeft + col * (grid.cellW + grid.gap);
      var cellY = grid.gridTop + row * panel.itemH - scrollY;
      if (cellY + panel.itemH < grid.gridTop - 2 || cellY > panel.y + panel.h) continue;
      var cellH = panel.itemH - layout.px(5);
      if (item.kind === 'dots') {
        ctx.fillStyle = 'rgba(160, 175, 190, 0.28)';
        roundRectPath(ctx, cellX, cellY, grid.cellW, cellH, layout.px(8));
        ctx.fill();
        ctx.fillStyle = '#6A8095';
        ctx.font = api.font('bold', 16, layout.s);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('...', cellX + grid.cellW / 2, cellY + cellH / 2 - layout.px(2));
        continue;
      }
      var level = item.level;
      var open = isLevelUnlocked(level);
      var passed = level < unlocked;
      var current = level === unlocked;
      var hot = (recordHit && recordHit.kind === 'level' && recordHit.level === level) || selected === level;
      ctx.fillStyle = !open
        ? 'rgba(160, 175, 190, 0.35)'
        : hot
          ? 'rgba(70, 160, 210, 0.45)'
          : passed
            ? 'rgba(70, 180, 140, 0.28)'
            : 'rgba(90, 150, 210, 0.28)';
      roundRectPath(ctx, cellX, cellY, grid.cellW, cellH, layout.px(8));
      ctx.fill();
      ctx.fillStyle = open ? '#1F3F5F' : 'rgba(80, 95, 110, 0.7)';
      ctx.font = api.font(current || selected === level ? 'bold' : 'normal', 12, layout.s);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(level), cellX + grid.cellW / 2, cellY + cellH / 2);
    }
    ctx.restore();
    ctx.restore();
  }

  function drawKeyboardMask(ctx, layout) {
    var input = api.getSensitiveInput && api.getSensitiveInput();
    if (!input || !input.isOpen()) return;
    ctx.save();
    ctx.fillStyle = 'rgba(4, 18, 34, 0.55)';
    ctx.fillRect(0, 0, layout.w, layout.h);
    ctx.fillStyle = '#EAF7FF';
    ctx.font = api.font('bold', 15, layout.s);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('请在键盘上完成输入后关闭', layout.w / 2, layout.h * 0.36);
    ctx.font = api.font('normal', 12, layout.s);
    ctx.fillStyle = 'rgba(214, 236, 255, 0.9)';
    ctx.fillText('敏感词将由平台自动屏蔽', layout.w / 2, layout.h * 0.36 + layout.px(26));
    ctx.restore();
  }

  function openNickEditor() {
    var input = api.getSensitiveInput && api.getSensitiveInput();
    if (!input) {
      showTip('当前环境不支持输入');
      return;
    }
    mineOpen = true;
    giftOpen = false;
    settingsOpen = false;
    nickDraft = api.getProgress().getNick();
    input.open({
      defaultValue: nickDraft,
      maxLength: 12,
      multiple: false,
      confirmType: 'done',
      onDraft: function (value) {
        nickDraft = value || '';
      },
      onDone: function (value) {
        nickDraft = '';
        var cleaned = String(value || '').trim();
        if (!cleaned) {
          showTip('昵称未修改');
          return;
        }
        if (/^\*+$/.test(cleaned)) {
          showTip('含敏感词，请重新输入');
          return;
        }
        api.getProgress().setNick(cleaned);
        showTip('昵称已更新');
      },
      fail: function () {
        nickDraft = '';
        showTip('键盘打开失败');
      }
    });
  }

  return {
    enter: function () {
      pressed = false;
      giftPressed = false;
      giftActionPressed = false;
      giftClosePressed = false;
      csPressed = false;
      settingsPressed = false;
      settingsClosePressed = false;
      settingsToggleKey = '';
      nickPressed = false;
      minePressed = false;
      mineClosePressed = false;
      itemPressed = null;
      giftOpen = false;
      settingsOpen = false;
      mineOpen = false;
      nickDraft = '';
      recordFrom = 0;
      recordTo = 0;
      recordHit = null;
      drag = null;
      var input = api.getSensitiveInput && api.getSensitiveInput();
      if (input && input.isOpen()) input.cancel();
      selected = api.getProgress().getLevel();
      if (selected < 1) selected = 1;
      if (selected > 1000) selected = 1000;
      scrollY = 0;
      api.getSidebar().refreshSupport();
      if (api.getAudio) api.getAudio().playMusic(true);
    },
    render: function (ctx, now) {
      var layout = api.layout();
      var progress = api.getProgress();
      var loading = api.isLoadingPlay();
      api.paintBackground(ctx, layout, now);
      var pill = api.ui.pillRect(ctx, layout, progress.getTitle(), api.getMenuButton());
      api.ui.drawPill(ctx, pill, progress.getTitle(), layout.s);
      drawSettingsEntry(ctx, layout);
      drawGiftEntry(ctx, layout, progress, now);
      drawCsEntry(ctx, layout);
      drawMineEntry(ctx, layout);
      api.ui.drawPrimaryButton(
        ctx,
        layout.startButton,
        loading ? '加载中' : '开始游戏',
        loading ? '' : ('第' + selected + '关'),
        layout.s,
        pressed && !loading
      );
      drawGiftModal(ctx, layout);
      drawSettingsModal(ctx, layout);
      drawMineModal(ctx, layout);
      drawKeyboardMask(ctx, layout);
      if (tip && Date.now() < tipUntil) api.ui.drawTip(ctx, layout, tip);
    },
    onTouchStart: function (x, y) {
      if (api.isLoadingPlay()) return;
      var layout = api.layout();
      drag = null;
      if (api.getAudio) api.getAudio().unlock();
      var input = api.getSensitiveInput && api.getSensitiveInput();
      if (input && input.isOpen()) {
        pressed = false;
        giftPressed = false;
        csPressed = false;
        settingsPressed = false;
        nickPressed = false;
        minePressed = false;
        return;
      }

      if (mineOpen) {
        mineClosePressed = api.ui.hit(mineCloseRect(layout), x, y);
        if (nickHit && api.ui.hit(nickHit, x, y)) {
          nickPressed = true;
          pressed = false;
          return;
        }
        itemPressed = hitRecordItem(layout, x, y);
        recordHit = itemPressed;
        if (itemPressed || api.ui.hit(minePanel(layout), x, y)) {
          drag = { x: x, y: y, oy: y, scroll: scrollY, moved: false };
        }
        pressed = false;
        return;
      }

      if (settingsOpen) {
        settingsClosePressed = api.ui.hit(settingsCloseRect(layout), x, y);
        settingsToggleKey = hitSettingsToggle(layout, x, y);
        pressed = false;
        return;
      }

      if (giftOpen) {
        giftClosePressed = api.ui.hit(giftCloseRect(layout), x, y);
        giftActionPressed = api.ui.hit(giftActionRect(layout), x, y) && giftState().canPrimary;
        pressed = false;
        csPressed = false;
        return;
      }

      if (api.ui.hit(settingsRect(layout), x, y)) {
        settingsPressed = true;
        pressed = false;
        return;
      }
      var sidebar = api.getSidebar();
      if ((!sidebar.isReady() || sidebar.isSupported()) && api.ui.hit(giftRect(layout), x, y)) {
        giftPressed = true;
        pressed = false;
        return;
      }
      var cs = api.getCustomerService && api.getCustomerService();
      if (cs && cs.isSupported() && api.ui.hit(csRect(layout), x, y)) {
        csPressed = true;
        pressed = false;
        return;
      }
      if (api.ui.hit(mineRect(layout), x, y)) {
        minePressed = true;
        pressed = false;
        return;
      }
      pressed = api.ui.hit(buttonRect(), x, y);
    },
    onTouchMove: function (x, y) {
      var layout = api.layout();
      var input = api.getSensitiveInput && api.getSensitiveInput();
      if (input && input.isOpen()) return;
      if (mineOpen) {
        if (mineClosePressed && !api.ui.hit(mineCloseRect(layout), x, y)) mineClosePressed = false;
        if (nickPressed && !(nickHit && api.ui.hit(nickHit, x, y))) nickPressed = false;
        if (drag) {
          var dy = drag.oy - y;
          if (Math.abs(y - drag.y) > layout.px(6) || Math.abs(x - drag.x) > layout.px(6)) {
            drag.moved = true;
            itemPressed = null;
            recordHit = null;
          }
          if (drag.moved) scrollY = clampScroll(layout, drag.scroll + dy);
        }
        return;
      }
      if (settingsOpen) {
        if (settingsClosePressed && !api.ui.hit(settingsCloseRect(layout), x, y)) settingsClosePressed = false;
        if (settingsToggleKey && hitSettingsToggle(layout, x, y) !== settingsToggleKey) settingsToggleKey = '';
        return;
      }
      if (giftOpen) {
        if (giftClosePressed && !api.ui.hit(giftCloseRect(layout), x, y)) giftClosePressed = false;
        if (giftActionPressed && !api.ui.hit(giftActionRect(layout), x, y)) giftActionPressed = false;
        return;
      }
      if (settingsPressed && !api.ui.hit(settingsRect(layout), x, y)) settingsPressed = false;
      if (giftPressed && !api.ui.hit(giftRect(layout), x, y)) giftPressed = false;
      if (csPressed && !api.ui.hit(csRect(layout), x, y)) csPressed = false;
      if (minePressed && !api.ui.hit(mineRect(layout), x, y)) minePressed = false;
      if (pressed && !api.ui.hit(buttonRect(), x, y)) pressed = false;
    },
    onTouchEnd: function (x, y) {
      var layout = api.layout();
      var input = api.getSensitiveInput && api.getSensitiveInput();
      if (input && input.isOpen()) {
        nickPressed = false;
        pressed = false;
        giftPressed = false;
        csPressed = false;
        settingsPressed = false;
        minePressed = false;
        return;
      }
      if (mineOpen) {
        var closeMine = mineClosePressed && api.ui.hit(mineCloseRect(layout), x, y);
        var editNick = nickPressed && nickHit && api.ui.hit(nickHit, x, y);
        var hit = null;
        if (!editNick && drag && !drag.moved && itemPressed) {
          var again = hitRecordItem(layout, x, y);
          if (
            again &&
            again.kind === itemPressed.kind &&
            ((again.kind === 'dots' && again.dir === itemPressed.dir) ||
              (again.kind === 'level' && again.level === itemPressed.level))
          ) {
            hit = again;
          }
        }
        drag = null;
        itemPressed = null;
        recordHit = null;
        mineClosePressed = false;
        nickPressed = false;
        if (closeMine) {
          mineOpen = false;
          if (api.getAudio) api.getAudio().playSfx('click');
          return;
        }
        if (editNick) {
          openNickEditor();
          return;
        }
        if (hit && hit.kind === 'dots') {
          expandRecords(hit.dir);
          if (api.getAudio) api.getAudio().playSfx('click');
          return;
        }
        if (hit && hit.kind === 'level') {
          if (!isLevelUnlocked(hit.level)) {
            showTip('关卡未通过');
            return;
          }
          selected = hit.level;
          mineOpen = false;
          if (api.getAudio) api.getAudio().playSfx('click');
          showTip(hit.level < unlockedLevel() ? ('重玩第' + hit.level + '关') : ('挑战第' + hit.level + '关'));
          return;
        }
        return;
      }
      if (settingsOpen) {
        var closeSettings = settingsClosePressed && api.ui.hit(settingsCloseRect(layout), x, y);
        var toggleKey = settingsToggleKey && hitSettingsToggle(layout, x, y) === settingsToggleKey ? settingsToggleKey : '';
        settingsClosePressed = false;
        settingsToggleKey = '';
        if (closeSettings) {
          settingsOpen = false;
          if (api.getAudio) api.getAudio().playSfx('click');
          return;
        }
        if (toggleKey && api.getAudio) {
          api.getAudio().toggle(toggleKey);
          return;
        }
        return;
      }
      if (giftOpen) {
        var close = giftClosePressed && api.ui.hit(giftCloseRect(layout), x, y);
        var action = giftActionPressed && api.ui.hit(giftActionRect(layout), x, y);
        giftClosePressed = false;
        giftActionPressed = false;
        if (close) {
          giftOpen = false;
          return;
        }
        if (action) handleGiftAction();
        return;
      }
      var openSettings = settingsPressed && api.ui.hit(settingsRect(layout), x, y);
      var openGift = giftPressed && api.ui.hit(giftRect(layout), x, y);
      var openCs = csPressed && api.ui.hit(csRect(layout), x, y);
      var openMine = minePressed && api.ui.hit(mineRect(layout), x, y);
      var shouldStart = pressed && api.ui.hit(buttonRect(), x, y);
      settingsPressed = false;
      giftPressed = false;
      csPressed = false;
      nickPressed = false;
      minePressed = false;
      pressed = false;
      if (api.isLoadingPlay()) return;
      if (openSettings) {
        settingsOpen = true;
        giftOpen = false;
        mineOpen = false;
        if (api.getAudio) api.getAudio().playSfx('click');
        return;
      }
      if (openMine) {
        mineOpen = true;
        giftOpen = false;
        settingsOpen = false;
        nickHit = null;
        recordFrom = 0;
        recordTo = 0;
        ensureSelectedVisible(layout);
        if (api.getAudio) api.getAudio().playSfx('click');
        return;
      }
      if (openGift) {
        giftOpen = true;
        mineOpen = false;
        if (api.getAudio) api.getAudio().playSfx('click');
        return;
      }
      if (openCs) {
        var cs = api.getCustomerService && api.getCustomerService();
        if (!cs || !cs.isSupported()) {
          showTip('当前环境不支持客服');
          return;
        }
        cs.open(function (ok, type, err) {
          if (ok) return;
          var msg = (err && err.errMsg) || '';
          if (msg.indexOf('login') >= 0 || msg.indexOf('登录') >= 0) {
            showTip('请先登录抖音账号');
          } else {
            showTip('客服打开失败，请检查后台开关');
          }
          console.warn('customer service open fail', type, err);
        });
        return;
      }
      if (shouldStart) {
        if (!isLevelUnlocked(selected)) selected = unlockedLevel();
        api.startGame(selected);
      }
    },
    onTouchCancel: function () {
      pressed = false;
      giftPressed = false;
      giftActionPressed = false;
      giftClosePressed = false;
      csPressed = false;
      settingsPressed = false;
      settingsClosePressed = false;
      settingsToggleKey = '';
      nickPressed = false;
      minePressed = false;
      mineClosePressed = false;
      itemPressed = null;
      recordHit = null;
      drag = null;
    },
    showTip: showTip
  };
}

module.exports = {
  createHomeScene: createHomeScene
};

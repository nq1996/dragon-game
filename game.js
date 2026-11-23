var sidebar = require('./js/sidebar.js');
var ttApi = typeof tt !== 'undefined' ? tt : null;
// Must bind before the rest of the game boots so sidebar return is not missed.
sidebar.bindEarly(ttApi);
require('./js/main.js');

const parallel = require('./lib/parallel');
const env = require('./lib/env');
const { spawn, killAll } = require('./lib/pm');

module.exports = {
    env,
    parallel,
    killAll,
    spawn,
};

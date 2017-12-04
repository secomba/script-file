const parallel = require('./lib/parallel');
const env = require('./lib/env');
const { spawn, killAll } = require('./lib/pm');

process.on('SIGTERM', () => {
    killAll('SIGTERM').then(() => process.exit(1))
})

module.exports = {
    env,
    parallel,
    killAll,
    spawn,
};

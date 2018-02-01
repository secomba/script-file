const assert = require('assert');
const { spawn, getRunning, killAll } = require('../lib/pm');
const hookStd = require('hook-std');

describe('pm', function () {
    describe('spawn', function () {
        it('spawns a simple process', function (done) {
            const unhook = hookStd.stdout({ silent: true }, (output) => {
                unhook();
                assert(output.trim().startsWith('v'));
            });
            spawn('node --version')
                .then(() => {
                    done();
                });
        });
        it('rejects if the promise if the process is exiting with an exit code other than 0', function (done) {
            spawn('node -e "process.exit(1)"')
                .catch(() => {
                    done();
                });
        });
        it('resolves node -e "let i = 0; setInterval(() => console.log(i++), 10);", when 5 occured on the commandline', function (done) {
            let i = 0;
            const unhook = hookStd.stdout({ silent: true }, (output) => {
                assert.equal(output.trim(), `${i}`);
                if (i === 5) {
                    unhook();
                }
                i += 1;
            });
            spawn('node -e "let i = 0; setInterval(() => console.log(i++), 10);"', { resolve: '5' })
                .then(() => {
                    // assert the process is still running
                    assert(getRunning().length > 0);
                    done();
                })
                .catch((error) => {
                    done(error);
                });
        });
        it('rejects node -e "let i = 0; setInterval(() => console.log(i++), 10);", when 6 occured on the commandline', function (done) {
            let i = 0;
            const unhook = hookStd.stdout({ silent: true }, (output) => {
                assert.equal(output.trim(), `${i}`);
                if (i === 6) {
                    unhook();
                }
                i += 1;
            });
            spawn('node -e "let i = 0; setInterval(() => console.log(i++), 10);"', { reject: '6' })
                .catch(() => {
                    assert(getRunning().length > 0);
                    done();
                })
                .catch((error) => {
                    done(error);
                });
        });
    });
    describe('killAll', function () {
        it('kills started process node -e "let i = 0; setInterval(() => console.log(i++), 10);"', function (done) {
            const unhook = hookStd.stdout({ silent: true }, (output) => {
                unhook();
                assert.equal(output.trim(), '0');
            });
            spawn('node -e "let i = 0; setInterval(() => console.log(i++), 10);"', { resolve: '0' })
                .then(() => {
                    assert(getRunning().length > 0);
                    return killAll();
                })
                .then(() => new Promise(res => setInterval(res, 200)))
                .then(() => {
                    assert(getRunning().length === 0);
                    done();
                })
                .catch((error) => {
                    done(error);
                });
        });
    });
});

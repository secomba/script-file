const crossSpawn = require('cross-spawn');
const { parse } = require('parse-spawn-args');
const supportsColor = require('supports-color');

const running = new Set();

function matches(output, pattern) {
    if (!pattern) {
        return false;
    }
    return output.includes(pattern);
}

function createStdHandler(options, targetStream, callback) {
    return (data) => {
        const output = data.toString();
        targetStream.write(output);
        if (matches(output, options.resolve)) {
            callback();
            return;
        }
        if (matches(output, options.reject)) {
            callback(new Error(output));
        }
    };
}

function createExitHandler(options, childProcess, callback) {
    return (status) => {
        running.delete(childProcess);
        if (status !== 0) {
            return callback(new Error(`Script failed with status ${status}`));
        }
        return callback();
    };
}

function createErrorHandler(options, childProcess, callback) {
    return (error) => {
        running.delete(childProcess);
        callback(error);
    };
}

function spawn(script, options = {}) {
    const [command] = script.split(' ');
    const [, ...commandArgs] = parse(script);
    const args = options.args ? [...commandArgs, ...options.args] : commandArgs;
    const env = Object.assign({}, process.env, { FORCE_COLOR: supportsColor });

    return new Promise((resolve, reject) => {
        const childProcess = crossSpawn(command, args, { env });
        running.add(childProcess);

        let stdoutHandler;
        let stderrHandler;
        let exitHandler;
        let errorHandler;
        const onResolveOrReject = (error) => {
            childProcess.stdout.removeListener('data', stdoutHandler);
            childProcess.stderr.removeListener('data', stderrHandler);
            childProcess.removeListener('exit', exitHandler);
            childProcess.removeListener('error', errorHandler);
            if (error) {
                return reject(error);
            }
            return resolve();
        };
        stdoutHandler = createStdHandler(options, process.stdout, onResolveOrReject);
        stderrHandler = createStdHandler(options, process.stderr, onResolveOrReject);
        exitHandler = createExitHandler(options, childProcess, onResolveOrReject);
        errorHandler = createErrorHandler(options, childProcess, onResolveOrReject);
        childProcess.stdout.on('data', stdoutHandler);
        childProcess.stderr.on('data', stderrHandler);
        childProcess.on('exit', exitHandler);
        childProcess.on('error', errorHandler);
    });
}

function kill(child) {
    return new Promise((resolve, reject) => {
        child.on('error', (error) => {
            running.delete(child);
            reject(error);
        });
        child.on('exit', (status) => {
            running.delete(child);
            resolve(status);
        });
        if (process.platform === 'win32') {
            spawn(`taskkill /T /F /PID ${child.pid}`).catch(() => {});
        } else {
            child.kill('SIGINT');
        }
    });
}

function killAll() {
    return Promise.all(Array.from(running.values()).map(kill));
}

function getRunning() {
    return Array.from(running.values());
}

module.exports = {
    spawn,
    kill,
    killAll,
    getRunning,
};

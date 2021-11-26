const crossSpawn = require('cross-spawn');
const yargs = require('yargs');
const { parse } = require('parse-spawn-args');
const supportsColor = require('supports-color');
const path = require('path');
const dotenv = require('dotenv-safe');

class ExitError extends Error {
    constructor(status) {
        super(`Script failed with status ${status}`);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
        this.status = status;
    }
}

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
            return callback(new ExitError(status));
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

function loadEnvs(file) {
    const { parsed } = dotenv.config({
        path: file,
        sample: path.resolve('./env/.override.env'),
        allowEmptyValues: true,
    });
    return parsed;
}

function spawn(script, options = {}) {
    const [command] = script.split(' ');
    const [, ...commandArgs] = parse(script);
    const args = options.args ? [...commandArgs, ...options.args] : commandArgs;

    const parsedArgs = yargs.parse(args);
    const { env, defaultEnv } = parsedArgs;
    if (env || defaultEnv) {
        const [, exportName = 'main'] = options.scriptName.split(':');
        const envPath = exportName === 'main'
            ? path.resolve('./env', `${exportName}.env`)
            : path.resolve('./env', `${exportName}.${env || defaultEnv}.env`);
        loadEnvs(envPath);
    }

    const realArgs = args.filter((it) => it != null).map((value, index) => {
        if (['--env', '--defaultEnv', '--script_'].some((it) => value.startsWith(it))) {
            args[index + 1] = null;
            return null;
        }
        if (['--env=', '--defaultEnv=', '--script_='].some((it) => value.startsWith(it))) {
            return null;
        }
        return value;
    }).filter((it) => it != null);

    const joinedEnv = { ...process.env, FORCE_COLOR: supportsColor };
    const { cwd } = options;

    return new Promise((resolve, reject) => {
        const childProcess = crossSpawn(command, realArgs, { env: joinedEnv, cwd });
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

function kill(child, signal = 'SIGTERM') {
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
            child.kill(signal);
        }
    });
}

function killAll(signal = 'SIGTERM') {
    return Promise.all(Array.from(running.values()).map((proc) => kill(proc, signal)));
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

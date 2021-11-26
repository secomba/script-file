require('@babel/register')({
    presets: [['@babel/preset-env', { targets: { node: 'current' } }], '@babel/preset-typescript'],
    extensions: ['.js', '.jsx', '.mjs', '.ts', '.tsx'],
});

const sequential = require('promise-sequential');
const yargs = require('yargs');
const chalk = require('chalk');
const resolve = require('./resolve');
const pm = require('./pm');

function execScript(script, scriptName, args) {
    switch (typeof script) {
    case 'function': {
        const options = args ? yargs.parse(args) : null;

        const spawn = (spawnScript, spawnOptions) => pm.spawn(spawnScript, { args, scriptName, ...spawnOptions });
        return Promise.resolve(script(Object.assign(options, { spawn })));
    }
    case 'string': {
        return pm.spawn(script, { args, scriptName });
    }
    case 'object': {
        if (Array.isArray(script)) {
            return sequential(script.map((childScript) => () => execScript(childScript, scriptName, args)));
        }
        if (script.isParallel) {
            return Promise.all(script.script.map((childScript) => execScript(childScript, scriptName, args)));
        }
        return Promise.reject(Error(`Export for ${script} not supported ${typeof script}`));
    }
    default:
        return Promise.reject(Error(`Export for ${script} not supported ${typeof script}`));
    }
}

// eslint-disable-next-line consistent-return
async function exec(scriptName, args) {
    try {
        const script = await Promise.resolve(resolve(scriptName));
        return execScript(script, scriptName, args);
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error(chalk.bold.red(`[script-file] Running ${scriptName} failed: ${error.stack}`));
        process.exit(error.status || 1);
    }
}

module.exports = exec;

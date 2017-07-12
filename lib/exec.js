const sequential = require('promise-sequential');
const yargs = require('yargs');
const resolve = require('./resolve');
const pm = require('./pm');
const chalk = require('chalk');

function execScript(script, scriptName, args) {
    switch (typeof script) {
    case 'function': {
        const options = args ? yargs.parse(args) : null;
        return Promise.resolve(script(options));
    }
    case 'string': {
        return pm.spawn(script, { args, scriptName });
    }
    case 'object': {
        if (Array.isArray(script)) {
            return sequential(script.map(childScript => () => execScript(childScript, scriptName, args)));
        }
        if (script.isParallel) {
            return Promise.all(script.script.map(childScript => execScript(childScript, scriptName, args)));
        }
        return Promise.reject(Error(`Export for ${script} not supported ${typeof script}`));
    }
    default:
        return Promise.reject(Error(`Export for ${script} not supported ${typeof script}`));
    }
}

function exec(scriptName, args) {
    return Promise.resolve(resolve(scriptName))
        .then(script => execScript(script, scriptName, args))
        .catch((error) => {
            // eslint-disable-next-line no-console
            console.error(chalk.bold.red(`[script-file] Running ${scriptName} failed: ${error.message}`));
        });
}


module.exports = exec;

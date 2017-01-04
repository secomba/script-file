const path = require('path');

function resolve(scriptName) {
    const [filename, exportName = 'main'] = scriptName.split(':');
    const filePath = path.resolve('./scripts', filename);
    // eslint-disable-next-line import/no-dynamic-require, global-require
    return require(filePath)[exportName];
}

module.exports = resolve;

# script-file

**script-file** maps a `npm-script` to the exports of a `.js` file. 

## Installation

`npm install script-file`

## Usage

Create a file `scripts/foo.js` in your project root

```js
const main = (params) => console.log(`hello ${params.name}`); // Read command line arguments
const foo = 'ls -al'; // A string runs a simple command
const bar = [
    'webpack',
    'python -m SimpleHTTPServer',
]; // An array of string runs on command after another

module.exports = { main, foo, bar };
```

Add the following to your `package.json`:
```
    "scripts": {
        "foo": "script-file --name=script-file",
        "foo:foo": "script-file",
        "foo:bar": "script-file",
        "bar:foo": "script-file-alias foo:bar"
    }
```

run your scripts, `npm run foo`, `npm run foo:foo`, `npm run foo:bar`, `npm run bar:foo`

### Parameter Usage
Arguments passed to script file are processed by the [yargs](https://github.com/yargs/yargs) package. Check the [documentation](http://yargs.js.org/docs/) for details on how you can specify the arguments.

## API

script-file comes with some build-in utils, which make working with external commands easy.

### parallel(...cmds)

Run all passed scripts in parallel. 

```js
const {parallel} = require('script-file');

const main = parallel(
    'webpack-dev-server',
    'python -m SimpleHTTPServer'
);

module.exports = { main };
```

### env(string|object) : function

Returns a function which sets environment variables. If you pass in a `string` it will be set as `process.env.NODE_ENV`.
If you pass an `object` it takes the key as environment variable and assigns the corresponding value to it.

```js
const main = 'webpack';
const production = [
    env('production'),
    main,
];
const staging = [
    env({NODE_ENV: 'production', HOST: 'staging.service.com'}),
    main,
];

module.exports = { main, production, staging };
```

### spawn(cmd, [options]) : Promise

A slightly more advanced version of  `child_process.spawn` which returns a promise when the process exits.
You can optionally pass an options object to wait until the command line prints out a specified string.
E.g. `{resolve: 'Server is running'}`


```js
const {spawn} = require('script-file');
const webdriverio = require('webdriverio');

const options = {
    desiredCapabilities: {
        browserName: 'safari',
        marionette: 'true',
    },
};
const browser = webdriverio.remote(options);

const SELENIUM_STARTED_SIGNIFIER = '35bf4d76-394c-4a0d-b31f-9a2ee2d51bf6';

const captureScreenshot = () => browser.init()
    .url('http://localhost:3000')
    .screenshot()
    .end();

const main = () => spawn('node dev-server.js', { resolve: 'server-running' })
    .then(() => spawn(`webdriver-manager --started-signifier=${SELENIUM_STARTED_SIGNIFIER}`, {resolve: SELENIUM_STARTED_SIGNIFIER, reject: 'run webdriver-manager update'}))
    .then(() => captureScreenshot());

module.exports = { main };
```

### killAll() : Promise

Kills all subprocess which have been spawned.
This is useful when you want to quit all running processes on a remote after you executed some commands.

```js
const {spawn, killAll} = require('script-file');

const main () => spawn('node -e "let i = 0; setInterval(() => console.log(i++), 10);"', { resolve: '0' })
    .then(() => killall());

module.exports = { main };
```

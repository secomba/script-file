#!/usr/bin/env node

const exec = require('../lib/exec');

const [, , scriptName, ...args] = process.argv;
exec(scriptName, args);

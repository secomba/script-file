#!/usr/bin/env node

const exec = require('../lib/exec');

const [, , ...args] = process.argv;
const scriptName = process.env.npm_lifecycle_event;
exec(scriptName, args);

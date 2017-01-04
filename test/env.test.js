const env = require('../lib/env');
const assert = require('assert');

describe('env', function () {
    it('env("production")() sets process.env.NODE_ENV to "production"', function () {
        process.env.NODE_ENV = 'development';
        assert.equal(process.env.NODE_ENV, 'development');
        env('production')();
        assert.equal(process.env.NODE_ENV, 'production');
    });
    it('env({HOST: "localhost", API_KEY: "82"})() sets process.env.HOST to "localhost" and process.env.API_KEY to "82"', function () {
        assert(!process.env.HOST);
        assert(!process.env.API_KEY);
        env({ HOST: 'localhost', API_KEY: '82' })();
        assert.equal(process.env.HOST, 'localhost');
        assert.equal(process.env.API_KEY, '82');
    });
});


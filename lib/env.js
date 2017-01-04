function env(options) {
    if (typeof options === 'string') {
        return () => {
            process.env.NODE_ENV = options;
            return true;
        };
    }
    return () => Object.keys(options).forEach((key) => {
        process.env[key] = options[key];
    });
}

module.exports = env;

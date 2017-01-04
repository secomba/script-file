function parallel(...script) {
    return {
        isParallel: true,
        script,
    };
}

module.exports = parallel;

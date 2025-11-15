module.exports = {
    testEnvironment: 'node',
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'controllers/**/*.js',
        'middleware/**/*.js',
        'models/**/*.js',
        '!**/node_modules/**',
        '!**/tests/**'
    ],
    testMatch: [
        '**/tests/**/*.test.js'
    ],
    verbose: true,
    testTimeout: 10000
};

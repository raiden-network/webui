module.exports = {
    resolve: {
        fallback: {
            crypto: require.resolve('crypto-browserify'),
            http: require.resolve('stream-http'),
            https: require.resolve('https-browserify'),
            os: require.resolve('os-browserify/browser'),
            stream: require.resolve('stream-browserify'),
            assert: require.resolve('assert/'),
        },
    },
};

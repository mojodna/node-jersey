module.exports = process.env.JERSEY_COV ? require('./lib-cov/jersey') : require('./lib/jersey');

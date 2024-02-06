/** Modules that are lazy loaded and should be excluded from the vendor bundle */
const lazyLoadedModules = ['@analytics/google-analytics', '@analytics/simple-analytics'];

const lazyModuleRegExp = new RegExp(`node_modules[\\\\/](${lazyLoadedModules.join('|')})`);

module.exports = {
	lazyLoadedModules,
	lazyModuleRegExp,
};

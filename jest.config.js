// @ts-check
const esModules = ['react-stylable-diff'].join('|');

/**
 * @type {import('@jest/types').Config.InitialOptions}
 */
module.exports = {
	testEnvironment: 'node',
	moduleDirectories: ['node_modules', '<rootDir>', '<rootDir>/client', '<rootDir>/facets'],
	transformIgnorePatterns: [`/node_modules/(?!${esModules})`],
	moduleNameMapper: {
		'\\.[s]?css$': '<rootDir>/utils/storybook/styleMock.js',
		'@pubpub/deposit-utils/datacite':
			'<rootDir>/node_modules/@pubpub/deposit-utils/dist/cjs/datacite/index.js',
	},
	transform: {
		'^.+\\.[tj]sx?$': [
			'ts-jest',
			{
				diagnostics: false,
			},
		],
	},
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
	globalSetup: '<rootDir>/stubstub/global/setup.ts',
	globalTeardown: '<rootDir>/stubstub/global/teardown.ts',
	runtime: '@side/jest-runtime',
	setupFiles: ['<rootDir>/.jest/setup-env.js'],
	testPathIgnorePatterns: ['__tests__/data'],
	testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
	logHeapUsage: true,
	forceExit: true,
	silent: false,
	bail: true,
};

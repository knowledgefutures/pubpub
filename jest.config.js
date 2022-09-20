const esModules = ['react-stylable-diff'].join('|');

module.exports = {
	preset: 'ts-jest/presets/js-with-ts',
	testEnvironment: 'node',
	moduleDirectories: ['node_modules', '<rootDir>', '<rootDir>/client', '<rootDir>/facets'],
	transformIgnorePatterns: [`/node_modules/(?!${esModules})`],
	moduleNameMapper: {
		'\\.[s]?css$': '<rootDir>/utils/storybook/styleMock.js',
	},
	globalSetup: '<rootDir>/stubstub/global/setup.js',
	globalTeardown: '<rootDir>/stubstub/global/teardown.js',
	setupFiles: ['<rootDir>/.jest/setup-env.js'],
	testPathIgnorePatterns: ['__tests__/data'],
};

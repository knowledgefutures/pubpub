const esModules = ['react-stylable-diff'].join('|');

module.exports = {
	testEnvironment: 'node',
	moduleDirectories: ['node_modules', '<rootDir>', '<rootDir>/client'],
	transformIgnorePatterns: [`/node_modules/(?!${esModules})`],
	moduleNameMapper: {
		'\\.[s]?css$': '<rootDir>/utils/storybook/styleMock.js',
	},
	globalSetup: '<rootDir>/stubstub/global/setup.js',
	globalTeardown: '<rootDir>/stubstub/global/teardown.js',
	setupFiles: ['<rootDir>/.jest/register-context.js', '<rootDir>/.jest/setup-env.js'],
	testPathIgnorePatterns: ['__tests__/data'],
};

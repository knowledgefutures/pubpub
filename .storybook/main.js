module.exports = {
	stories: ['../client/**/*.stories.@(tsx|jsx)'],
	addons: ['@storybook/addon-essentials', '@storybook/addon-viewport', '@storybook/addon-knobs'],
	// uses https://github.com/storybookjs/storybook/issues/15067#issuecomment-851959296 to fix storybook err
	typescript: {
		reactDocgen: 'none',
	},
};

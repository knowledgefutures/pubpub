/* eslint-disable no-param-reassign */
const { resolve } = require('path');
const autoprefixer = require('autoprefixer');

module.exports = ({ config }) => {
	config.module.rules.push({
		test: /\.scss$/,
		use: [
			{ loader: 'style-loader' }, // creates style nodes from JS strings
			{ loader: 'css-loader' }, // translates CSS into CommonJS
			{
				loader: 'postcss-loader',
				options: { ident: 'postcss', plugins: [autoprefixer({})] },
			},
			{ loader: 'resolve-url-loader' },
			{ loader: 'sass-loader',
				options: {
					sourceMap: true,
					sourceMapContents: false,
					includePaths: [resolve(__dirname, '../client')]
				}
			}, // compiles Sass to CSS
		],
	});
	config.module.rules.push({
		test: /\.mjs$/,
		include: /node_modules/,
		type: "javascript/auto"
	});
	config.module.rules.push({
		test: /\.(ttf|eot|svg|woff|woff2)$/,
		use: [
			{ loader: 'file-loader', query: { name: 'fonts/[hash].[ext]', publicPath: '/dist/' } },
		],
	});

	config.resolve.modules = [resolve(__dirname, '../client'), 'node_modules'];
	config.resolve.alias['client'] = resolve(__dirname, '../client');
	config.resolve.alias['components'] = resolve(__dirname, '../client/components');
	config.resolve.alias['containers'] = resolve(__dirname, '../client/containers');
	config.resolve.alias['server'] = resolve(__dirname, '../server');
	config.resolve.alias['utils'] = resolve(__dirname, '../utils');
	config.node = {
		...config.node,
		fs: "empty",
	};
	return config;
};

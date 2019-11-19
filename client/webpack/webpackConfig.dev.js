const { resolve } = require('path');
const { readdirSync } = require('fs');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const autoprefixer = require('autoprefixer');

const containerEntries = readdirSync(resolve(__dirname, '../containers'))
	.filter((item) => {
		if (item === '.DS_Store' || item === 'index.js') {
			return false;
		}
		return true;
	})
	.reduce((prev, curr) => {
		return {
			...prev,
			[curr]: resolve(__dirname, `../containers/${curr}/${curr}`),
		};
	}, {});

module.exports = {
	mode: 'development',
	entry: {
		...containerEntries,
		baseStyle: resolve(__dirname, '../styles/base.scss'),
	},
	resolve: {
		modules: [resolve(__dirname, '../'), 'node_modules'],
		alias: {
			shared: resolve(__dirname, '../../shared'),
		},
	},
	devtool: '#eval',
	output: {
		filename: '[name].js',
		path: resolve(__dirname, '../../dist'),
		publicPath: '/',
	},
	stats: {
		colors: true,
		hash: false,
		assets: false,
		children: false,
		timings: true,
		chunks: false,
		chunkModules: false,
		entrypoints: false,
		modules: false,
	},
	module: {
		rules: [
			{
				test: /\.(js|jsx)$/,
				include: [resolve(__dirname, '../')],
				use: 'babel-loader',
			},
			{
				test: /\.scss$/,
				use: [
					MiniCssExtractPlugin.loader,
					{ loader: 'css-loader' },
					{
						loader: 'postcss-loader',
						options: { ident: 'postcss', plugins: [autoprefixer({})] },
					},
					{ loader: 'resolve-url-loader' },
					{
						loader: 'sass-loader',
						options: {
							sourceMap: true,
							sourceMapContents: false,
							includePaths: [resolve(__dirname, '../')],
						},
					},
				],
			},
			{
				test: /\.(ttf|eot|svg|woff|woff2)$/,
				use: [
					{
						loader: 'file-loader',
						query: { name: 'fonts/[hash].[ext]', publicPath: '/dist/' },
					},
				],
			},
		],
	},
	plugins: [
		new MiniCssExtractPlugin({
			filename: '[name].css',
		}),
		new ManifestPlugin({ publicPath: '/dist/' }),
	],
	optimization: {
		splitChunks: {
			cacheGroups: {
				vendors: {
					// TODO: bundle components into vendor, I think...
					// test: /([\\/]node_modules[\\/]|[\\/]components[\\/])/,
					test: /([\\/]node_modules[\\/])/,
					name: 'vendor',
					chunks: 'all',
					// minChunks: 2,
				},
			},
		},
	},
	node: {
		net: 'empty',
		tls: 'empty',
		dns: 'empty',
		fs: 'empty',
	},
};

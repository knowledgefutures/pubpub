const { resolve } = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const autoprefixer = require('autoprefixer');

module.exports = {
	mode: 'development',
	entry: {
		main: resolve(__dirname, `../containers/App/App.js`),
	},
	resolve: {
		modules: [resolve(__dirname, '../'), 'node_modules'],
		alias: {
			client: resolve(__dirname, '../../client'),
			components: resolve(__dirname, '../../client/components'),
			containers: resolve(__dirname, '../../client/containers'),
			server: resolve(__dirname, '../../server'),
			utils: resolve(__dirname, '../../utils'),
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
				test: /\.mjs$/,
				include: /node_modules/,
				type: 'javascript/auto',
			},
			{
				test: /\.(js|jsx)$/,
				include: [resolve(__dirname, '../'), resolve(__dirname, '../../utils')],
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
		new ManifestPlugin({
			publicPath: '/dist/',
		}),
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

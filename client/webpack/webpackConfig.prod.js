const { resolve } = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const autoprefixer = require('autoprefixer');
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const crypto = require('crypto');

const cryptoCreateHash = crypto.createHash;
crypto.createHash = (algorithm) => cryptoCreateHash(algorithm === 'md4' ? 'sha256' : algorithm);

module.exports = {
	mode: 'production',
	entry: {
		main: resolve(__dirname, `../containers/App/App.tsx`),
	},
	resolve: {
		extensions: ['.js', '.jsx', '.ts', '.tsx', '.scss'],
		modules: [resolve(__dirname, '../'), 'node_modules'],
		alias: {
			client: resolve(__dirname, '../../client'),
			components: resolve(__dirname, '../../client/components'),
			containers: resolve(__dirname, '../../client/containers'),
			server: resolve(__dirname, '../../server'),
			utils: resolve(__dirname, '../../utils'),
			types: resolve(__dirname, '../../types'),
			facets: resolve(__dirname, '../../facets'),
			'prosemirror-state': require.resolve('prosemirror-state'),
		},
	},
	devtool: '#source-map',
	output: {
		filename: '[name].[chunkhash].js',
		path: resolve(__dirname, '../../dist/client'),
		publicPath: '/',
		hashFunction: 'sha256',
	},
	module: {
		rules: [
			{
				test: /\.mjs$/,
				include: /node_modules/,
				type: 'javascript/auto',
			},
			{
				test: /\.(js|jsx|ts|tsx)$/,
				include: [
					resolve(__dirname, '../'),
					resolve(__dirname, '../../utils'),
					resolve(__dirname, '../../types'),
					resolve(__dirname, '../../facets'),
				],
				loader: 'ts-loader',
				options: { configFile: resolve(__dirname, '../../tsconfig.client.json') },
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
		// new BundleAnalyzerPlugin(),
		new webpack.DefinePlugin({
			'process.env': {
				NODE_ENV: JSON.stringify('production'),
			},
		}),
		new MiniCssExtractPlugin({
			filename: '[name].[contenthash].css',
		}),
		new ManifestPlugin({
			publicPath: '/dist/',
		}),
	],
	optimization: {
		minimizer: [
			new TerserPlugin({
				sourceMap: true,
			}),
		],
		splitChunks: {
			cacheGroups: {
				vendors: {
					// test: /[\\/]node_modules[\\/]/,
					test: /([\\/]node_modules[\\/])/,
					name: 'vendor',
					chunks: 'all',
					// minChunks: 2, // This was causing weird vendor.css issues where it wouldn't output.
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

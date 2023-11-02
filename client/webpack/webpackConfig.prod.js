const { resolve } = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const autoprefixer = require('autoprefixer');
const { sentryWebpackPlugin } = require('@sentry/webpack-plugin');
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
			deposit: resolve(__dirname, '../../deposit'),
			server: resolve(__dirname, '../../server'),
			utils: resolve(__dirname, '../../utils'),
			types: resolve(__dirname, '../../types'),
			facets: resolve(__dirname, '../../facets'),
			'prosemirror-state': require.resolve('prosemirror-state'),
		},
	},
	devtool: 'source-map',
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
					resolve(__dirname, '../../deposit'),
					resolve(__dirname, '../../utils'),
					resolve(__dirname, '../../types'),
					resolve(__dirname, '../../facets'),
				],
				loader: 'esbuild-loader',
				/**
				 * @type {import('esbuild-loader').LoaderOptions}
				 */
				options: {
					tsconfig: resolve(__dirname, '../../tsconfig.client.json'),
				},
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
		// Allow shared utils to import the sentry/node package by replacing it in the webpack build
		new webpack.NormalModuleReplacementPlugin(/@sentry\/node/, '@sentry/react'),
		// Upload sourcemaps to sentry only when we're not in CI
		...(process.env.CI === 'true'
			? []
			: [
					sentryWebpackPlugin({
						org: 'kfg',
						project: 'pubpub-frontend',
						authToken: process.env.SENTRY_AUTH_TOKEN,
						errorHandler: (err) => {
							console.warn(err);
						},
						release: {
							name: process.env.SOURCE_VERSION,
						},
					}),
			  ]),
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

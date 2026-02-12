// @ts-check

const { resolve } = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
// const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const autoprefixer = require('autoprefixer');
const crypto = require('crypto');

const { lazyModuleRegExp } = require('./lazyLoadedModules');

const cryptoCreateHash = crypto.createHash;
crypto.createHash = (algorithm) => cryptoCreateHash(algorithm === 'md4' ? 'sha256' : algorithm);

/** @type {import('webpack').Configuration} */
module.exports = {
	mode: 'development',
	entry: {
		main: resolve(__dirname, `../containers/App/App.tsx`),
	},
	resolve: {
		extensions: ['.mjs', '.cjs', '.js', '.jsx', '.ts', '.tsx', '.scss'],
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
	devtool: 'eval',
	output: {
		filename: '[name].js',
		path: resolve(__dirname, '../../dist/client'),
		publicPath: '/dist/',
		hashFunction: 'sha256',
		chunkFilename: '[name].[chunkHash].bundle.js',
	},
	stats: {
		colors: true,
		hash: false,
		assets: false,
		children: false,
		timings: true,
		chunks: true,
		chunkModules: true,
		entrypoints: true,
		modules: false,
	},
	module: {
		rules: [
			{
				test: /\.(mjs|cjs)$/,
				// this module includes nullish coalescing and optional chaining, which are not supported by webpack 4
				include: /node_modules\/@marsidev\/react-turnstile/,
				type: 'javascript/auto',
				loader: 'esbuild-loader',
				/** @type {import('esbuild-loader').LoaderOptions} */
				options: {
					target: 'es6'
				},
			},
			{
				test: /\.((c|m)?js|jsx|ts|tsx)$/,
				include: [
					resolve(__dirname, '../'),
					resolve(__dirname, '../../deposit'),
					resolve(__dirname, '../../utils'),
					resolve(__dirname, '../../types'),
					resolve(__dirname, '../../facets'),
				],
				loader: 'esbuild-loader',
				/** @type {import('esbuild-loader').LoaderOptions} */
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
		new MiniCssExtractPlugin({
			filename: '[name].css',
		}),
		new ManifestPlugin({
			publicPath: '/dist/',
		}),
		// Allow shared utils to import the sentry/node package by replacing it in the webpack build
		new webpack.NormalModuleReplacementPlugin(/@sentry\/node/, '@sentry/react'),
		// new BundleAnalyzerPlugin(),
	],
	optimization: {
		splitChunks: {
			cacheGroups: {
				vendors: {
					test: (module) => {
						// Don't bundle lazy-loaded modules into vendor.js
						if (lazyModuleRegExp.test(module.context)) {
							return false;
						}

						return /([\\/]node_modules[\\/])/.test(module.context);
					},
					name: 'vendor',
					chunks: 'all',
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

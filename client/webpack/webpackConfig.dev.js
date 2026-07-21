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
			'@pitter-patter/collab-client': resolve(__dirname, '../../node_modules/@pitter-patter/collab-client/dist/index.js'),
			'@stepwisehq/prosemirror-collab-commit/collab-commit': resolve(__dirname, '../../node_modules/@stepwisehq/prosemirror-collab-commit/dist/collab-commit.js'),
			'@stepwisehq/prosemirror-collab-commit': resolve(__dirname, '../../node_modules/@stepwisehq/prosemirror-collab-commit/dist/index.js'),
		},
	},
	devtool: 'eval',
	watchOptions: {
		ignored: [/node_modules\/(?!@pubpub)/, /\.git/, /dist/, /infra/, /scripts/, /static/, /tmp/],
	},
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
		chunks: false,
		chunkModules: false,
		entrypoints: false,
		modules: false,
	},
	module: {
		rules: [
		{
			test: /\.(m|c)?js$/,
			include: /node_modules\/@marsidev\/react-turnstile|node_modules\/(.pnpm\/)?altcha.*|node_modules\/(.pnpm\/)?react-kapsule.*|node_modules\/(.pnpm\/)?react-force-graph.*|node_modules\/(.pnpm\/)?force-graph.*|node_modules\/(.pnpm\/)?float-tooltip.*|node_modules\/(.pnpm\/)?@pitter-patter.*|node_modules\/(.pnpm\/)?@stepwisehq.*/,
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

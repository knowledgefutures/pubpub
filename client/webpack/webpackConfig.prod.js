const { resolve } = require('path');
const { readdirSync } = require('fs');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const autoprefixer = require('autoprefixer');
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

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
	mode: 'production',
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
	devtool: '#source-map',
	output: {
		filename: '[name].[chunkhash].js',
		path: resolve(__dirname, '../../dist'),
		publicPath: '/',
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
		// new BundleAnalyzerPlugin(),
		new webpack.DefinePlugin({
			'process.env': {
				NODE_ENV: JSON.stringify('production'),
			},
		}),
		new MiniCssExtractPlugin({
			filename: '[name].[contenthash].css',
		}),
		new ManifestPlugin({ publicPath: 'https://static.pubpub.org/dist/' }),
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
					test: /([\\/]node_modules[\\/]|[\\/]components[\\/])/,
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

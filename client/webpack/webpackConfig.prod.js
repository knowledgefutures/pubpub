const { resolve } = require('path');
const { readdirSync } = require('fs');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const TerserPlugin = require('terser-webpack-plugin');
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const containerEntries = readdirSync(resolve(__dirname, '../containers')).filter((item)=> {
	if (item === '.DS_Store') { return false; }
	return true;
}).reduce((prev, curr)=> {
	return {
		...prev,
		[curr]: resolve(__dirname, `../containers/${curr}/${curr}`)
	};
}, {});

module.exports = {
	mode: 'production',
	entry: {
		...containerEntries,
		baseStyle: resolve(__dirname, '../baseStyle.scss'),
	},
	resolve: {
		modules: [resolve(__dirname, '../'), 'node_modules']
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
					{ loader: 'postcss-loader', options: { ident: 'postcss', plugins: [require('autoprefixer')({})] } },
					{ loader: 'sass-loader', options: { includePaths: [resolve(__dirname, '../')] } }
				],
			},
			{
				test: /\.(ttf|eot|svg|woff|woff2)$/,
				use: [
					/* TODO for prod: Since static.pubpub.org isn't useful for */
					/* blueprint 2.0 fonts, we need to not use the static path here. */
					/* When pushing to prod for the first time, use the static.pubpub publicPath again */

					// { loader: 'file-loader', query: { name: 'fonts/[hash].[ext]', publicPath: 'https://static.pubpub.org/dist/' } }
					{ loader: 'file-loader', query: { name: 'fonts/[hash].[ext]', publicPath: '/dist/' } }
				]
			}
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
					test: /[\\/]node_modules[\\/]/,
					name: 'vendor',
					chunks: 'all',
					// minChunks: 2, // This was causing weird vendor.css issues where it wouldn't output.
				},
			}
		},
	},
	node: {
		net: 'empty',
		tls: 'empty',
		dns: 'empty',
		fs: 'empty',
	},
};

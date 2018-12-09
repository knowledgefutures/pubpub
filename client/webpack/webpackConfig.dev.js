const { resolve } = require('path');
const { readdirSync } = require('fs');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');

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
	mode: 'development',
	entry: {
		...containerEntries,
		baseStyle: resolve(__dirname, '../baseStyle.scss'),
	},
	resolve: {
		modules: [resolve(__dirname, '../'), 'node_modules']
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
					{ loader: 'sass-loader', options: { includePaths: [resolve(__dirname, '../')] } }
				],
			},
			{
				test: /\.(ttf|eot|svg|woff|woff2)$/,
				use: [
					{ loader: 'file-loader', query: { name: 'fonts/[hash].[ext]', publicPath: '/dist/' } }
				]
			}
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
					test: /[\\/]node_modules[\\/]/,
					name: 'vendor',
					chunks: 'all',
					// minChunks: 2,
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

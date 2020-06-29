import React from 'react';
import PropTypes from 'prop-types';
import App from 'containers/App/App';

const manifest = require('../dist/manifest.json');

const propTypes = {
	chunkName: PropTypes.string.isRequired,
	initialData: PropTypes.object.isRequired,
	viewData: PropTypes.object,
	headerComponents: PropTypes.array.isRequired,
};

const defaultProps = {
	viewData: {},
};
const polyfills = [
	'default',
	'fetch',
	'HTMLCanvasElement.prototype.toBlob',
	'Node.prototype.contains',
	'Array.prototype.find',
	'Array.from',
	'Number.isNaN',
	'Object.assign',
	'Object.entries',
	'Object.values',
	'Promise',
	'requestIdleCallback',
	'String.prototype.includes',
	'URL',
	'URLSearchParams',
].join(',');

const Html = (props) => {
	const getPath = (chunkName, extension) => {
		return `${manifest[`${chunkName}.${extension}`]}`;
	};

	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				{props.headerComponents}
				<meta
					name="viewport"
					content="width=device-width, initial-scale=1, shrink-to-fit=no"
				/>
				<meta
					name="google-site-verification"
					content="jmmJFnkSOeIEuS54adOzGMwc0kwpsa8wQ-L4GyPpPDg"
				/>
				<link rel="stylesheet" type="text/css" href={getPath('vendor', 'css')} />
				<link rel="stylesheet" type="text/css" href={getPath('main', 'css')} />
				<link
					rel="search"
					type="application/opensearchdescription+xml"
					title={props.initialData.communityData.title}
					href="/opensearch.xml"
				/>
			</head>
			<body>
				<div id="root">
					<App
						initialData={props.initialData}
						viewData={props.viewData}
						chunkName={props.chunkName}
					/>
				</div>
				<script
					crossOrigin="anonymous"
					src={`https://polyfill.io/v3/polyfill.min.js?features=${polyfills}`}
				/>
				<script
					id="initial-data"
					type="text/plain"
					data-json={JSON.stringify(props.initialData)}
				/>
				<script
					id="view-data"
					type="text/plain"
					data-json={JSON.stringify(props.viewData)}
				/>
				<script
					id="chunk-name"
					type="text/plain"
					data-json={JSON.stringify(props.chunkName)}
				/>
				<script src={getPath('vendor', 'js')} />
				<script src={getPath('main', 'js')} />
			</body>
		</html>
	);
};

Html.propTypes = propTypes;
Html.defaultProps = defaultProps;
export default Html;

import path from 'path';
import React from 'react';
import classNames from 'classnames';
import App from 'containers/App/App';
import { CustomScripts, InitialData } from 'types';

const manifest = require(path.join(process.cwd(), 'dist/client/manifest.json'));

type OwnProps = {
	chunkName: string;
	initialData: any;
	viewData?: any;
	headerComponents: any[];
	customScripts?: CustomScripts;
	bodyClassPrefix?: string;
};

const defaultProps = {
	viewData: {},
	bodyClassPrefix: '',
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

type Props = OwnProps & typeof defaultProps;

const getActiveSlugClassName = (initialData: InitialData, viewData?: any) => {
	if (viewData?.pageData?.slug) {
		return `active-page-${viewData.pageData.slug}`;
	}
	const activeTarget = initialData?.scopeData?.elements?.activeTarget;
	if (activeTarget && 'slug' in activeTarget) {
		return `active-${initialData.scopeData.elements.activeTargetType}-${activeTarget.slug}`;
	}
	return '';
};

const getUserClassName = (initialData: InitialData): String[] => {
	const classes: String[] = [];
	if (initialData.loginData.id) {
		classes.push('user-logged-in');
	}
	if (initialData.scopeData.activePermissions.activePermission) {
		classes.push('user-member');
		classes.push(`user-permission-${initialData.scopeData.activePermissions.activePermission}`);
	}
	return classes;
};

const Html = (props: Props) => {
	const { customScripts } = props;
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
				{customScripts?.css && (
					<style
						type="text/css"
						// eslint-disable-next-line react/no-danger
						dangerouslySetInnerHTML={{ __html: customScripts.css }}
					/>
				)}
				<link
					rel="search"
					type="application/opensearchdescription+xml"
					title={props.initialData.communityData.title}
					href="/opensearch.xml"
				/>
			</head>
			<body
				className={classNames(
					props.bodyClassPrefix && `${props.bodyClassPrefix}-body-wrapper`,
					getActiveSlugClassName(props.initialData, props.viewData),
					getUserClassName(props.initialData),
				)}
			>
				{/* This script tag is here to prevent FOUC in Firefox: https://stackoverflow.com/questions/21147149/flash-of-unstyled-content-fouc-in-firefox-only-is-ff-slow-renderer */}
				<script>0</script>
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
				{customScripts?.js && (
					<script
						type="text/javascript"
						// eslint-disable-next-line react/no-danger
						dangerouslySetInnerHTML={{ __html: customScripts.js }}
					/>
				)}
			</body>
		</html>
	);
};
Html.defaultProps = defaultProps;
export default Html;

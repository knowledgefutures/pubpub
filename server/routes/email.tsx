import React from 'react';

import { Router } from 'express';
import { minify } from 'html-minifier';
import juice from 'juice';
import ReactDOMServer from 'react-dom/server';
import { ServerStyleSheet, StyleSheetManager } from 'styled-components';

import { Digest } from 'components/Email';
import { globals, reset } from 'components/Email/styles';
import { getDigestData } from 'server/utils/email/digest';
import { handleErrors } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { hostIsValid } from 'server/utils/routes';
import { isProd } from 'utils/environment';

export const router = Router();

const inlineStylesWithMarkup = (emailMarkup: React.ReactNode, extraStyles: string) => {
	const stylesheet = new ServerStyleSheet();
	const renderedStringFromEmailMarkup = ReactDOMServer.renderToString(
		<StyleSheetManager sheet={stylesheet.instance}>{emailMarkup}</StyleSheetManager>,
	);
	const basicStyles = stylesheet.getStyleTags();
	const fullSize = juice(
		`<head><meta charset="utf-8"/>${basicStyles}</head>${renderedStringFromEmailMarkup}`,
		{
			extraCss: `${reset} ${globals} ${extraStyles}`,
		},
	);
	return minify(fullSize, {
		collapseWhitespace: true,
		maxLineLength: 700,
		collapseBooleanAttributes: true,
		minifyCSS: true,
		processConditionalComments: true,
		removeAttributeQuotes: true,
		removeComments: true,
		removeEmptyAttributes: true,
		removeOptionalTags: true,
		removeRedundantAttributes: true,
		removeTagWhitespace: true,
		useShortDoctype: true,
	});
};

export const render = (emailMarkup: React.ReactNode, extraStyles = '') => {
	return `<!DOCTYPE html><html lang="en">${inlineStylesWithMarkup(
		emailMarkup,
		extraStyles,
	)}</html>`;
};

const templates = {
	digest: {
		prepData: getDigestData,
		component: Digest,
	},
};

router.get('/email/:templateSlug', async (req, res, next) => {
	try {
		const initialData = await getInitialData(req, { isDashboard: true });
		const {
			communityData: community,
			loginData: { id: userId },
		} = initialData;
		const { templateSlug } = req.params;
		if (!hostIsValid(req, 'community') || isProd() || !userId || !(templateSlug in templates)) {
			return next();
		}
		const { component, prepData } = templates[templateSlug];
		return res.send(
			render(
				component({
					community,
					...(await prepData({
						scope: initialData.scopeData.scope,
						user: initialData.loginData,
					})),
				}),
			),
		);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});

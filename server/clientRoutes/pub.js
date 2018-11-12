import React from 'react';
import Promise from 'bluebird';
import firebaseAdmin from 'firebase-admin';
import Pub from 'containers/Pub/Pub';
import { getFirebaseConfig } from 'utilities';
import Html from '../Html';
import app from '../server';
import { hostIsValid, renderToNodeStream, getInitialData, handleErrors, generateMetaComponents } from '../utilities';
import { findPub } from '../queryHelpers';


/* To encode: Buffer.from(JSON.stringify(serviceAccountJson)).toString('base64'); */
const serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString());
firebaseAdmin.initializeApp({
	credential: firebaseAdmin.credential.cert(serviceAccount),
	databaseURL: getFirebaseConfig().databaseURL,
});

app.get(['/pub/:slug', '/pub/:slug/content/:sectionId', '/pub/:slug/draft', '/pub/:slug/draft/content/:sectionId', '/pub/:slug/:mode', '/pub/:slug/:mode/:subMode'], (req, res, next)=> {
	if (!hostIsValid(req, 'community')) { return next(); }

	const isDraftRoute = req.path.indexOf(`/pub/${req.params.slug}/draft`) === 0;
	// const acceptedModes = ['collaborators', 'versions', 'invite', 'discussions', 'contents'];
	const acceptedModes = []; // TODO: remove all mode content from pub.js and Pub.js
	if (req.params.mode && acceptedModes.indexOf(req.params.mode) === -1) { return next(); }


	return getInitialData(req)
	.then((initialData)=> {
		return Promise.all([
			initialData,
			findPub(req, initialData, isDraftRoute)
		]);
	})
	.then(([initialData, pubData])=> {
		/* If isDraft, generate a firebaseToken */
		const tokenClientId = initialData.loginData.clientId || 'anonymous';
		const createFirebaseToken = isDraftRoute
			? firebaseAdmin.auth().createCustomToken(tokenClientId, {
				isManager: pubData.isManager,
				isDraftEditor: pubData.isDraftEditor,
				isDraftViewer: pubData.isDraftViewer,
				editorKey: `pub-${pubData.id}`,
			})
			: undefined;
		return Promise.all([
			initialData,
			pubData,
			createFirebaseToken
		]);
	})
	.then(([initialData, pubData, firebaseToken])=> {
		const isUnlistedDraft = !pubData.activeVersion.isPublic && pubData.draftPermissions === 'private';

		const newInitialData = {
			...initialData,
			pubData: {
				...pubData,
				firebaseToken: firebaseToken,
				editorKey: `pub-${pubData.id}`,
			}
		};
		return renderToNodeStream(res,
			<Html
				chunkName="Pub"
				initialData={newInitialData}
				headerComponents={generateMetaComponents({
					initialData: initialData,
					title: pubData.title,
					description: pubData.description,
					image: pubData.avatar,
					attributions: pubData.attributions,
					publishedAt: pubData.firstPublishedAt,
					doi: pubData.doi,
					unlisted: isUnlistedDraft,
				})}
			>
				<Pub {...newInitialData} />
			</Html>
		);
	})
	.catch(handleErrors(req, res, next));
});

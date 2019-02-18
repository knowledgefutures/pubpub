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
		const noPublicDiscussionsList = [
			'2cc76a0e-0c75-4b43-a0bf-4563a14c4383',
			'6b394588-80a4-45d9-8069-8938e1549aa6',
			'a7770635-f22f-4785-9904-8ae64ac286fa',
			'25e3cdd1-b665-4d13-97f1-39f87f74a1e8',
			'0efde196-f4c0-419a-a0d8-c9984fe215ed',
			'30934456-bb22-4099-ae2e-4b1a4eb5db47',
			'07343849-1e82-4d0e-a806-430fb32bae81',
			'fb6bfdbb-3037-408f-bfc5-e8be34d590a6',
		];
		const allowPublicDiscussions = !noPublicDiscussionsList.includes(pubData.id);
		const newInitialData = {
			...initialData,
			pubData: {
				...pubData,
				firebaseToken: firebaseToken,
				editorKey: `pub-${pubData.id}`,
				publicDiscussions: allowPublicDiscussions
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

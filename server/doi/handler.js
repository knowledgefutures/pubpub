import { Readable } from 'stream';
import request from 'request-promise';
import xmlbuilder from 'xmlbuilder';

import createDeposit from 'shared/crossref/createDeposit';
import {
	Branch,
	Collection,
	CollectionAttribution,
	CollectionPub,
	Community,
	Pub,
	PubAttribution,
	User,
} from '../models';

const collectionIncludes = [
	{
		model: CollectionAttribution,
		as: 'attributions',
		include: [
			{
				model: User,
				as: 'user',
				required: false,
				attributes: [
					'id',
					'firstName',
					'lastName',
					'fullName',
					'avatar',
					'slug',
					'initials',
					'title',
				],
			},
		],
	},
];

const findPrimaryCollectionPubForPub = (pubId) =>
	CollectionPub.findOne({
		where: { pubId: pubId, isPrimary: true },
		include: [
			{
				model: Collection,
				as: 'collection',
				include: collectionIncludes,
			},
		],
	});

const findCollection = (collectionId) =>
	Collection.findOne({ where: { id: collectionId }, include: collectionIncludes });

const findPub = (pubId) =>
	Pub.findOne({
		where: { id: pubId },
		include: [
			{ model: Branch, as: 'branches' },
			{
				model: PubAttribution,
				as: 'attributions',
				required: false,
				include: [
					{
						model: User,
						as: 'user',
						required: false,
						attributes: [
							'id',
							'firstName',
							'lastName',
							'fullName',
							'avatar',
							'slug',
							'initials',
							'title',
						],
					},
				],
			},
		],
	});

const findCommunity = (communityId) =>
	Community.findOne({
		where: { id: communityId },
		attributes: ['id', 'title', 'issn', 'domain', 'subdomain'],
	});

const getDoiLogin = (communityId) => {
	const {
		DOI_LOGIN_ID,
		DOI_LOGIN_PASSWORD,
		MITP_DOI_LOGIN_ID,
		MITP_DOI_LOGIN_PASSWORD,
	} = process.env;
	if (communityId === '99608f92-d70f-46c1-a72c-df272215f13e') {
		// HDSR
		return { login: MITP_DOI_LOGIN_ID, password: MITP_DOI_LOGIN_PASSWORD };
	}
	return { login: DOI_LOGIN_ID, password: DOI_LOGIN_PASSWORD };
};

const submitDoiData = (json, timestamp, communityId) => {
	const { DOI_SUBMISSION_URL } = process.env;
	const { login, password } = getDoiLogin(communityId);
	const xmlObject = xmlbuilder.create(json, { headless: true }).end({ pretty: true });
	const readStream = new Readable();
	// eslint-disable-next-line no-underscore-dangle
	readStream._read = function noop() {};
	readStream.push(xmlObject);
	readStream.push(null);
	readStream.path = `/${timestamp}.xml`;
	return request({
		method: 'POST',
		url: DOI_SUBMISSION_URL,
		formData: {
			login_id: login,
			login_passwd: password,
			fname: readStream,
		},
		headers: {
			'content-type': 'multipart/form-data',
			'user-agent': 'PubPub (mailto:hello@pubpub.org)',
		},
	});
};

const persistDoiData = (ids, dois) => {
	const { collectionId, pubId } = ids;
	const { collection: collectionDoi, pub: pubDoi } = dois;
	const updates = [];
	if (collectionId && collectionDoi) {
		updates.push(Collection.update({ doi: collectionDoi }, { where: { id: collectionId } }));
	}
	if (pubId && pubDoi) {
		updates.push(Pub.update({ doi: pubDoi }, { where: { id: pubId } }));
	}
	return Promise.all(updates);
};

export const getDoiData = ({ communityId, collectionId, pubId }, doiTarget) =>
	Promise.all([
		findCommunity(communityId),
		collectionId && findCollection(collectionId),
		pubId && findPrimaryCollectionPubForPub(pubId),
		pubId && findPub(pubId),
	]).then(([community, collection, collectionPub, pub]) => {
		const resolvedCollection = collectionPub ? collectionPub.collection : collection;
		return createDeposit(
			{
				collectionPub: collectionPub,
				collection: resolvedCollection,
				community: community,
				pub: pub,
			},
			doiTarget,
		);
	});

export const setDoiData = ({ communityId, collectionId, pubId }, doiTarget) =>
	getDoiData(
		{ communityId: communityId, collectionId: collectionId, pubId: pubId },
		doiTarget,
	).then(({ deposit, timestamp, dois }) =>
		submitDoiData(deposit, timestamp, communityId)
			.then(() => persistDoiData({ collectionId: collectionId, pubId: pubId }, dois))
			.then(() => {
				return { deposit: deposit, dois: dois };
			}),
	);

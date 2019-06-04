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
} from '../../models';

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

const submitDoiData = (json, timestamp) => {
	const { DOI_SUBMISSION_URL, DOI_LOGIN_ID, DOI_LOGIN_PASSWORD } = process.env;
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
			login_id: DOI_LOGIN_ID,
			login_passwd: DOI_LOGIN_PASSWORD,
			fname: readStream,
		},
		headers: {
			'content-type': 'multipart/form-data',
			'user-agent': 'PubPub (mailto:team@pubpub.org)',
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
		submitDoiData(deposit, timestamp)
			.then(() => persistDoiData({ collectionId: collectionId, pubId: pubId }, dois))
			.then(() => {
				return { deposit: deposit, dois: dois };
			}),
	);

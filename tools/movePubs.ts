/* eslint-disable no-console */
import fs from 'fs';
import chalk from 'chalk';

import * as types from 'types';
import { Collection, CollectionPub, Community, Pub } from 'server/models';
import { createCollectionPub } from 'server/collectionPub/queries';

import { promptOkay } from './utils/prompt';

type MovablePub = types.SequelizeModel<types.DefinitelyHas<types.Pub, 'community'>>;

const {
	argv: {
		slugs: slugsFilePath,
		community: communitySubdomain,
		collection: collectionSlug = null,
	},
} = require('yargs');

const getPubSlugs = () => {
	return fs
		.readFileSync(slugsFilePath)
		.toString()
		.split('\n')
		.map((line) => line.trim());
};

const getPubs = async () => {
	const slugs = getPubSlugs();
	return Promise.all(
		slugs.map(async (slug) => {
			const pub: null | MovablePub = await Pub.findOne({
				where: { slug },
				include: [{ model: Community, as: 'community' }],
			});
			if (!pub) {
				throw new Error(`Pub ${slug} not found`);
			}
			return pub;
		}),
	);
};

const getCommunityAndCollection = async () => {
	const community: null | types.Community = await Community.findOne({
		where: { subdomain: communitySubdomain },
	});
	if (community) {
		if (collectionSlug) {
			const collection: null | types.Collection = await Collection.findOne({
				where: { slug: collectionSlug, communityId: community.id },
			});
			if (!collection) {
				throw new Error(
					`Collection ${collectionSlug} not found in Community ${community.subdomain}`,
				);
			}
			return { community, collection };
		}
		return { community, collection: null };
	}
	throw new Error(`Community ${communitySubdomain} does not exist`);
};

const renderPubPath = (
	community: types.Community,
	collection: null | types.Collection,
	pub: types.Pub,
) => {
	return [
		chalk.yellowBright(community.subdomain),
		collection && chalk.redBright(collection.slug),
		pub.slug,
	]
		.filter((x) => x)
		.join('.');
};

const checkOkayToProceed = async (
	pubs: MovablePub[],
	community: types.Community,
	collection: null | types.Collection,
) => {
	console.log('These Pubs will be moved:');
	pubs.forEach((pub) => {
		console.log(
			renderPubPath(pub.community, null, pub),
			chalk.bold('→'),
			renderPubPath(community, collection, pub),
		);
	});
	await promptOkay('Okay to proceed?', { throwIfNo: true, yesIsDefault: false });
};

const movePub = async (
	community: types.Community,
	collection: null | types.Collection,
	pub: MovablePub,
) => {
	await CollectionPub.destroy({ where: { pubId: pub.id } });
	pub.communityId = community.id;
	await pub.save();
	if (collection) {
		await createCollectionPub({ collectionId: collection.id, pubId: pub.id });
	}
	console.log(
		chalk.greenBright('✓ Moved:'),
		renderPubPath(pub.community, null, pub),
		chalk.bold('→'),
		renderPubPath(community, collection, pub),
	);
};

const main = async () => {
	const pubs = await getPubs();
	const { community, collection } = await getCommunityAndCollection();
	await checkOkayToProceed(pubs, community, collection);
	console.log('Moving Pubs...');
	await Promise.all(pubs.map((pub) => movePub(community, collection, pub)));
	console.log('Done.');
};

main();

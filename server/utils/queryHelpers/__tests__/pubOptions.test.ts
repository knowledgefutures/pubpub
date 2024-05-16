import {
	CollectionPub,
	Page,
	Member,
	CollectionAttribution,
	includeUserModel,
} from 'server/models';
import { Collection } from 'yaml/types';
import buildPubOptions from '../pubOptions';

describe('buildPubOptions', () => {
	test('should handle getCollections = true', () => {
		const { include } = buildPubOptions({ getCollections: true });

		expect(JSON.stringify(include.find((x) => x.as === 'collectionPubs'))).toEqual(
			JSON.stringify({
				model: CollectionPub,
				as: 'collectionPubs',
				separate: true,
				order: [['pubRank', 'ASC']],
				include: [
					{
						model: Collection,
						as: 'collection',
						include: [
							{
								model: Page,
								as: 'page',
								attributes: ['id', 'title', 'slug'],
							},
							{
								model: Member,
								as: 'members',
							},
							{
								model: CollectionAttribution,
								as: 'attributions',
								include: [includeUserModel({ as: 'user' })],
							},
						],
					},
				],
			}),
		);
	});

	test('should handle getCollections with nested collection object', () => {
		const { include } = buildPubOptions({
			getCollections: {
				collection: {
					page: true,
					members: false,
					attributions: true,
				},
			},
		});

		expect(JSON.stringify(include.find((x) => x.as === 'collectionPubs'))).toEqual(
			JSON.stringify({
				model: CollectionPub,
				as: 'collectionPubs',
				separate: true,
				order: [['pubRank', 'ASC']],
				include: [
					{
						model: Collection,
						as: 'collection',
						include: [
							{
								model: Page,
								as: 'page',
								attributes: ['id', 'title', 'slug'],
							},
							{
								model: CollectionAttribution,
								as: 'attributions',
								include: [includeUserModel({ as: 'user' })],
							},
						],
					},
				],
			}),
		);
	});

	test('should handle getCollections with collection set to false', () => {
		const { include } = buildPubOptions({ getCollections: { collection: false } });

		expect(JSON.stringify(include.find((x) => x.as === 'collectionPubs'))).toEqual(
			JSON.stringify({
				model: CollectionPub,
				as: 'collectionPubs',
				separate: true,
				order: [['pubRank', 'ASC']],
			}),
		);
	});

	test('should handle getCollections as an empty object', () => {
		const { include } = buildPubOptions({ getCollections: { collection: {} } });

		expect(JSON.stringify(include.find((x) => x.as === 'collectionPubs'))).toEqual(
			JSON.stringify({
				model: CollectionPub,
				as: 'collectionPubs',
				separate: true,
				order: [['pubRank', 'ASC']],
				include: [
					{
						model: Collection,
						as: 'collection',
						include: [],
					},
				],
			}),
		);
	});

	test('should handle getCollections as null', () => {
		const { include } = buildPubOptions({ getCollections: false });

		expect(include.find((x) => x.as === 'collectionPubs')).toEqual(undefined);
	});
});

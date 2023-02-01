import { mapMetadataFields } from '../../collections/metadata';
import { getSchemaForKind } from '../../collections/schemas';

import createDepositPartial from '../createDeposit';

import community from './data/community';
import pub from './data/pub';
import pubIsReviewOf from './data/pubIsReviewOf';
import pubHasReview from './data/pubHasReview';
import pubIsSupplementTo from './data/pubIsSupplementTo';
import pubHasSupplement from './data/pubHasSupplement';
import pubIsPreprintOf from './data/pubIsPreprintOf';
import pubHasPreprint from './data/pubHasPreprint';
import makeCollectionPub from './data/makeCollectionPub';
import { book, issue, conference } from './data/collections';

const createDeposit = (context, target, depositTarget) =>
	createDepositPartial(
		{ ...context, community },
		target,
		depositTarget,
		new Date('2019-04-11T19:02:15.577Z').getTime(),
	);

const stripFieldsFromCollectionMetadata = (where) => (collection) => {
	return {
		...collection,
		metadata: mapMetadataFields(collection.kind, (field) => {
			if (where(field)) {
				return undefined;
			}
			return collection.metadata[field.name];
		}),
	};
};

const stripDatesFromCollectionMetadata = stripFieldsFromCollectionMetadata(
	(field) => field.type && field.type.name === 'date',
);

describe('createDeposit', () => {
	it('creates a deposit for a pub', () => {
		expect(
			createDeposit(
				{
					pub,
				},
				'pub',
			),
		).toMatchSnapshot();
	});

	it('creates a deposit for a pub in a book', () => {
		expect(
			createDeposit(
				{
					collection: book,
					collectionPub: makeCollectionPub(book, pub),
					pub,
				},
				'pub',
			),
		).toMatchSnapshot();
	});

	it('creates a deposit for a pub in an issue', () => {
		expect(
			createDeposit(
				{
					collection: issue,
					collectionPub: makeCollectionPub(issue, pub),
					pub,
				},
				'pub',
			),
		).toMatchSnapshot();
	});

	it('creates a deposit for a pub in a conference', () => {
		expect(
			createDeposit(
				{
					collection: conference,
					collectionPub: makeCollectionPub(conference, pub),
					pub,
				},
				'pub',
			),
		).toMatchSnapshot();
	});

	it('creates a deposit for a book', () => {
		expect(
			createDeposit(
				{
					collection: book,
				},
				'collection',
			),
		).toMatchSnapshot();
	});

	it('creates a deposit for an issue', () => {
		expect(
			createDeposit(
				{
					collection: issue,
				},
				'collection',
			),
		).toMatchSnapshot();
	});

	it('creates a deposit for a conference', () => {
		expect(
			createDeposit(
				{
					collection: conference,
				},
				'collection',
			),
		).toMatchSnapshot();
	});

	it('creates a deposit for a book without any date information', () => {
		expect(
			createDeposit(
				{
					collection: stripDatesFromCollectionMetadata(book),
				},
				'collection',
			),
		).toMatchSnapshot();
	});

	it('creates a deposit for an issue without any date information', () => {
		expect(
			createDeposit(
				{
					collection: stripDatesFromCollectionMetadata(issue),
				},
				'collection',
			),
		).toMatchSnapshot();
	});

	it('creates a deposit for a conference without any date information', () => {
		expect(
			createDeposit(
				{
					collection: stripDatesFromCollectionMetadata(conference),
				},
				'collection',
			),
		).toMatchSnapshot();
	});

	it('creates relationships where the resource is a URL', () => {
		const [edge] = pubIsReviewOf.outboundEdges;
		const { doi: _, ...targetPubProps } = edge.targetPub;

		expect(
			createDeposit(
				{
					pub: {
						...pubIsReviewOf,
						outboundEdges: [
							{
								...edge,
								targetPub: targetPubProps,
							},
						],
					},
				},
				'pub',
			),
		).toMatchSnapshot();
	});

	it('creates relationships where the resource is a DOI', () => {
		expect(
			createDeposit(
				{
					pub: pubIsReviewOf,
				},
				'pub',
			),
		).toMatchSnapshot();
	});

	it('applies content version to the content version attribute of the resource element', () => {
		expect(
			createDeposit(
				{
					pub,
					contentVersion: 'am',
				},
				'pub',
			),
		).toMatchSnapshot();
	});

	it('creates a peer_review deposit for a pub with an isReviewOf connection', () => {
		expect(
			createDeposit(
				{
					pub: pubIsReviewOf,
					reviewType: 'foo',
					reviewRecommendation: 'bar',
				},
				'pub',
			),
		).toMatchSnapshot();
	});

	it('creates a journal_article deposit for a pub with a hasReview connection', () => {
		expect(
			createDeposit(
				{
					pub: pubHasReview,
					reviewType: 'foo',
					reviewRecommendation: 'bar',
				},
				'pub',
			),
		).toMatchSnapshot();
	});

	it('creates a sa_component deposit for a pub with a isSupplementTo connection', () => {
		expect(
			createDeposit(
				{
					pub: pubIsSupplementTo,
				},
				'pub',
			),
		).toMatchSnapshot();
	});

	it('creates a journal_article deposit for a pub with a hasSupplement connection', () => {
		expect(
			createDeposit(
				{
					pub: pubHasSupplement,
				},
				'pub',
			),
		).toMatchSnapshot();
	});

	it('creates a posted_content deposit for a pub with an isPreprintOf connection', () => {
		expect(
			createDeposit(
				{
					pub: pubIsPreprintOf,
				},
				'pub',
			),
		).toMatchSnapshot();
	});

	it('creates a posted_content deposit for a pub with a hasPreprint connection', () => {
		expect(
			createDeposit(
				{
					pub: pubHasPreprint,
				},
				'pub',
			),
		).toMatchSnapshot();
	});

	it('creates a posted_content deposit for a pub when contentVersion is "preprint"', () => {
		expect(
			createDeposit(
				{
					pub,
					contentVersion: 'preprint',
				},
				'pub',
			),
		).toMatchSnapshot();
	});

	it('respects the `url` and `doi` metadata fields for a collection', () => {
		const { deposit } = createDeposit(
			{
				collection: book,
				collectionPub: makeCollectionPub(book, pub),
				pub,
			},
			'pub',
		);
		const {
			doi_data: { doi, resource },
		} = deposit.doi_batch.body.book.book_metadata;
		expect(doi).toEqual('an_utterly_fake_doi');
		expect(resource['#text']).toEqual('https://test.com');
	});

	it('correctly handles date metadata provided by a collection', () => {
		const { deposit } = createDeposit(
			{
				collection: conference,
				collectionPub: makeCollectionPub(conference, pub),
				pub,
			},
			'pub',
		);
		const {
			proceedings_metadata: { publication_date },
			event_metadata: { conference_date },
		} = deposit.doi_batch.body.conference;
		expect(conference_date).toEqual({
			'#text': '2019-05-01',
		});
		expect(publication_date).toEqual({
			'@media_type': 'online',
			day: '01',
			month: '05',
			year: '2019',
		});
	});

	it('understands contextHints provided by a CollectionPub', () => {
		const contextHintValue = 'glossary';
		const { deposit } = createDeposit(
			{
				collection: book,
				collectionPub: makeCollectionPub(book, pub, contextHintValue),
				pub,
			},
			'pub',
		);
		const {
			content_item: { '@component_type': componentType },
		} = deposit.doi_batch.body.book;
		expect(componentType).toEqual(
			getSchemaForKind('book').contextHints.find((ch) => ch.value === contextHintValue)
				.crossrefComponentType,
		);
	});

	it('uses a DepositTarget to produce a doi prefix', () => {
		const depositTarget = { doiPrefix: 'abc' };
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { doi, ...pubWithouDoi } = pub;
		const { dois } = createDeposit({ pub: pubWithouDoi }, 'pub', depositTarget);
		expect(dois.pub.split('/')[0]).toEqual(depositTarget.doiPrefix);
	});
});

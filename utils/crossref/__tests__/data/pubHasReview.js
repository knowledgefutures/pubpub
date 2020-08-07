import pub from './pub';

export default {
	...pub,
	outboundEdges: [
		{
			id: 'd6671d94-3527-4f73-9955-55acfe362442',
			pubId: '1519656b-cc26-43ad-83f2-dbf5b828a8c7',
			targetExternalPublication: null,
			targetPubId: '303f1efa-3c7b-41e3-bc53-877815b35099',
			relationType: 'review',
			rank: '8',
			pubIsParent: true,
			approvedByTarget: true,
			createdAt: new Date('2020-08-07T16:35:00.224Z'),
			updatedAt: new Date('2020-08-07T16:35:00.224Z'),
			externalPublicationId: null,
			targetPub: {
				id: '303f1efa-3c7b-41e3-bc53-877815b35099',
				doi: 'some-doi',
				slug: 'is-review',
				community: {
					subdomain: 'foo',
				},
				collectionPubs: [],
				releases: [],
				attributions: [],
			},
			externalPublication: null,
		},
	],
};

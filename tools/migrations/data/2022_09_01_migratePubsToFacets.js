/* eslint-disable no-console */
import { Pub } from 'server/models';
import { updateFacetsForScope } from 'server/facets';

import { forEachInstance } from '../util';

const defaultNodeLabel = (text) => ({ text, enabled: false });

export const up = async () => {
	await forEachInstance(
		Pub,
		async (pub) => {
			const { id, title, updatedAt, facetsMigratedAt } = pub;
			const needsUpdate =
				new Date(updatedAt).valueOf() > new Date(facetsMigratedAt).valueOf();
			if (needsUpdate) {
				const {
					headerBackgroundColor,
					headerBackgroundImage,
					headerStyle,
					citationStyle,
					citationInlineStyle,
					licenseSlug,
					pubEdgeListingDefaultsToCarousel,
					pubEdgeDescriptionVisible,
					nodeLabels: { image, audio, video, table, block_equation },
				} = pub;
				console.log('🚛 Migrating:', id, title);
				await updateFacetsForScope(
					{ pubId: pub.id },
					{
						PubHeaderTheme: {
							textStyle: headerStyle,
							backgroundColor: headerBackgroundColor,
							backgroundImage: headerBackgroundImage,
						},
						PubEdgeDisplay: {
							defaultsToCarousel: pubEdgeListingDefaultsToCarousel,
							descriptionIsVisible: pubEdgeDescriptionVisible,
						},
						License: {
							kind: licenseSlug,
							copyrightSelection: {
								choice: 'infer-from-scope',
								year: null,
							},
						},
						CitationStyle: {
							citationStyle,
							inlineCitationStyle: citationInlineStyle,
						},
						NodeLabels: {
							image: image || defaultNodeLabel('Figure'),
							audio: audio || defaultNodeLabel('Audio'),
							video: video || defaultNodeLabel('Video'),
							table: table || defaultNodeLabel('Table'),
							math: block_equation || defaultNodeLabel('Equation'),
						},
					},
				);
				await pub.update({ facetsMigratedAt: new Date() });
			} else {
				console.log('✅ Up to date: ', id, title);
			}
		},
		50,
	);
};

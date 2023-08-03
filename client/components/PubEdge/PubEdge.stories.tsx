/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import { storiesOf } from '@storybook/react';

import { PubEdge, PubEdgeEditor } from 'components';
import { RelationType } from 'utils/pubEdge';
import { ExternalPublication } from 'types';

const pubEdge = {
	id: 'pub-edge-id',
	externalPublication: {
		id: 'f3abfe2e-9c9d-4a1d-a54b-7753d608a900',
		title: "Artificial Intelligence—The Revolution Hasn't Happened Yet",
		description:
			'Artificial Intelligence (AI) is the mantra of the current era. The phrase is intoned by technologists, academicians, journalists, and venture capitalists alike. As with many phrases that cross over from technical academic fields into general circulation, there is significant misunderstanding accompanying use of the phrase. However, this is not the classical case of the public not understanding the scientists—here the scientists are often as befuddled as the public. The idea that our era is somehow seeing the emergence of an intelligence in silicon that rivals our own entertains all of us, enthralling us and frightening us in equal measure. And, unfortunately, it distracts us.',
		url: 'https://hdsr.mitpress.mit.edu/pub/wot7mkc1/release/8',
		contributors: ['Richard Jenkins', 'Bradley Whitford', 'Sigourney Weaver'],
		publicationDate: new Date().toISOString(),
		avatar: 'https://assets.pubpub.org/9fk06ei5/41589421981678.jpg',
	},
	relationType: RelationType.Review,
	pubIsParent: true,
};

const pubEdgeWithoutAvatar = {
	...pubEdge,
	externalPublication: {
		...pubEdge.externalPublication,
		avatar: null,
	},
};

const StatefulPreviewWrapper = () => {
	const [externalPublication, setExternalPublication] = useState<ExternalPublication>(
		pubEdge.externalPublication,
	);
	return (
		<PubEdgeEditor
			pubEdgeDescriptionIsVisible
			externalPublication={externalPublication}
			onUpdateExternalPublication={(next) =>
				setExternalPublication({ ...externalPublication, ...next })
			}
		/>
	);
};

storiesOf('components/PubEdge', module)
	.add('default', () => <PubEdge pubEdge={pubEdge} />)
	.add('actsLikeLink', () => <PubEdge pubEdge={pubEdge} actsLikeLink={true} />)
	.add('no avatar', () => (
		<>
			<PubEdge pubEdge={pubEdgeWithoutAvatar} />
		</>
	));

storiesOf('components/PubEdgeEditor', module).add('default', () => <StatefulPreviewWrapper />);

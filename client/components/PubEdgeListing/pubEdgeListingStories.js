/* eslint-disable react/prop-types */
import React from 'react';
import { storiesOf } from '@storybook/react';

import { PubEdgeListing } from 'components';
import { RelationType } from 'utils/pubEdge';

import { Filter } from './constants';

const pubEdges = [
	{
		externalPublication: {
			title: 'Wunden verbinden',
			contributors: ['Hildegund Keul'],
			avatar: 'https://assets.pubpub.org/qsjyoz1y/61586620971745.png',
			url: 'https://cursor.pubpub.org/pub/keul-wunden/release/2',
			publicationDate: Date.now(),
			description:
				'Das Doppeldeutige erschließt sich auf den zweiten Blick: Wunden verbinden. Die Corona-Pandemie zeigt einerseits die Notwendigkeit, Wunden zu verbinden. Andererseits offenbart sie, dass Wunden dazu herausfordern, sich miteinander zu verbinden.',
		},
		relationType: RelationType.Review,
		pubIsParent: true,
	},
	{
		externalPublication: {
			title: 'Theology in the Shadow of the Corona Crisis',
			contributors: ['Guenter Thomas'],
			avatar: 'https://assets.pubpub.org/m4ccobdf/51585552700986.jpg',
			url: 'https://cursor.pubpub.org/pub/thomas-theologycorona/release/5',
			publicationDate: Date.now(),
			description:
				"This contribution gives a systematic overview how the question of illness and the global spreading of a disease affects our thoughts on creation, God's presence in the world, what Christians may hope for and how this shapes their actions.",
		},
		relationType: RelationType.Comment,
		pubIsParent: true,
	},
	{
		externalPublication: {
			title:
				'Auferstehung ja, aber nur schrittweise und mit Maske – Zum Comeback eines theologischen Begriffs während der SARS-CoV-2-Pandemie?',
			contributors: ['Emilia Handke', 'Dennis Bock'],
			avatar: 'https://assets.pubpub.org/dwkdjbj2/11586205211852.jpg',
			url: 'https://cursor.pubpub.org/pub/handke-bock-auferstehung/release/1',
			publicationDate: Date.now(),
			description:
				'Während wir das ganze Jahr über von politischen und literarischen #Auferstehungen vergessener Demokraten und Schriftsteller lesen können, sind es solche Tweets und Hashtags, die wir jetzt, kurz vor Ostern und inmitten der Corona-Pandemie, bei Twitter wie scheinbar selbstverständlich finden können. Auferstehung ist ein Begriff, der auch – und gerade – dann im säkularen Kontext Verwendung findet, wenn es um die Beschreibung einschneidender und krisenhafter Erlebnisse geht. Die pandemische Ausbreitung der Atemwegserkrankung COVID-19 durch das Coronavirus SARS-CoV-2 ist zweifelsohne ein vielgestaltiger krisenhafter Prozess, dessen gesundheitliche, politische, wirtschaftliche und gesellschaftliche Auswirkungen uns noch lange beschäftigen werden.',
		},
		relationType: RelationType.Comment,
		pubIsParent: true,
	},
	{
		externalPublication: {
			title: 'Liturgical Struggles in the Corona-Crisis',
			contributors: ['Bent Flemming Nielsen', 'Mikkel Gabriel Christoffersen'],
			avatar: 'https://assets.pubpub.org/1wuh04pc/41586276667772.jpg',
			url: 'https://cursor.pubpub.org/pub/nielsen-christoffersen-liturgy/release/2',
			publicationDate: Date.now(),
			description:
				"The Corona-virus has implications for the Christian church as a liturgical community. From within a Danish context, this article explores some possibilities and pitfalls of continuing to celebrate the Lord's Supper during this time of crisis.",
		},
		relationType: RelationType.Review,
		pubIsParent: false,
	},
];

const StoryContainer = (props) => <div style={{ padding: 24 }}>{props.children}</div>;

storiesOf('components/PubEdgeListing', module).add('header', () => (
	<StoryContainer>
		<PubEdgeListing
			accentColor="#A22E37"
			pubEdges={pubEdges}
			initialFilters={[Filter.Parent]}
			isolated
		/>
	</StoryContainer>
));

storiesOf('components/PubEdgeListing', module).add('footer', () => (
	<StoryContainer>
		<PubEdgeListing
			accentColor="#A22E37"
			pubTitle="Fear and Anxiety in Corona Isolation"
			pubEdges={pubEdges}
		/>
	</StoryContainer>
));

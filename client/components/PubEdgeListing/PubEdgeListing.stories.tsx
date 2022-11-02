/* eslint-disable react/prop-types */
import React from 'react';
import { storiesOf } from '@storybook/react';

import { PubEdgeListing } from 'components';
import { RelationType } from 'utils/pubEdge';

import { Filter } from './constants';

const somePub = {
	title: 'Scripture as Interface. A Hermeneutical Reflection on a Concept based in Media Theory',
	avatar: null,
	releases: [
		{
			id: '52ebe6a2-ff74-4537-8ce8-c7999f1fbd55',
			createdAt: '2019-11-10T11:17:24.978Z',
			updatedAt: '2019-11-10T11:17:24.980Z',
		},
	],
	attributions: [
		{
			id: 'd8742882-bb84-4b69-a8d2-cb8ce7b115e5',
			name: null,
			avatar: null,
			title: null,
			order: 0.5,
			isAuthor: true,
			roles: null,
			affiliation: null,
			orcid: null,
			userId: '8fda605d-eaee-4820-83a3-d1e18499a8a9',
			pubId: 'be520569-5dd6-4e49-8866-a31cd54b5e3c',
			createdAt: '2019-10-22T09:53:13.102Z',
			updatedAt: '2019-10-22T09:53:13.102Z',
			user: {
				id: '8fda605d-eaee-4820-83a3-d1e18499a8a9',
				firstName: 'Frederike',
				lastName: 'van Oorschot',
				fullName: 'Frederike van Oorschot',
				avatar: 'https://assets.pubpub.org/y7pvxkw3/11571046154113.jpg',
				slug: 'frederike-van-oorschot',
				initials: 'Fv',
				title: '',
				orcid: '',
			},
		},
	],
};

const inboundEdges = [
	{
		pubIsParent: true,
		relationType: RelationType.Comment,
		pub: somePub,
	},
];

const outboundEdges = [
	{
		externalPublication: {
			title: 'Auferstehung ja, aber nur schrittweise und mit Maske – Zum Comeback eines theologischen Begriffs während der SARS-CoV-2-Pandemie?',
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
			title: 'Wunden verbinden',
			contributors: ['Hildegund Keul'],
			avatar: null,
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
];

const siblingEdges = [
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
		pubIsParent: true,
		pub: somePub,
	},
];

const pubData = {
	title: 'The Porous Mask. A Theological Reflection on Concepts of Personhood and Personal Agency in the Digital Age',
	inboundEdges,
	outboundEdges,
	siblingEdges,
} as unknown as any;

const StoryContainer = (props) => <div style={{ padding: 24 }}>{props.children}</div>;

storiesOf('components/PubEdgeListing', module).add('header', () => (
	<StoryContainer>
		<PubEdgeListing
			accentColor="#A22E37"
			pubEdgeDescriptionIsVisible
			pubData={pubData}
			initialFilters={[Filter.Parent]}
			isolated
		/>
	</StoryContainer>
));

storiesOf('components/PubEdgeListing', module).add('footer', () => (
	<StoryContainer>
		<PubEdgeListing accentColor="#A22E37" pubEdgeDescriptionIsVisible pubData={pubData} />
	</StoryContainer>
));

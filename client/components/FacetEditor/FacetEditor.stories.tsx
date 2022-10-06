import React from 'react';
import { storiesOf } from '@storybook/react';

import {
	createFacetInstance,
	cascade,
	NodeLabels,
	PubHeaderTheme,
	CitationStyle,
	PubEdgeDisplay,
} from 'facets';
import { communityData, pubData } from 'utils/storybook/data';

import {
	CitationStyleEditor,
	NodeLabelsEditor,
	PubEdgeDisplayEditor,
	PubHeaderThemeEditor,
} from './definitions';

const cascadedPubTheme = cascade(PubHeaderTheme, [
	{
		scope: { kind: 'community', id: communityData.id },
		facetBindingId: null,
		value: createFacetInstance(PubHeaderTheme, {
			textStyle: 'light',
			backgroundColor: '#acd413aa',
			backgroundImage: null,
		}),
	},
	{
		scope: { kind: 'pub', id: pubData.id },
		facetBindingId: null,
		value: createFacetInstance(PubHeaderTheme, {
			textStyle: 'light',
			backgroundColor: null,
			backgroundImage: 'https://assets.pubpub.org/eys4nqr0/11528828519590.jpg',
		}),
	},
]);

const cascadedNodeLabels = cascade(NodeLabels, [
	{
		scope: { kind: 'community', id: communityData.id },
		facetBindingId: null,
		value: createFacetInstance(NodeLabels),
	},
	{
		scope: { kind: 'pub', id: pubData.id },
		facetBindingId: null,
		value: createFacetInstance(NodeLabels, {
			image: {
				enabled: true,
				text: 'Ooooo',
			},
		}),
	},
]);

const cascadedCitationStyle = cascade(CitationStyle, [
	{
		scope: { kind: 'community', id: communityData.id },
		facetBindingId: null,
		value: createFacetInstance(CitationStyle),
	},
	{
		scope: { kind: 'pub', id: pubData.id },
		facetBindingId: null,
		value: createFacetInstance(CitationStyle, {
			inlineCitationStyle: 'authorYear',
		}),
	},
]);

const cascadedPubEdgeDisplay = cascade(PubEdgeDisplay, [
	{
		scope: { kind: 'community', id: communityData.id },
		facetBindingId: null,
		value: createFacetInstance(PubEdgeDisplay),
	},
]);

storiesOf('components/FacetEditor', module).add('PubHeaderTheme', () => (
	<PubHeaderThemeEditor
		cascadeResult={cascadedPubTheme}
		onUpdateValue={() => {}}
		currentScope={{ kind: 'pub', id: pubData.id }}
		selfContained
	/>
));

storiesOf('components/FacetEditor', module).add('NodeLabels', () => (
	<NodeLabelsEditor
		cascadeResult={cascadedNodeLabels}
		onUpdateValue={() => {}}
		currentScope={{ kind: 'pub', id: pubData.id }}
		selfContained
	/>
));

storiesOf('components/FacetEditor', module).add('CitationStyle', () => (
	<CitationStyleEditor
		cascadeResult={cascadedCitationStyle}
		onUpdateValue={() => {}}
		currentScope={{ kind: 'pub', id: pubData.id }}
		selfContained
	/>
));

storiesOf('components/FacetEditor', module).add('PubEdgeDisplay', () => (
	<PubEdgeDisplayEditor
		cascadeResult={cascadedPubEdgeDisplay}
		onUpdateValue={() => {}}
		currentScope={{ kind: 'pub', id: pubData.id }}
		selfContained
	/>
));

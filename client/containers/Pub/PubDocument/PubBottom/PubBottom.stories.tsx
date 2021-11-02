import React from 'react';
import { storiesOf } from '@storybook/react';

import { discussionsData } from 'utils/storybook/data';
import PubBottom from 'containers/Pub/PubDocument/PubBottom/PubBottom';
import { PubPageData } from 'types';

const citations = [
	{
		structuredValue: 'https://doi.org/10.21428/8f7503e4',
		unstructuredValue: '<p>Some text for folks.</p>',
		html: '<div class="csl-bib-body">\n  <div data-csl-entry-id="temp_id_9869594710326501" class="csl-entry">Ito, J. (2017). Resisting Reduction: A Manifesto. <i>Journal of Design and Science</i>. https://doi.org/10.21428/8f7503e4</div>\n</div>',
	},
	{ structuredValue: '', unstructuredValue: '<p>okok</p>', html: '' },
];

const footnotes = [
	{
		structuredValue:
			'@article{spier2002history,\n  title={The history of the peer-review pzro212121asasa2cess},\n  author={Spier, Ray},\n  journal={TReeeeeeENDS in Biotechnology},\n  volume={20},\n  number={8},\n  pages={357--358},\n  year={2002},\n  publisher={Elsevier}\n}',
		unstructuredValue: '<p>Tigers are stri1234567ped.</p>',
		html: '<div class="csl-bib-body">\n  <div data-csl-entry-id="spier2002history" class="csl-entry">Spier, R. (2002). The history of the peer-review pzro212121asasa2cess. <i>TReeeeeeENDS in Biotechnology</i>, <i>20</i>(8), 357–358.</div>\n</div>',
	},
	{
		structuredValue:
			'@article{spier2002history,\n  title={The history of the peer-review process},\n  author={Spier, Ray},\n  journal={TeNDS in Biotechnology},\n  volume={20},\n  number={8},\n  pages={357--358},\n  year={2002},\n  publisher={Elsevier}\n}',
		unstructuredValue: '<p>Tigers are 123.!</p>',
		html: '<div class="csl-bib-body">\n  <div data-csl-entry-id="spier2002history" class="csl-entry">Spier, R. (2002). The history of the peer-review process. <i>TeNDS in Biotechnology</i>, <i>20</i>(8), 357–358.</div>\n</div>',
	},
	{ structuredValue: '', unstructuredValue: '<p>Tigers are striped.njn</p>', html: '' },
	{ structuredValue: '', unstructuredValue: '<p>Tigers are striped.</p>', html: '' },
	{
		structuredValue: 'https://doi.org/10.21428/8f7503e4',
		unstructuredValue: '<p>Tigers are striped.</p>',
		html: '<div class="csl-bib-body">\n  <div data-csl-entry-id="temp_id_7637804677847417" class="csl-entry">Ito, J. (2017). Resisting Reduction: A Manifesto. <i>Journal of Design and Science</i>. https://doi.org/10.21428/8f7503e4</div>\n</div>',
	},
	{ structuredValue: '', unstructuredValue: '<p>Tigers are striped!</p>', html: '' },
];

const sharedProps: Omit<React.ComponentProps<typeof PubBottom>, 'pubData'> = {
	updateLocalData: () => {},
	mainContentRef: React.createRef(),
	sideContentRef: React.createRef(),
};

const pubData = {
	footnotes,
	citations,
	discussions: discussionsData,
	labels: null,
	canManage: false,
	collectionPubs: [],
	releases: [],
} as unknown as PubPageData;

storiesOf('containers/Pub/PubDocument/PubBottom/PubBottom', module)
	.add('default', () => (
		<div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
			<PubBottom {...sharedProps} pubData={pubData} />
		</div>
	))
	.add('can-manage', () => (
		<div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
			<PubBottom {...sharedProps} pubData={{ ...pubData, canManage: true } as any} />
		</div>
	))
	.add('cannot-discuss', () => (
		<div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
			<PubBottom {...sharedProps} pubData={pubData} />
		</div>
	))
	.add('no-pub-bottom-discussions', () => (
		<div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
			<PubBottom
				{...sharedProps}
				pubData={
					{
						...pubData,
						discussions: pubData.discussions!.filter(
							(ds: any) => ds.highlights !== null,
						),
					} as any
				}
			/>
		</div>
	))
	.add('no-discussions', () => (
		<div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
			<PubBottom
				{...sharedProps}
				pubData={
					{
						...pubData,
						discussions: [],
					} as any
				}
			/>
		</div>
	));

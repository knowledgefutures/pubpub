import React from 'react';
import { storiesOf } from '@storybook/react';

import { discussionsData as discussions, discussionLabels as labels } from 'data';
import PubBottom from 'containers/Pub/PubDocument/PubBottom/PubBottom';

const footnotes = [
	'This footnote is purely for demonstration purposes. It is neither too long, nor too short, making it the perfect size to illustrate what an informal text block of footnote looks like in real life.',
	'This footnote is purely for demonstration purposes. It is neither too... oh it is short.',
	'And this one is purely for demonstration purposes. It is a long one to make sure that we all know what a super long footnote will look like in rea world situations where authors may tend to be verbose and not really know how to punctuate their sentences like what is happening with this very long sentence right now. When I add more gibberish words to it like this asdfas dh h1o and then bf kh ygaisgd fih then we really have a long footnote which noone is going to read.',
].map((str, index) => ({
	content: str,
	href: '#' + index.toString(),
	number: index + 1,
}));

const citations = [
	'Huntford, R., “The Last Place on Earth – Scott and Amundsen’s Race to the South Pole”, The Modern Library, New York, 1999',
	'Discussion with Paul Sheppard, Chief Program Officer, Antarctic Infrastructure and Logistics Section, Office of Polar Programs, National Science Foundation',
	'Lunney, G.S., “Discussion of Several Problem Areas During the Apollo 13 Operation”, AIAA 70-1260, AIAA 7th Annual Meeting and Technical Display, October 19-22, 1970, Houston TX',
	'Portree, D.S.F., “Mir Hardware Heritage”, NASA Reference Publication 1357, NASA Lyndon B. Johnson Space Center, Houston, TX, March 1995',
	'Harland, D.M., “The Story of Space Station Mir”, Praxis Publishing, Chichester, UK, 2005',
	'Space Station Program Office, “International Space Station Logistics and Maintenance Lessons Learned for Future Programs”, briefing by W. W. Robbins, Chief, Logistics and Maintenance Office, Johnson Space Center, 30 June 2005.',
	'National Aeronautics and Space Administration, “Mars Human Landing Sites Study (HLS2) Overview,” https://www.nasa.gov/sites/default/files/atoms/files/hls2-overview-v3tagged.pdf',
	'National Aeronautics and Space Administration, “Lunar L1 Gateway Conceptual Design Report, V.1.0,” EX15-01-001, NASA/JSC, October 2001.',
	'Troutman, P., Mazanek, D., et al., “Orbital Aggregation and Space Infrastructure Systems (OASIS),” IAC-02-IAA.13.2.06, 53rd International Astronautical Congress, Houston, TX, 10-19 October 2002.',
	'Space Studies Program Team, Operations and Service Infrastructure for Space (OASIS) Final Report, International Space University, 2012.',
	'Whitley, R., Martinez, R., “Options for Staging Orbits in Cislunar Space,” 2016 IEEE Aerospace Conference, 5-12 March 2016.',
	'Woolley, R., Landau, D., et al., “Human Cargo Resupply Logistics at Mars Using 150kW SEP Tug Cyclers,” IEEE Aerospace Conference, Big Sky, MT, 2017.',
].map((str, index) => ({
	content: str,
	href: '#' + index.toString(),
	number: index + 1,
}));

const pubData = {
	footnotes: footnotes,
	citations: citations,
	discussions: discussions,
	labels: labels,
	canManage: false,
	canDiscussBranch: true,
	activeBranch: {
		id: 'ff116d8b-c3e5-4472-ab1a-8041ec1cc842',
	},
};

storiesOf('containers/Pub/PubDocument/PubBottom/PubBottom', module)
	.add('default', () => (
		<div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
			<PubBottom pubData={pubData} collabData={{ editorChangeObject: {} }} />
		</div>
	))
	.add('can-manage', () => (
		<div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
			<PubBottom
				pubData={{ ...pubData, canManage: true }}
				collabData={{ editorChangeObject: {} }}
			/>
		</div>
	))
	.add('cannot-discuss', () => (
		<div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
			<PubBottom
				pubData={{ ...pubData, canDiscussBranch: false }}
				collabData={{ editorChangeObject: {} }}
			/>
		</div>
	))
	.add('no-pub-bottom-discussions', () => (
		<div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
			<PubBottom
				pubData={{
					...pubData,
					discussions: pubData.discussions.filter((ds) => ds.highlights !== null),
				}}
				collabData={{ editorChangeObject: {} }}
			/>
		</div>
	))
	.add('no-discussions', () => (
		<div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
			<PubBottom
				pubData={{
					...pubData,
					discussions: [],
				}}
				collabData={{ editorChangeObject: {} }}
			/>
		</div>
	));

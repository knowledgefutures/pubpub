import React from 'react';
import { storiesOf } from '@storybook/react';

import Footnotes from 'containers/Pub/PubDocument/PubBottom/Footnotes';

storiesOf('containers/Pub/PubDocument/PubBottom/Footnotes', module).add('default', () => (
	<div style={{ background: '#F6F4F4', 'min-height': '100vh' }}>
		<div style={{ width: 600, margin: 'auto' }}>
			<Footnotes
				accentColor="#a2273e"
				footnotes={[
					{
						content:
							'This footnote is purely for demonstration purposes. It is neither too long, nor too short, making it the perfect size to illustrate what an informal text block of footnote looks like in real life.',
						href: '#1',
						number: 1,
					},
					{
						content:
							'This footnote is purely for demonstration purposes. It is neither too... oh it is short.',
						href: '#2',
						number: 2,
					},
					{
						content:
							'And this one is purely for demonstration purposes. It is a long one to make sure that we all know what a super long footnote will look like in rea world situations where authors may tend to be verbose and not really know how to punctuate their sentences like what is happening with this very long sentence right now. When I add more gibberish words to it like this asdfas dh h1o and then bf kh ygaisgd fih then we really have a long footnote which noone is going to read.',
						href: '#3',
						number: 3,
					},
				]}
			/>
		</div>
	</div>
));

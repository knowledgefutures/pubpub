import React, { useState } from 'react';

import { storiesOf } from '@storybook/react';

import TitleEditor from './TitleEditor';

storiesOf('components/TitleEditor', module).add('default', () => {
	const [rendered, setRendered] = useState('');
	return (
		<>
			<TitleEditor
				initialValue="<em>Initial <strong>value</strong></em>"
				onChange={setRendered}
			/>
			<strong>Rendered:</strong>
			<div dangerouslySetInnerHTML={{ __html: rendered }} />
		</>
	);
});

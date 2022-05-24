/* eslint-disable react/prop-types */
import { storiesOf } from '@storybook/react';
import React, { useState } from 'react';

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
			<div
				// eslint-disable-next-line react/no-danger
				dangerouslySetInnerHTML={{ __html: rendered }}
			/>
		</>
	);
});

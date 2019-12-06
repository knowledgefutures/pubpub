import React from 'react';

import { MinimalEditor } from 'components';

import { minimalButtonSet } from '../buttons';

const TestControls = () => {
	return (
		<>
			Hwæt!
			<MinimalEditor
				isTranslucent={true}
				useFormattingBar={true}
				formattingBarButtons={minimalButtonSet}
			/>
		</>
	);
};

export default TestControls;

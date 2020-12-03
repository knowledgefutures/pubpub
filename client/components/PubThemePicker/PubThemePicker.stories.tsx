/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import { storiesOf } from '@storybook/react';

import { PubThemePicker } from 'components';
import { pubData, communityData } from 'utils/storybook/data';

const ThemePickerWrapper = (props) => {
	const { pubData: pubDataProp, ...restProps } = props;
	const [localData, setLocalData] = useState({
		pubData: pubDataProp,
	});

	const updateLocalData = (type, value) => {
		const currentLocalData = { ...localData };
		if (type === 'pub') {
			currentLocalData.pubData = { ...localData.pubData, ...value };
		}
		setLocalData(currentLocalData);
	};

	return <PubThemePicker {...restProps} {...localData} updateLocalData={updateLocalData} />;
};

storiesOf('components/PubThemePicker', module).add('default', () => (
	<ThemePickerWrapper communityData={communityData} pubData={pubData} />
));

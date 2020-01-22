import React, { useState } from 'react';
import { storiesOf } from '@storybook/react';
import ThemePicker from 'containers/Pub/PubHeader/ThemePicker';
import { pubData, communityData } from 'data';

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

	return <ThemePicker {...restProps} {...localData} updateLocalData={updateLocalData} />;
};

storiesOf('containers/Pub/PubHeader', module).add('themePicker', () => (
	<ThemePickerWrapper communityData={communityData} pubData={pubData} />
));

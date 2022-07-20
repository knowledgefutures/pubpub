import React from 'react';
import { FocusStyleManager } from '@blueprintjs/core';
import { addDecorator, addParameters } from '@storybook/react';

import { PubContextProvider } from 'client/containers/Pub/PubContextProvider';
import { PageContext } from 'utils/hooks';
import { communityData, locationData, loginData, scopeData, pubData } from 'utils/storybook/data';
import { AccentStyle } from 'components';

const pageContext = {
	communityData,
	locationData,
	loginData,
	scopeData,
	featureFlags: {},
	dismissedUserDismissables: {},
	initialNotificationsData: {
		hasNotifications: true,
		hasUnreadNotifications: true,
	},
};

FocusStyleManager.onlyShowFocusOnTabs();

/* Require default styles as done in Html.js */
require('styles/base.scss');

addDecorator((storyFn) => {
	return (
		<PageContext.Provider value={pageContext}>
			<PubContextProvider pubData={pubData}>
				<AccentStyle communityData={communityData} isNavHidden={false} />
				{storyFn()}
			</PubContextProvider>
		</PageContext.Provider>
	);
});

/* Set Storybook options */
addParameters({
	options: {
		sortStoriesByKind: true,
		showPanel: false,
	},
});

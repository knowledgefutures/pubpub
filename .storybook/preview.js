import React from 'react';
import { FocusStyleManager } from '@blueprintjs/core';
import { addDecorator, addParameters } from '@storybook/react';

import { PubContextProvider } from 'client/containers/Pub/PubContextProvider';
import { PageContext } from 'utils/hooks';
import { communityData, locationData, loginData, scopeData, pubData } from 'utils/storybook/data';
import { AccentStyle, FacetsStateProvider } from 'components';

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
			<FacetsStateProvider
				options={{ currentScope: scopeData.scope, cascadeResults: scopeData.facets }}
			>
				<PubContextProvider pubData={pubData}>
					<AccentStyle communityData={communityData} isNavHidden={false} />
					{storyFn()}
				</PubContextProvider>
			</FacetsStateProvider>
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

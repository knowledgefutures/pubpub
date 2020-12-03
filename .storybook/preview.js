import React from 'react';
import { FocusStyleManager } from '@blueprintjs/core';
import { addDecorator, addParameters } from '@storybook/react';

import { PageContext } from 'utils/hooks';
import { communityData, locationData, loginData, scopeData } from 'utils/storybook/data';

FocusStyleManager.onlyShowFocusOnTabs();

/* Require default styles as done in Html.js */
require('styles/base.scss');

addDecorator((storyFn) => {
	return (
		<PageContext.Provider value={{ communityData, locationData, loginData, scopeData }}>
			{storyFn()}
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

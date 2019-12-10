import React from 'react';
import requireContext from 'require-context.macro';
import { addDecorator, addParameters, configure } from '@storybook/react';
import { configureViewport } from '@storybook/addon-viewport';
import { FocusStyleManager } from '@blueprintjs/core';
import { communityData, locationData, loginData } from 'data';
import { PageContext } from 'utils/hooks';

FocusStyleManager.onlyShowFocusOnTabs();

/* Require default styles as done in Html.js */
require('styles/base.scss');

/* Require stories */
const req = requireContext('../stories/', true, /Stories\.js$/);
function loadStories() {
	req.keys().forEach(req);
}

addDecorator((storyFn) => {
	return (
		<PageContext.Provider value={{ communityData, locationData, loginData }}>
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

configure(loadStories, module);

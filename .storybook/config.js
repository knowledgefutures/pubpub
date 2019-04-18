import requireContext from 'require-context.macro';
import { addParameters, configure } from '@storybook/react';
import { configureViewport } from '@storybook/addon-viewport';
import { FocusStyleManager } from '@blueprintjs/core';

FocusStyleManager.onlyShowFocusOnTabs();

/* Require default styles as done in Html.js */
require('styles/base.scss');

/* Require stories */
const req = requireContext('../stories/', true, /Stories\.js$/);
function loadStories() {
	req.keys().forEach(req);
}

/* Set Storybook options */
addParameters({
	options: {
		sortStoriesByKind: true,
		showPanel: false,
	}
});

configure(loadStories, module);

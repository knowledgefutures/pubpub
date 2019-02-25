import requireContext from 'require-context.macro';

import { configure } from '@storybook/react';
import { setOptions } from '@storybook/addon-options';
import { FocusStyleManager } from '@blueprintjs/core';

FocusStyleManager.onlyShowFocusOnTabs();

/* Require default styles as done in Html.js */
require('baseStyle.scss');

/* Require stories */
const req = requireContext('../stories/', true, /Stories\.js$/);
function loadStories() {
	req.keys().forEach(req);
}
/* Set Storybook options */
setOptions({
	showAddonPanel: false,
});

configure(loadStories, module);

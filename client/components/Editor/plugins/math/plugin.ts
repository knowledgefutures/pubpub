import { Plugin } from 'prosemirror-state';
import { mathPlugin } from '@benrbray/prosemirror-math';

import { mathViewOverrideWithCount } from './mathView';

export default () => {
	const mathDisplayNodeView = mathPlugin.props.nodeViews.math_display;
	const mathNodeViewOverridePlugin = new Plugin({
		props: {
			nodeViews: {
				math_display: mathViewOverrideWithCount(mathDisplayNodeView),
			},
		},
	});
	return [mathNodeViewOverridePlugin, mathPlugin];
};

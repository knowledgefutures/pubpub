import { history } from 'prosemirror-history';
import { gapCursor } from 'prosemirror-gapcursor';

import buildCollaborative from './collaborative';
import buildDomEvents from './domEvents';
import buildIds from './ids';
import buildHeaderIds from './headerIds';
import buildInputRules from './inputRules';
import buildKeymap from './keymap';
import buildLocalHighlights from './localHighlights';
import buildOnChange from './onChange';
import buildPlaceholder from './placeholder';
import buildReactive from './reactive';
import buildTable from './table';

const buildGapCursor = () => {
	return gapCursor();
};

const buildHistory = () => {
	return history();
};

export const requiredPlugins = {
	domEvents: buildDomEvents,
	onChange: buildOnChange,
	gapCursor: buildGapCursor,
	history: buildHistory,
	keymap: buildKeymap,
	table: buildTable,
	collaborative: buildCollaborative,
	ids: buildIds,
	reactive: buildReactive,
};

export const optionalPlugins = {
	inputRules: buildInputRules,
	headerIds: buildHeaderIds,
	placeholder: buildPlaceholder,
	localHighlights: buildLocalHighlights,
};

export const getPlugins = (schema, props) => {
	const allPlugins = {
		...optionalPlugins,
		...props.customPlugins,
		...requiredPlugins,
	};
	return Object.keys(allPlugins)
		.filter((key) => {
			return !!allPlugins[key];
		})
		.sort((foo, bar) => {
			if (foo === 'onChange') {
				return 1;
			}
			if (bar === 'onChange') {
				return -1;
			}
			return 0;
		})
		.map((key) => {
			return allPlugins[key](schema, props);
		})
		.reduce((prev, curr) => {
			/* Some plugin generation functions return an */
			/* array of plugins. Flatten those cases. */
			return prev.concat(curr);
		}, []);
};

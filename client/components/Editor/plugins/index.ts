import { history } from 'prosemirror-history';
import { gapCursor } from 'prosemirror-gapcursor';

import { Schema } from 'prosemirror-model';
import buildCollaborative from './collaborative';
import buildDiscussions from './discussions';
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
import buildSuggest from './suggest';
import { PluginLoader, PluginsOptions } from '../types';

const buildGapCursor = () => {
	return gapCursor();
};

const buildHistory = () => {
	return history();
};

// This is an *ordered* list of plugins!
export const standardPlugins = {
	inputRules: buildInputRules,
	headerIds: buildHeaderIds,
	placeholder: buildPlaceholder,
	localHighlights: buildLocalHighlights,
	suggest: buildSuggest,
	domEvents: buildDomEvents,
	onChange: buildOnChange,
	gapCursor: buildGapCursor,
	history: buildHistory,
	keymap: buildKeymap,
	table: buildTable,
	collaborative: buildCollaborative,
	discussions: buildDiscussions,
	ids: buildIds,
	reactive: buildReactive,
};

const getSortedPlugins = (plugins: Record<string, null | PluginLoader>): PluginLoader[] => {
	const { onChange, ...restPlugins } = plugins;
	return Object.values({ ...restPlugins, onChange: onChange }).filter(
		(x): x is PluginLoader => !!x,
	);
};

export const getPlugins = (
	schema: Schema,
	customPlugins: Record<string, null | PluginLoader>,
	options: PluginsOptions,
) => {
	return getSortedPlugins({
		...standardPlugins,
		...customPlugins,
	})
		.map((loader) => {
			const plugins = loader(schema, options);
			return Array.isArray(plugins) ? plugins : [plugins];
		})
		.reduce((a, b) => [...a, ...b], []);
};

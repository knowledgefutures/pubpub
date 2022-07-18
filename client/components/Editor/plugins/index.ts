import { history } from 'prosemirror-history';
import { gapCursor } from 'prosemirror-gapcursor';

import { Schema } from 'prosemirror-model';
import buildCollaborative from './collaborative';
import buildDiscussions from './discussions';
import buildDomEvents from './domEvents';
import buildIds from './ids';
import buildMathTranslations from './equationsToMath';
import buildHeaderIds from './headerIds';
import buildInputRules from './inputRules';
import buildKeymap from './keymap';
import buildLocalHighlights from './localHighlights';
import buildMath from './math';
import buildOnChange from './onChange';
import buildPlaceholder from './placeholder';
import buildPaste from './paste';
import buildReactive from './reactive';
import buildTable from './table';
import buildReferences from './references';
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
	translatedMathNodes: buildMathTranslations,
	placeholder: buildPlaceholder,
	localHighlights: buildLocalHighlights,
	references: buildReferences,
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
	paste: buildPaste,
	mathPlugin: buildMath,
};

const getSortedPlugins = (plugins: Record<string, null | PluginLoader>): PluginLoader[] => {
	const { onChange, ...restPlugins } = plugins;
	return Object.values({ ...restPlugins, onChange }).filter((x): x is PluginLoader => !!x);
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

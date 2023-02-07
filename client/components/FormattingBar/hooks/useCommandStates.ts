import { useMemo } from 'react';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { mapObject } from 'utils/objects';

import { CommandSpec, CommandMenuEntry, CommandStates } from 'components/Editor/commands/types';

type CommandStateGetter = ReturnType<CommandSpec>;

type Options = {
	commands: CommandMenuEntry[][];
	view: EditorView;
	state?: EditorState;
};

const getStateGetters = (entries: CommandMenuEntry[] | CommandMenuEntry[][], view: EditorView) => {
	let res: Record<string, CommandStateGetter> = {};
	entries.forEach((entry: CommandMenuEntry | CommandMenuEntry[]) => {
		if (Array.isArray(entry)) {
			res = { ...res, ...getStateGetters(entry, view) };
		}
		if ('command' in entry && entry.command) {
			res[entry.key] = entry.command(view);
		}
		if ('commands' in entry && entry.commands) {
			res = { ...res, ...getStateGetters(entry.commands, view) };
		}
	});
	return res;
};

const getStates = (
	stateGetters: Record<string, CommandStateGetter>,
	editorState?: EditorState,
): CommandStates => {
	if (!editorState) {
		return {};
	}
	return mapObject(stateGetters, (getter) => getter(editorState));
};

export const useCommandStates = (options: Options) => {
	const { commands, view, state } = options;

	const stateGettersByKey = useMemo(() => {
		if (view) {
			return getStateGetters(commands, view);
		}
		return {};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [view]);

	const commandStates = useMemo(
		() => getStates(stateGettersByKey, state),
		[stateGettersByKey, state],
	);

	return commandStates;
};

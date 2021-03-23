import { useMemo } from 'react';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { CommandSpec, CommandState } from 'components/Editor/commands/types';

import { deepMap } from '../utils';

type CommandEntry = {
	key: string;
	command?: CommandSpec;
};

type CommandStateGetter = ReturnType<CommandSpec>;

type Options<T extends CommandEntry> = {
	commands: T[][];
	view: EditorView;
	state?: EditorState;
};

export type WithCommandState<T extends CommandEntry> = T & { commandState?: CommandState };

const getStateGetters = (entries: CommandEntry[] | CommandEntry[][], view: EditorView) => {
	let res: Record<string, CommandStateGetter> = {};
	entries.forEach((item) => {
		if (Array.isArray(item)) {
			res = { ...res, ...getStateGetters(item, view) };
		}
		if ('command' in item && item.command) {
			res[item.key] = item.command(view);
		}
	});
	return res;
};

const getState = <T extends CommandEntry>(
	commands: T[][],
	stateGetters: Record<string, CommandStateGetter>,
	editorState?: EditorState,
): WithCommandState<T>[][] => {
	if (!editorState) {
		return commands;
	}
	return deepMap(commands, (entry) => {
		const getter = stateGetters[entry.key];
		if (getter) {
			return {
				...entry,
				commandState: getter(editorState),
			};
		}
		return entry;
	});
};

export const useCommandStates = <T extends CommandEntry>(options: Options<T>) => {
	const { commands, view, state } = options;

	const stateGettersByKey = useMemo(() => {
		if (view) {
			return getStateGetters(commands, view);
		}
		return {};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [view]);

	const commandStates = useMemo(() => getState(commands, stateGettersByKey, state), [
		commands,
		stateGettersByKey,
		state,
	]);

	return commandStates;
};

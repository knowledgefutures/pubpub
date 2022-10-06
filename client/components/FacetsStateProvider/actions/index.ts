import { GetState, SetState } from 'zustand';

import { FacetsState } from '../types';
import { updateFacet } from './updateFacet';
import { persistFacets } from './persistFacets';

type ActionsArgs = [GetState<FacetsState>, SetState<FacetsState>, ...any[]];
type Action = (...args: ActionsArgs) => void | Promise<void>;

type ExtractRestArgs<ActionFn extends Action> = Parameters<ActionFn> extends [
	infer _, // get
	infer __, // set
	...infer RestArgs
]
	? RestArgs
	: never;

type BoundAction<ActionFn extends Action> = (...args: ExtractRestArgs<ActionFn>) => void;

type BoundActions<Actions extends Record<string, Action>> = {
	[K in keyof Actions]: BoundAction<Actions[K]>;
};

const actions = { updateFacet, persistFacets } as const;

export function bindActionsToStore(
	get: GetState<FacetsState>,
	set: SetState<FacetsState>,
): BoundActions<typeof actions> {
	const bound: Partial<BoundActions<typeof actions>> = {};
	Object.entries(actions).forEach(([key, action]) => {
		bound[key as any] = (...args: ExtractRestArgs<typeof action>) =>
			(action as Action)(get, set, ...args);
	});
	return bound as BoundActions<typeof actions>;
}

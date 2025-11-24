import type { FacetsStore } from './types';

import { create } from 'zustand';

import { bindActionsToStore } from './actions';
import { type CreateStateOptions, createInitialState } from './state';

export function createFacetsStateStore(options: CreateStateOptions) {
	const initialState = createInitialState(options);
	return create<FacetsStore>((set, get) => {
		const actions = bindActionsToStore(get, set);
		return { ...actions, ...initialState };
	});
}

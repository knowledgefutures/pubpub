import create from 'zustand';

import { bindActionsToStore } from './actions';
import { createInitialState, CreateStateOptions } from './state';
import { FacetsStore } from './types';

export function createFacetsStateStore(options: CreateStateOptions) {
	const initialState = createInitialState(options);
	return create<FacetsStore>((set, get) => {
		const actions = bindActionsToStore(get, set);
		return { ...actions, ...initialState };
	});
}

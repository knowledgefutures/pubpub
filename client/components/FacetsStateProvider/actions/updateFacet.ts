import { GetState, SetState } from 'zustand';

import {
	FacetDefinition,
	FacetInstanceStack,
	FacetInstanceType,
	FacetSourceScope,
	FacetName,
	Facets,
	cascade,
	parsePartialFacetInstance,
	createFacetInstance,
	FacetCascadeResult,
} from 'facets';

import { FacetsState, FacetState } from '../types';

function applyPatchToStack<Def extends FacetDefinition>(
	def: Def,
	stack: FacetInstanceStack<Def>,
	patch: Partial<FacetInstanceType<Def>>,
	scope: FacetSourceScope,
): FacetInstanceStack<Def> {
	const patchableIndex = stack.findIndex(
		(e) => e.scope.kind === scope.kind && e.scope.id === scope.id,
	);
	if (patchableIndex >= 0) {
		const entry = stack[patchableIndex];
		const { value } = entry;
		const patchedEntry = {
			...entry,
			value: { ...value, ...patch },
		};
		const nextStack = stack.concat();
		nextStack.splice(patchableIndex, 1, patchedEntry);
		return nextStack;
	}
	return [...stack, { scope, facetBindingId: null, value: createFacetInstance(def, patch) }];
}

function getInvalidProps(
	previous: Record<string, any>,
	nextInvalid: Record<string, any>,
	nextValid: Record<string, any>,
) {
	const next = { ...previous, ...nextInvalid };
	Object.keys(nextValid).forEach((key) => {
		delete next[key];
	});
	return next;
}

function getPersistableChanges<Def extends FacetDefinition>(
	persistedCascadeResult: FacetCascadeResult<Def>,
	nextCascadeResult: FacetCascadeResult<Def>,
) {
	const { stack: nextStack } = nextCascadeResult;
	const { stack: persistedStack } = persistedCascadeResult;
	const { value: nextInstance } = nextStack[nextStack.length - 1];
	const persistedInstance =
		persistedStack.length === nextStack.length
			? persistedStack[persistedStack.length - 1].value
			: null;
	const pendingChanges = { ...nextInstance };
	Object.keys(pendingChanges).forEach((key) => {
		const pendingValue = pendingChanges[key];
		const persistedValue = persistedInstance?.[key] ?? null;
		if (pendingValue === persistedValue) {
			delete pendingChanges[key];
		}
	});
	return pendingChanges;
}

function getCascadeResultForPatch<Def extends FacetDefinition>(
	def: Def,
	stack: FacetInstanceStack<Def>,
	scope: FacetSourceScope,
	patch: Partial<FacetInstanceType<Def>>,
): FacetCascadeResult<Def> {
	const nextStack = applyPatchToStack(def, stack, patch, scope);
	return cascade(def, nextStack);
}

export function updateFacet<Name extends FacetName>(
	get: GetState<FacetsState>,
	set: SetState<FacetsState>,
	name: Name,
	patch: Partial<FacetInstanceType<Facets[Name]>>,
) {
	const { facets, currentScope } = get();
	const facetState: undefined | FacetState = facets[name];
	if (!facetState) {
		return;
	}
	const {
		facetDefinition,
		cascadeResult: { stack },
		persistedCascadeResult,
		invalidProps: prevInvalidProps,
	} = facetState;
	const { valid, invalid } = parsePartialFacetInstance(facetDefinition, patch);
	const cascadeResult = getCascadeResultForPatch(facetDefinition, stack, currentScope, valid);
	const latestAndPossiblyInvalidCascadeResult = getCascadeResultForPatch(
		facetDefinition,
		stack,
		currentScope,
		patch,
	);
	const invalidProps = getInvalidProps(prevInvalidProps, invalid, valid);
	const persistableChanges = getPersistableChanges(persistedCascadeResult, cascadeResult);
	const hasPersistableChanges = Object.keys(persistableChanges).length > 0;
	const hasInvalidChanges = Object.keys(invalidProps).length === 0;
	const nextFacetState: FacetState = {
		...facetState,
		cascadeResult,
		latestAndPossiblyInvalidCascadeResult,
		invalidProps,
		persistableChanges,
		hasPersistableChanges,
		hasInvalidChanges,
	};
	const nextFacetsState = { ...facets, [name]: nextFacetState };
	const nextAnyFacetHasPendingChanges = Object.values(nextFacetsState).some(
		(state) => state?.hasPersistableChanges,
	);
	set({ facets: nextFacetsState, hasPersistableChanges: nextAnyFacetHasPendingChanges });
}

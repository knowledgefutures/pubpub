import React from 'react';

import { useLazyRef } from 'client/utils/useLazyRef';

import { MaybeHas } from 'types';
import { CreateStateOptions } from './state';
import { createFacetsStateStore } from './store';
import { FacetsContext } from './context';

type Props = {
	options: MaybeHas<CreateStateOptions, 'cascadeResults'>;
	children: React.ReactNode;
};

const FacetsStateProvider = (props: Props) => {
	const { children, options } = props;
	const useFacets = useLazyRef(() => {
		const { cascadeResults, currentScope } = options;
		if (cascadeResults) {
			return createFacetsStateStore({ cascadeResults, currentScope });
		}
		return null;
	});
	return <FacetsContext.Provider value={useFacets.current}>{children}</FacetsContext.Provider>;
};

export default FacetsStateProvider;

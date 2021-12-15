import React from 'react';

import { Collection, Page } from 'types';
import { CommunityNavigationEntry } from 'client/utils/navigation';

type NavBuilderContextType = {
	pages: Page[];
	collections: Collection[];
	updateItem: (
		dropdownId: string,
		index: number,
		update: Partial<CommunityNavigationEntry>,
	) => any;
	removeItem: (itemId: string, dropdownId: string) => any;
};

export const NavBuilderContext = React.createContext<NavBuilderContextType>(
	{} as NavBuilderContextType,
);

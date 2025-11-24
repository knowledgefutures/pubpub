import type { Collection, Page } from 'types';
import type { CommunityNavigationEntry } from 'types/navigation';

import React from 'react';

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

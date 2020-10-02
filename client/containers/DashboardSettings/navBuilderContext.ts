import React from 'react';

import { Collection, Page, CommunityNavigationEntry } from 'client/utils/navigation';

type NavBuilderContext = {
	pages: Page[];
	collections: Collection[];
	updateItem: (
		dropdownId: string,
		index: number,
		update: Partial<CommunityNavigationEntry>,
	) => any;
	removeItem: (itemId: string, dropdownId: string) => any;
};

export const NavBuilderContext = React.createContext<NavBuilderContext>({} as NavBuilderContext);

export const superAdminTabKinds = ['landingPageFeatures', 'spam'] as const;

export const getSuperAdminTabUrl = (tabKind: SuperAdminTabKind) => {
	return `/superadmin/${tabKind}` as const;
};

export const isSuperAdminTabKind = (tabKind: string): tabKind is SuperAdminTabKind =>
	superAdminTabKinds.includes(tabKind as any);

export type SuperAdminTabKind = typeof superAdminTabKinds[number];

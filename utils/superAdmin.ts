export const superAdminTabKinds = ['landingPageFeatures', 'spam'] as const;

export const getSuperAdminTabUrl = (tabKind: SuperAdminTabKind) => {
	return `/superadmin/${tabKind}` as const;
};

export type SuperAdminTabKind = typeof superAdminTabKinds[number];

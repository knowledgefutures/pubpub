export const superAdminTabKinds = ['landingPageFeatures'] as const;

export const getSuperAdminTabUrl = (tabKind: SuperAdminTabKind) => {
	return `/superadmin/${tabKind}` as const;
};

export type SuperAdminTabKind = typeof superAdminTabKinds[number];

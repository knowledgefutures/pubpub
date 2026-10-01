export type FlagSummary = {
	id: string;
	name: string;
	enabledUsersFraction: number;
	enabledCommunitiesFraction: number;
	overrides: {
		communitiesOn: number;
		communitiesOff: number;
		usersOn: number;
		usersOff: number;
	};
};

export type CommunityOverride = {
	communityId: string;
	enabled: boolean;
	title: string;
	subdomain: string;
};

export type UserOverride = {
	userId: string;
	enabled: boolean;
	fullName: string;
	slug: string;
	avatar: string | null;
	initials: string;
};

export type OverridesPayload = {
	communities: CommunityOverride[];
	users: UserOverride[];
};

export const countOverrides = (overrides: OverridesPayload): FlagSummary['overrides'] => ({
	communitiesOn: overrides.communities.filter((o) => o.enabled).length,
	communitiesOff: overrides.communities.filter((o) => !o.enabled).length,
	usersOn: overrides.users.filter((o) => o.enabled).length,
	usersOff: overrides.users.filter((o) => !o.enabled).length,
});

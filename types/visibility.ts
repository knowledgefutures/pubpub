export type VisibilityUser = {
	id: string;
	visibilityId: string;
	userId: string;
};

export type Visibility = {
	id: string;
	access: 'private' | 'members' | 'public';
	users: VisibilityUser[];
};

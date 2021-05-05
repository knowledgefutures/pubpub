export type ThreadComment = {
	id: string;
	text: string;
	content: {};
	userId: string;
	threadId: string;
};

export type Thread = {
	id: string;
	updatedAt: string;
	createdAt: string;
	locked?: boolean;
	comments: ThreadComment[];
};

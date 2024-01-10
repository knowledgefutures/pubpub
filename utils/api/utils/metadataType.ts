export type Metadata = Partial<{
	/** When was this API introduced in the client */
	since: `v${number}.${number}.${number}`;
	/**
	 * Whether you need to be logged in to use this API
	 *
	 * Admin means you need to be logged in as an admin
	 */
	loggedIn: 'true' | 'false' | 'admin';
	/** An example on how to use the method in the client */
	example: string;
}>;

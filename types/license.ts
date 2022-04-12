export type License = {
	slug: string;
	full: string;
	short: string;
	version: string | null;
	link: string | null;
	requiresPremium?: true;
};

export type RenderedLicense = License & {
	summary?: string;
};

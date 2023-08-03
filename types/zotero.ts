export type ZoteroIntegration = {
	id: string;
	userId: string;
	zoteroUsername: string;
	zoteroUserId: string;
	integrationDataOAuth1Id: string;
};

export type ZoteroCSLJSON = {
	meta: {
		parsedDate: string;
		creatorSummary: string;
	};
	bib: string;
	bibtex: string;
	structured: string;
	key: string;
};

// citations style keys as recognized by Zotero
export type ZoteroStyleKind =
	| 'acm-siggraph'
	| 'american-anthropological-association'
	| 'apa-6th-edition'
	| 'apa'
	| 'arcadia-science'
	| 'cell'
	| 'chicago-note-bibliography'
	| 'harvard-cite-them-right'
	| 'elife'
	| 'frontiers'
	| 'modern-language-association'
	| 'vancouver'
	| 'american-medical-association';

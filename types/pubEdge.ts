import { Pub } from './pub';

export type ExternalPublication = {
	id: string;
	title: string;
	url: string;
	contributors?: string[];
	doi?: string;
	description?: string;
	avatar?: string;
	publicationDate?: string;
};

export type PubEdge = {
	id: string;
	pubId: string;
	externalPublicationId?: number;
	targetPubId?: string;
	relationType: string;
	rank: string;
	pubIsParent: boolean;
	approvedByTarget: boolean;
	externalPublication?: ExternalPublication;
	targetPub?: Pub;
	pub?: Pub;
};

export type OutboundEdge = Omit<PubEdge, 'pub'>;
export type InboundEdge = Omit<PubEdge, 'targetPub'>;

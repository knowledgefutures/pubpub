import {
	ExternalPublication as ExternalPublicationModel,
	PubEdge as PubEdgeModel,
} from 'server/models';
import { SerializedModel } from './serializedModel';

export type ExternalPublication = SerializedModel<ExternalPublicationModel>;

export type PubEdge = SerializedModel<PubEdgeModel>;

export type OutboundEdge = Omit<PubEdge, 'pub'>;
export type InboundEdge = Omit<PubEdge, 'targetPub'>;

export enum ReferenceableNodeType {
	Image = 'image',
	Video = 'video',
	Audio = 'audio',
	Table = 'table',
	BlockEquation = 'block_equation',
}

export const referenceableNodeTypes = Object.values(ReferenceableNodeType);

export type NodeLabel = {
	enabled: boolean;
	text: string;
};

// export type NodeLabelMap = {
// 	[nodeType in ReferenceableNodeType]?: NodeLabel;
// };

export type NodeLabelMap = Record<ReferenceableNodeType, NodeLabel>;

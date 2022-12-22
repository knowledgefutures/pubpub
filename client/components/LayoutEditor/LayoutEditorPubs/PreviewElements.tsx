import React from 'react';
import { Card, Checkbox } from '@blueprintjs/core';

import { LayoutBlockPubs } from 'utils/layout';

type Content = LayoutBlockPubs['content'];

type Props = {
	content: Content;
	onChangeContent: (nextContent: Partial<Content>) => unknown;
};

type PreviewElementField =
	| 'hideByline'
	| 'hideContributors'
	| 'hideDates'
	| 'hideDescription'
	| 'hideEdges';

const labelsForPreviewElementFields: Record<PreviewElementField, string> = {
	hideByline: 'Attributions',
	hideContributors: 'Contributors',
	hideDates: 'Dates',
	hideDescription: 'Description',
	hideEdges: 'Connections',
};

const deriveFieldStatus = (content: Content, field: PreviewElementField) => {
	const { pubPreviewType } = content;
	const fieldValue = content[field];
	const disabledBecauseMinimal =
		pubPreviewType === 'minimal' &&
		(field === 'hideDescription' || field === 'hideDates' || field === 'hideContributors');
	return {
		hidden: disabledBecauseMinimal ? true : fieldValue,
		disabled: disabledBecauseMinimal,
	};
};

const PreviewElements = (props: Props) => {
	const { content, onChangeContent } = props;

	return (
		<Card className="layout-editor-pubs_preview-elements-component">
			{Object.entries(labelsForPreviewElementFields).map((entry) => {
				const [field, label] = entry;
				const { disabled, hidden } = deriveFieldStatus(
					content,
					field as PreviewElementField,
				);
				return (
					<Checkbox
						key={field}
						disabled={disabled}
						label={label}
						checked={!hidden}
						onChange={() => onChangeContent({ [field]: !hidden })}
					/>
				);
			})}
		</Card>
	);
};

export default PreviewElements;

import React from 'react';
import { Card, Checkbox } from '@blueprintjs/core';

import { LayoutBlockCollectionHeader } from 'utils/layout';

type Content = LayoutBlockCollectionHeader['content'];

type Props = {
	content: Content;
	onChange: (nextContent: Partial<Content>) => unknown;
};

const PreviewElements = (props: Props) => {
	const { content, onChange } = props;
	const { hideCollectionKind, hideByline, hideContributors, hideDate } = content;

	return (
		<Card className="layout-editor-pubs_preview-elements-component">
			<Checkbox
				checked={!hideByline}
				onChange={() => onChange({ hideByline: !hideByline })}
				label="Attributions"
			/>
			<Checkbox
				disabled={hideByline}
				checked={hideByline ? false : !hideContributors}
				onChange={() => onChange({ hideContributors: !hideContributors })}
				label="Contributors"
			/>
			<Checkbox
				checked={!hideCollectionKind}
				onChange={() => onChange({ hideCollectionKind: !hideCollectionKind })}
				label="Collection kind"
			/>
			<Checkbox
				checked={!hideDate}
				onChange={() => onChange({ hideDate: !hideDate })}
				label="Creation date"
			/>
		</Card>
	);
};

export default PreviewElements;

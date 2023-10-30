import React, { useCallback } from 'react';
import { Button } from '@blueprintjs/core';

import { Popover } from 'components';
import { LayoutCollectionHeader } from 'components/Layout';
import { Collection } from 'types';
import { LayoutBlockCollectionHeader } from 'types/layout';
import Metadata from './getMetaDataChecklist';
import PreviewElements from './PreviewElements';

type Content = LayoutBlockCollectionHeader['content'];

type Props = {
	onChange: (index: number, content: Partial<Content>) => any;
	layoutIndex: number;
	block: LayoutBlockCollectionHeader;
	collection: Collection;
};

const LayoutEditorCollectionHeader = (props: Props) => {
	const { onChange: fullOnChange, layoutIndex, block, collection } = props;

	const onChange = useCallback(
		(update: Partial<Content>) => fullOnChange(layoutIndex, update),
		[fullOnChange, layoutIndex],
	);

	const renderPreviewElements = () => {
		return (
			<Popover
				aria-label="Choose preview elements"
				content={<PreviewElements content={block.content} onChange={onChange} />}
			>
				<Button outlined icon="layout-grid" rightIcon="caret-down">
					Detail fields
				</Button>
			</Popover>
		);
	};

	const renderMetadataElements = () => {
		return (
			<Popover
				aria-label="Choose metadata elements"
				content={
					<Metadata content={block.content} collection={collection} onChange={onChange} />
				}
			>
				<Button outlined icon="property" rightIcon="caret-down">
					Metadata fields
				</Button>
			</Popover>
		);
	};

	return (
		<div className="layout-editor-collection-header-component">
			<div className="block-header rows">
				<div className="controls-row">
					{renderPreviewElements()}
					{collection.kind !== 'tag' && renderMetadataElements()}
				</div>
			</div>
			<LayoutCollectionHeader collection={collection} content={block.content} />
		</div>
	);
};
export default LayoutEditorCollectionHeader;

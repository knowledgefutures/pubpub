import React, { useState, useRef } from 'react';
import { AnchorButton, InputGroup } from '@blueprintjs/core';
import { Node } from 'prosemirror-model';
import uuid from 'uuid';

import { Icon } from 'components';
import { s3Upload } from 'client/utils/upload';

type Props = {
	updateNode: (attrs: Node['attrs']) => unknown;
	selectedNode: Node;
};

const SourceControls = (props: Props) => {
	const { selectedNode, updateNode } = props;
	const { attrs } = selectedNode;
	const [isUploading, setIsUploading] = useState(false);
	const [urlSource, setUrlSource] = useState(attrs.url);
	const inputKey = useRef(uuid.v4());
	const useUrlInput = selectedNode.type.name === 'iframe';

	const handleStartUpload = (evt) => {
		const { files } = evt.target;
		if (files.length > 0) {
			const [file] = files;
			s3Upload(
				file,
				() => {},
				(_, __, ___, filename) => {
					setIsUploading(false);
					updateNode({ url: `https://assets.pubpub.org/${filename}` });
				},
			);
			setIsUploading(true);
		}
	};

	const renderFileSourceControl = () => {
		return (
			<label htmlFor={inputKey.current} className="file-select">
				<AnchorButton
					icon={<Icon icon="edit2" iconSize={16} />}
					minimal={true}
					loading={isUploading}
					aria-label="Upload new source file"
				/>
				<input
					id={inputKey.current}
					style={{ display: 'none' }}
					name="image"
					type="file"
					accept="image/png, image/jpeg, image/gif, image/svg+xml"
					onChange={handleStartUpload}
					className="file-input"
				/>
			</label>
		);
	};

	const renderUrlSourceControl = () => {
		return (
			<InputGroup
				value={urlSource}
				onChange={(evt) => setUrlSource(evt.target.value)}
				onBlur={() => updateNode({ url: urlSource })}
				placeholder="Enter URL..."
			/>
		);
	};

	return (
		<div className="controls-row">
			<div className="left-label">Source</div>
			<div className="controls">
				{!useUrlInput && (
					<AnchorButton
						aria-label="Download source file"
						icon={<Icon icon="download" iconSize={16} />}
						minimal={true}
						href={attrs.url}
						target="_blank"
						rel="noopener noreferrer"
					/>
				)}
				{useUrlInput ? renderUrlSourceControl() : renderFileSourceControl()}
			</div>
		</div>
	);
};
export default SourceControls;

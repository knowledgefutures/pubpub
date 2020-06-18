import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { AnchorButton, InputGroup } from '@blueprintjs/core';
import uuid from 'uuid';

import { Icon } from 'components';
import { s3Upload } from 'client/utils/upload';

const propTypes = {
	updateNode: PropTypes.func.isRequired,
	isSmall: PropTypes.bool.isRequired,
	selectedNode: PropTypes.shape({
		type: PropTypes.shape({
			name: PropTypes.string.isRequired,
		}).isRequired,
		attrs: PropTypes.shape({
			url: PropTypes.string.isRequired,
		}),
	}).isRequired,
};

const SourceControls = (props) => {
	const { isSmall, selectedNode, updateNode } = props;
	const { attrs } = selectedNode;
	const iconSize = isSmall ? 12 : 16;
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
					icon={<Icon icon="edit2" iconSize={iconSize} />}
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
						icon={<Icon icon="download" iconSize={iconSize} />}
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

SourceControls.propTypes = propTypes;
export default SourceControls;

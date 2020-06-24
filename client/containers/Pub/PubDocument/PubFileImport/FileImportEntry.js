import React from 'react';
import PropTypes from 'prop-types';
import {
	Icon,
	ProgressBar,
	Tag,
	Button,
	Popover,
	Menu,
	MenuItem,
	Classes,
} from '@blueprintjs/core';

import { getPotentialLabelsForFile } from './formats';

const propTypes = {
	file: PropTypes.shape({
		clientPath: PropTypes.string,
		state: PropTypes.string,
		loaded: PropTypes.number,
		total: PropTypes.number,
		label: PropTypes.string,
	}).isRequired,
	onLabelFile: PropTypes.func.isRequired,
	onDelete: PropTypes.func.isRequired,
};

require('./fileImportEntry.scss');

const FileImportEntry = (props) => {
	const { file, onDelete, onLabelFile } = props;
	const { loaded, total, state, clientPath, label } = file;
	const displayTitleBreak = Math.max(clientPath.length - 5, 0);
	const displayTitleStart = clientPath.slice(0, displayTitleBreak);
	const displayTitleEnd = clientPath.slice(displayTitleBreak);

	const renderProgressContent = () => {
		if (state === 'complete') {
			return (
				<React.Fragment>
					<Icon icon="tick" iconSize={14} />
					Uploaded
				</React.Fragment>
			);
		}
		if (state === 'waiting') {
			return 'Preparing to upload';
		}
		return (
			<React.Fragment>
				<span className="screenreader-only">
					{Math.round((100 * loaded) / total)}% complete
				</span>
				<ProgressBar value={state === 'uploading' ? loaded / total : undefined} />
			</React.Fragment>
		);
	};

	const renderLabel = () => {
		const potentialLabels = getPotentialLabelsForFile(file);
		const hasLabel = label && label !== 'none';
		if (potentialLabels.length === 0) {
			return null;
		}
		return (
			<Popover
				content={
					<Menu>
						<h6 className={Classes.MENU_HEADER}>Use as...</h6>
						{['none', ...potentialLabels].map((potentialLabel) => {
							const text = potentialLabel === 'none' ? <i>(none)</i> : potentialLabel;
							return (
								<MenuItem
									key={text}
									text={text}
									onClick={() => onLabelFile(potentialLabel)}
								/>
							);
						})}
					</Menu>
				}
			>
				{hasLabel ? (
					<Tag interactive intent="success">
						{label}
					</Tag>
				) : (
					<Tag interactive icon="locate">
						use as...
					</Tag>
				)}
			</Popover>
		);
	};

	return (
		<div className="file-import-entry">
			<div className="file-title" title={clientPath}>
				<span className="start" aria-label={clientPath}>
					<span aria-hidden="true">{displayTitleStart}</span>
				</span>
				<span className="end" aria-hidden="true">
					{displayTitleEnd}
				</span>
				<div className="file-label">{renderLabel()}</div>
			</div>
			<div className="file-progress">{renderProgressContent()}</div>
			<Button
				aria-label="delete"
				onClick={onDelete}
				className="file-delete-button"
				icon="small-cross"
				small
				minimal
			/>
		</div>
	);
};

FileImportEntry.propTypes = propTypes;
export default FileImportEntry;

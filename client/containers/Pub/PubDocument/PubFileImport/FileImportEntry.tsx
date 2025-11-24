import type { BaseSourceFile } from 'utils/api/schemas/import';

import React from 'react';

import {
	Button,
	Classes,
	Icon,
	Menu,
	MenuItem,
	Popover,
	ProgressBar,
	Tag,
} from '@blueprintjs/core';

import { getPotentialLabelsForFile } from './formats';

import './fileImportEntry.scss';

type Props = {
	// file: {
	// 	clientPath?: string;
	// 	state?: string;
	// 	loaded?: number;
	// 	total?: number;
	// 	label?: string;
	// };
	file: BaseSourceFile;
	onLabelFile: (...args: any[]) => any;
	onDelete: (...args: any[]) => any;
};

const FileImportEntry = (props: Props) => {
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
									// @ts-expect-error ts-migrate(2322) FIXME: Type 'string | false | Element' is not assignable ... Remove this comment to see the full error message
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
				<span className="start">
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
export default FileImportEntry;

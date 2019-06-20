import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button, ButtonGroup, Tooltip, Intent } from '@blueprintjs/core';
import { apiFetch } from 'utils';
import { pingTask } from 'utils/pingTask';
import { getFormattedDownload, getExistingDownload } from 'containers/Pub/pubUtils';

require('./download.scss');

const propTypes = {
	pubData: PropTypes.object.isRequired,
};

const formatTypes = [
	{ format: 'pdf', title: 'PDF' },
	{ format: 'docx', title: 'Word' },
	{ format: 'markdown', title: 'Markdown' },
	{ format: 'epub', title: 'EPUB' },
	{ format: 'html', title: 'HTML' },
	{ format: 'odt', title: 'OpenDocument' },
	{ format: 'plain', title: 'Plain Text' },
	{ format: 'jats', title: 'JATS XML' },
	{ format: 'tex', title: 'LaTeX' },
];

const Download = (props) => {
	const { pubData } = props;

	const { downloads: maybeDownloads, activeBranch } = pubData;
	const downloads = maybeDownloads || [];
	const [isLoading, setIsLoading] = useState(false);
	const [isError, setIsError] = useState(false);
	const [selectedType, setSelectedType] = useState(undefined);

	useEffect(() => {
		if (!isLoading) {
			return;
		}
		setIsError(false);
		// Check if that format is available for download -- if not, request it from the server.
		const existingDownload = getExistingDownload(downloads, activeBranch.id, selectedType);
		if (existingDownload) {
			setIsLoading(false);
			window.open(existingDownload.url);
			return;
		}
		// Kicks off an export task on the backend
		apiFetch('/api/export', {
			method: 'POST',
			body: JSON.stringify({
				pubId: pubData.id,
				branchId: activeBranch.id,
				format: selectedType.format,
			}),
		})
			.then((newTaskId) => pingTask(newTaskId, 1500))
			.then((taskOutput) => {
				setIsLoading(false);
				window.open(taskOutput.url);
			})
			.catch(() => {
				setIsError(true);
				setIsLoading(false);
			});
	}, [pubData.id, activeBranch.id, downloads, isLoading, selectedType]);

	const formattedDownload = getFormattedDownload(downloads);
	return (
		<div className="pub-download-component">
			{formattedDownload && (
				<React.Fragment>
					<h5>Author Generated Download</h5>
					<Button
						className="formatted-button"
						intent={Intent.PRIMARY}
						text={`Formatted ${formattedDownload.url
							.split('.')
							.pop()
							.toUpperCase()}`}
						loading={isLoading && selectedType.format === 'formatted'}
						onClick={() => window.open(formattedDownload.url)}
					/>
				</React.Fragment>
			)}
			{formattedDownload && <h5>Auto Generated Download</h5>}
			<ButtonGroup vertical={true}>
				{formatTypes.map((type) => (
					<Tooltip
						key={type.format}
						isOpen={isError && selectedType.format === type.format}
						content="There was a problem generating the file."
					>
						<Button
							disabled={isLoading && selectedType.format !== type.format}
							loading={isLoading && selectedType.format === type.format}
							onClick={() => {
								setSelectedType(type);
								setIsError(false);
								setIsLoading(true);
							}}
							text={type.title}
						/>
					</Tooltip>
				))}
			</ButtonGroup>
		</div>
	);
};

Download.propTypes = propTypes;
export default Download;

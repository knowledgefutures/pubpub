import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Tooltip, Icon, Menu, MenuItem, Spinner } from '@blueprintjs/core';
import { apiFetch } from 'utils';
import { pingTask } from 'utils/pingTask';
import { getFormattedDownload } from './headerUtils';

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
	}, [isLoading, selectedType, pubData.id, activeBranch.id]);

	const formattedDownload = getFormattedDownload(downloads);
	const formattedOptionsClassName = formattedDownload ? 'with-formatted' : '';
	return (
		<div className={`pub-download-component ${formattedOptionsClassName}`}>
			<Menu>
				{formattedDownload && (
					<React.Fragment>
						<li className="bp3-menu-header">
							<h6 className="bp3-heading">Formatted Download</h6>
						</li>
						<MenuItem
							shouldDismissPopover={false}
							labelElement={<Icon icon="star" />}
							className="formatted-button"
							// intent={Intent.PRIMARY}
							text={`Formatted ${formattedDownload.url
								.split('.')
								.pop()
								.toUpperCase()}`}
							loading={isLoading && selectedType.format === 'formatted'}
							onClick={() => window.open(formattedDownload.url)}
							rel="nofollow"
						/>
					</React.Fragment>
				)}
				<li className="bp3-menu-header">
					<h6 className="bp3-heading">
						{formattedDownload ? 'Auto Generated Download' : 'Download'}
					</h6>
				</li>
				{formatTypes.map((type, i) => (
					<MenuItem
						// eslint-disable-next-line react/no-array-index-key
						key={`${i}-${type.format}`}
						shouldDismissPopover={false}
						disabled={isLoading && selectedType.format !== type.format}
						// loading={isLoading && selectedType.format === type.format}
						labelElement={
							<span>
								{isLoading && selectedType.format === type.format && (
									<Spinner size={Spinner.SIZE_SMALL} />
								)}
							</span>
						}
						onClick={() => {
							setSelectedType(type);
							setIsError(false);
							setIsLoading(true);
						}}
						rel="nofollow"
						text={
							<Tooltip
								key={type.format}
								isOpen={isError && selectedType.format === type.format}
								content="There was a problem generating the file."
							>
								{type.title}
							</Tooltip>
						}
					/>
				))}
			</Menu>
		</div>
	);
};

Download.propTypes = propTypes;
export default Download;

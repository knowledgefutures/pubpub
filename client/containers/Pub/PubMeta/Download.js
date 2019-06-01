import React, { useContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import dateFormat from 'dateformat';
import { Button, ButtonGroup, Menu, MenuItem, Popover, Tooltip } from '@blueprintjs/core';

import { FileUploadButton } from 'components';
import { PageContext } from 'components/PageWrapper/PageWrapper';
import { apiFetch } from 'utils';
import { pingTask } from 'utils/pingTask';

require('./download.scss');

const propTypes = {
	pubData: PropTypes.object.isRequired,
	updateLocalData: PropTypes.func.isRequired,
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

// The "formatted download" is the file that the pub manager can upload themselves to represent the
// pub. It's stored in pub.downloads, but it's treated as a kind of special case.
const getFormattedDownload = (downloads) => {
	return downloads.reduce((prev, curr) => {
		const currIsNewer = !prev || !prev.createdAt || curr.createdAt > prev.createdAt;
		if (curr.type === 'formatted' && currIsNewer) {
			return curr;
		}
		return prev;
	}, null);
};

// Finds a download for the given branchId and formatType
const getExistingDownload = (downloads, branchId, formatType) => {
	return downloads.find((download) => {
		const sameBranch = download.branchId === branchId;
		const sameType = download.type === formatType.format;
		return sameType && sameBranch;
	});
};

// Updates the pub's downloads list, both locally and on the server
const updateDownloads = (type, fileUrl, pubData, communityData, updateLocalData) => {
	if (type !== 'formatted' && !pubData.activeBranch.id) {
		return null;
	}
	const downloadItem = {
		type: type,
		url: fileUrl,
		branchId: type === 'formatted' ? null : pubData.activeBranch.id,
		createdAt: new Date(),
	};
	const prevDownloads = pubData.downloads || [];
	const newDownloads = [...prevDownloads, downloadItem];
	return apiFetch('/api/pubs', {
		method: 'PUT',
		body: JSON.stringify({
			downloads: newDownloads,
			pubId: pubData.id,
			communityId: communityData.id,
		}),
	})
		.then(() => {
			updateLocalData('pub', {
				downloads: newDownloads,
			});
		})
		.catch((err) => {
			console.error('Error Saving Pub Downloads: ', err);
		});
};

// Kicks off an export task on the backend
const startExportTask = (pubId, branchId, format) =>
	apiFetch('/api/export', {
		method: 'POST',
		body: JSON.stringify({
			pubId: pubId,
			branchId: branchId,
			format: format,
		}),
	});

const FormattedDownloadView = (props) => {
	const { formattedDownload, onUpdateDownloads, shouldShowUploadForm } = props;
	const { url = '', date } = formattedDownload || {};
	const extension = url
		.split('.')
		.pop()
		.toLowerCase();
	return (
		<div>
			<h5>Custom download</h5>
			{shouldShowUploadForm ? (
				<p>
					You can upload a file, like a PDF with custom styling, to associate with this
					pub. It will be provided to readers as the pub's default download, but they'll
					still be able to use the automatic export tools.
				</p>
			) : (
				<p>
					The Pub manager has provided a custom version of this pub that you can download.
				</p>
			)}
			<div className="buttons-wrapper">
				{formattedDownload && (
					<div>
						<Button
							text={`Download ${extension.toUpperCase()}`}
							onClick={() => window.open(url)}
						/>
						<div className="subtext">Uploaded {dateFormat(date, 'mmm dd, yyyy')}</div>
					</div>
				)}
				{shouldShowUploadForm && (
					<FileUploadButton
						onUploadFinish={onUpdateDownloads}
						className="typset-button"
						text="Upload new file"
					/>
				)}
			</div>
		</div>
	);
};

FormattedDownloadView.propTypes = {
	formattedDownload: PropTypes.oneOf([
		null,
		PropTypes.shape({
			date: PropTypes.string,
			extension: PropTypes.string,
			url: PropTypes.string,
		}),
	]).isRequired,
	onUpdateDownloads: PropTypes.func.isRequired,
	shouldShowUploadForm: PropTypes.bool.isRequired,
};

const Download = (props) => {
	const { pubData, updateLocalData } = props;
	const {
		canManage,
		downloads: maybeDownloads,
		activeBranch: { id: branchId },
		id: pubId,
	} = pubData;
	const downloads = maybeDownloads || [];
	const [isLoading, setIsLoading] = useState(false);
	const [isError, setIsError] = useState(false);
	const [selectedType, setSelectedType] = useState(formatTypes[0]);
	const { communityData } = useContext(PageContext);
	const formattedDownload = getFormattedDownload(downloads);

	const updateDownloadsHere = useCallback(
		(format, url) => updateDownloads(format, url, pubData, communityData, updateLocalData),
		[pubData, communityData, updateLocalData],
	);

	useEffect(() => {
		if (!isLoading) {
			return;
		}
		setIsError(false);
		// Check if that format is available for download -- if not, request it from the server.
		const existingDownload = getExistingDownload(downloads, branchId, selectedType);
		if (existingDownload) {
			setIsLoading(false);
			window.open(existingDownload.url);
			return;
		}
		startExportTask(pubId, branchId, selectedType.format)
			.then((newTaskId) => pingTask(newTaskId, 1500))
			.then((taskOutput) => {
				setIsLoading(false);
				window.open(taskOutput.url);
			})
			.catch(() => {
				setIsError(true);
				setIsLoading(false);
			});
	}, [branchId, downloads, isLoading, pubId, selectedType, updateDownloadsHere]);

	return (
		<div className="pub-meta_download-component">
			{(canManage || formattedDownload) && (
				<div className="formatted-download-option">
					<FormattedDownloadView
						formattedDownload={formattedDownload}
						shouldShowUploadForm={canManage}
						onUpdateDownloads={(fileUrl) => updateDownloadsHere('formatted', fileUrl)}
					/>
				</div>
			)}
			<div className="export-option">
				<h5>Download Generated File</h5>
				<p>Auto-generated files based on pub content.</p>
				<ButtonGroup>
					<Tooltip isOpen={isError} content="There was a problem generating the file.">
						<Button loading={isLoading} onClick={() => setIsLoading(true)}>
							Download as {selectedType.title}
						</Button>
					</Tooltip>
					<Popover
						content={
							<Menu>
								{formatTypes.map((type) => (
									<MenuItem
										key={type.format}
										active={selectedType.format === type.format}
										onClick={() => {
											setSelectedType(type);
											setIsError(false);
										}}
										text={type.title}
									/>
								))}
							</Menu>
						}
					>
						<Button disabled={isLoading} icon="chevron-down" />
					</Popover>
				</ButtonGroup>
			</div>
		</div>
	);
};

Download.propTypes = propTypes;
export default Download;

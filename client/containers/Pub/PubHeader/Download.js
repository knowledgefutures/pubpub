import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button, Icon, Spinner, Tooltip } from '@blueprintjs/core';

import { Menu, MenuItem } from 'components/Menu';
import { apiFetch } from 'client/utils/apiFetch';
import { pingTask } from 'client/utils/pingTask';
import { usePageContext } from 'utils/hooks';

import { usePubHistory } from '../pubHooks';
import { getFormattedDownload } from './headerUtils';

require('./download.scss');

const propTypes = {
	pubData: PropTypes.object.isRequired,
	children: PropTypes.node.isRequired,
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

const mustShowDownloadButton = () => navigator.userAgent.match(/iP(ad|hone|od)/i);

const Download = (props) => {
	const { pubData, children } = props;
	const { downloads = [], activeBranch } = pubData;
	const [isLoading, setIsLoading] = useState(false);
	const [isError, setIsError] = useState(false);
	const [selectedType, setSelectedType] = useState(null);
	const [downloadUrl, setDownloadUrl] = useState(null);
	const { latestKey } = usePubHistory();
	const { communityData, locationData } = usePageContext();
	const formattedDownload = getFormattedDownload(downloads);

	const download = (url) => {
		setIsLoading(false);
		setDownloadUrl(null);
		window.open(url);
	};

	const handleStartDownload = (type) => {
		const matchingExport = pubData.activeBranch.exports.find(
			(ex) => ex.format === type.format && ex.historyKey >= latestKey,
		);
		if (matchingExport && matchingExport.url) {
			download(matchingExport.url);
		} else {
			setSelectedType(type);
			setIsError(false);
			setIsLoading(true);
		}
	};

	useEffect(() => {
		const downloadOrShowButton = (url) => {
			if (mustShowDownloadButton()) {
				setDownloadUrl(url);
				setIsLoading(false);
			} else {
				download(url);
			}
		};

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
				communityId: communityData.id,
				format: selectedType.format,
				historyKey: latestKey,
				accessHash: locationData.query.access,
			}),
		}).then(({ taskId, url }) => {
			if (url) {
				downloadOrShowButton(url);
			} else if (taskId) {
				pingTask(taskId, 1500)
					.then(({ url: laterUrl }) => downloadOrShowButton(laterUrl))
					.catch(() => {
						setIsError(true);
						setIsLoading(false);
					});
			}
		});
	}, [
		isLoading,
		selectedType,
		pubData.id,
		activeBranch.id,
		latestKey,
		locationData.query.access,
		communityData.id,
	]);

	return (
		<Menu
			disclosure={children}
			className="pub-download-component"
			aria-label="Pub download formats"
			placement="bottom-end"
		>
			{formattedDownload && (
				<React.Fragment>
					<li className="bp3-menu-header">
						<h6 className="bp3-heading">Formatted Download</h6>
					</li>
					<MenuItem
						dismissOnClick={false}
						labelElement={<Icon icon="star" />}
						className="formatted-button"
						// intent={Intent.PRIMARY}
						text={`Formatted ${formattedDownload.url
							.split('.')
							.pop()
							.toUpperCase()}`}
						loading={isLoading && selectedType.format === 'formatted'}
						onClick={() => window.open(formattedDownload.url)}
					/>
				</React.Fragment>
			)}
			<li className="bp3-menu-header">
				<h6 className="bp3-heading">
					{formattedDownload ? 'Auto Generated Download' : 'Download'}
				</h6>
			</li>
			{formatTypes.map((type, i) => {
				const shouldRenderButton = downloadUrl && selectedType.format === type.format;
				return (
					<MenuItem
						// eslint-disable-next-line react/no-array-index-key
						key={`${i}-${type.format}`}
						dismissOnClick={false}
						disabled={isLoading && selectedType.format !== type.format}
						// loading={isLoading && selectedType.format === type.format}
						rightElement={
							<span>
								{isLoading && selectedType.format === type.format && (
									<Spinner size={Spinner.SIZE_SMALL} />
								)}
							</span>
						}
						onClick={() => handleStartDownload(type)}
						text={
							<Tooltip
								key={type.format}
								isOpen={isError && selectedType.format === type.format}
								content="There was a problem generating the file."
							>
								{shouldRenderButton ? (
									<Button icon="download" onClick={() => download(downloadUrl)}>
										Download {type.title} file
									</Button>
								) : (
									type.title
								)}
							</Tooltip>
						}
					/>
				);
			})}
		</Menu>
	);
};

Download.propTypes = propTypes;
export default Download;

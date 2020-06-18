import React from 'react';
import PropTypes from 'prop-types';
import dateFormat from 'dateformat';
import { Button, ButtonGroup } from '@blueprintjs/core';

import { FileUploadButton } from 'components';
import { getFormattedDownload } from 'containers/Pub/PubHeader/headerUtils';
import { apiFetch } from 'client/utils/apiFetch';

const propTypes = {
	pubData: PropTypes.shape({
		id: PropTypes.string,
		downloads: PropTypes.array,
	}).isRequired,
	communityId: PropTypes.string.isRequired,
	onSetDownloads: PropTypes.func.isRequired,
};

const DownloadChooser = (props) => {
	const { communityId, pubData, onSetDownloads } = props;

	const formattedDownload = getFormattedDownload(pubData.downloads);
	const { url = '', date } = formattedDownload || {};
	const extension = url
		.split('.')
		.pop()
		.toLowerCase();

	const updateDownloads = (fileUrl) => {
		const downloadItem = {
			type: 'formatted',
			url: fileUrl,
			branchId: null,
			createdAt: new Date(),
		};
		const prevDownloads = pubData.downloads || [];
		const newDownloads = [...prevDownloads, downloadItem];
		return apiFetch('/api/pubs', {
			method: 'PUT',
			body: JSON.stringify({
				downloads: newDownloads,
				pubId: pubData.id,
				communityId: communityId,
			}),
		})
			.then(() => onSetDownloads(newDownloads))
			.catch((err) => console.error('Error Saving Pub Downloads: ', err));
	};

	return (
		<div className="download-chooser-component">
			<p>
				You can upload a file, like a PDF with custom styling, to associate with this pub.
				It will be provided to readers as the pub's default download, but they'll still be
				able to use the automatic export tools.
			</p>
			<ButtonGroup>
				<FileUploadButton onUploadFinish={updateDownloads} text="Upload new file" />
				{formattedDownload && (
					<div style={{ marginLeft: '1em' }}>
						<Button
							text={`Download ${extension.toUpperCase()}`}
							onClick={() => window.open(url)}
						/>
						<div className="subtext">Uploaded {dateFormat(date, 'mmm dd, yyyy')}</div>
					</div>
				)}
			</ButtonGroup>
		</div>
	);
};

DownloadChooser.propTypes = propTypes;
export default DownloadChooser;

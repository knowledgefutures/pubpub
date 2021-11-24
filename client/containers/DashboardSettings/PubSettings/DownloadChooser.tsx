import React, { useState } from 'react';
import dateFormat from 'dateformat';
import { Button } from '@blueprintjs/core';

import { FileUploadButton } from 'components';
import { getFormattedDownload } from 'containers/Pub/PubHeader/headerUtils';
import { apiFetch } from 'client/utils/apiFetch';

require('./downloadChooser.scss');

type Props = {
	pubData: {
		id?: string;
		downloads?: any[];
	};
	communityId: string;
	onSetDownloads: (...args: any[]) => any;
};

const DownloadChooser = (props: Props) => {
	const { communityId, pubData, onSetDownloads } = props;
	const [isRemoving, setIsRemoving] = useState(false);

	const formattedDownload = getFormattedDownload(pubData.downloads);
	const { url = '', date } = formattedDownload || {};
	const extension = url.split('.').pop().toLowerCase();

	const updateDownloads = async (fileUrl) => {
		const nextDownloads = fileUrl
			? [
					{
						type: 'formatted',
						url: fileUrl,
						createdAt: new Date(),
					},
			  ]
			: [];
		try {
			setIsRemoving(true);
			await apiFetch('/api/pubs', {
				method: 'PUT',
				body: JSON.stringify({
					downloads: nextDownloads,
					pubId: pubData.id,
					communityId,
				}),
			});
			onSetDownloads(nextDownloads);
			setIsRemoving(false);
		} catch (err) {
			console.error('Error Saving Pub Downloads: ', err);
		}
	};

	return (
		<div className="download-chooser-component">
			<p>
				You can upload a file, like a PDF with custom styling, to associate with this pub.
				It will be provided to readers as the pub's default download, but they'll still be
				able to use the automatic export tools.
			</p>
			<div className="buttons">
				<FileUploadButton
					icon="upload"
					onUploadFinish={updateDownloads}
					text="Upload new file"
				/>
				{formattedDownload && (
					<>
						<Button
							icon="download"
							text={`Download ${extension.toUpperCase()}`}
							onClick={() => window.open(url)}
						/>
						<Button
							text="Remove file"
							icon="trash"
							onClick={() => updateDownloads(null)}
							loading={isRemoving}
						/>
					</>
				)}
			</div>
			{date && <div className="subtext">Uploaded {dateFormat(date, 'mmm dd, yyyy')}</div>}
		</div>
	);
};
export default DownloadChooser;

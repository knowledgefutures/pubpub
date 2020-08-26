import React, { useState, useEffect } from 'react';
import { Button, Icon, Spinner, Tooltip } from '@blueprintjs/core';

import { Menu, MenuItem } from 'components/Menu';
import { apiFetch } from 'client/utils/apiFetch';
import { pingTask } from 'client/utils/pingTask';
import { usePageContext } from 'utils/hooks';

import { usePubHistory } from '../pubHooks';
import { getFormattedDownload } from './headerUtils';

require('./download.scss');

type Props = {
	pubData: any;
	children: React.ReactNode;
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

const Download = (props: Props) => {
	const { pubData, children } = props;
	const { downloads = [], activeBranch } = pubData;
	const [isLoading, setIsLoading] = useState(false);
	const [isError, setIsError] = useState(false);
	const [selectedType, setSelectedType] = useState(null);
	const [downloadUrl, setDownloadUrl] = useState(null);
	// @ts-expect-error ts-migrate(2339) FIXME: Property 'latestKey' does not exist on type '{}'.
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
				// @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
				format: selectedType.format,
				historyKey: latestKey,
				accessHash: locationData.query.access,
			}),
		})
			.then(({ taskId, url }) => {
				if (url) {
					downloadOrShowButton(url);
				}
				if (taskId) {
					// @ts-expect-error ts-migrate(2345) FIXME: Type 'unknown' is not assignable to type '{ url: a... Remove this comment to see the full error message
					return pingTask(taskId, 1500).then(({ url: laterUrl }) =>
						downloadOrShowButton(laterUrl),
					);
				}
				return null;
			})
			.catch(() => {
				setIsError(true);
				setIsLoading(false);
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
		// @ts-expect-error ts-migrate(2322) FIXME: Property 'children' does not exist on type 'Intrin... Remove this comment to see the full error message
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
						// @ts-expect-error ts-migrate(2322) FIXME: Property 'dismissOnClick' does not exist on type '... Remove this comment to see the full error message
						dismissOnClick={false}
						labelElement={<Icon icon="star" />}
						className="formatted-button"
						// intent={Intent.PRIMARY}
						text={`Formatted ${formattedDownload.url
							.split('.')
							.pop()
							.toUpperCase()}`}
						// @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
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
				// @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
				const shouldRenderButton = downloadUrl && selectedType.format === type.format;
				return (
					<MenuItem
						// eslint-disable-next-line react/no-array-index-key
						key={`${i}-${type.format}`}
						// @ts-expect-error ts-migrate(2322) FIXME: Property 'dismissOnClick' does not exist on type '... Remove this comment to see the full error message
						dismissOnClick={false}
						// @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
						disabled={isLoading && selectedType.format !== type.format}
						// loading={isLoading && selectedType.format === type.format}
						rightElement={
							<span>
								{/* @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'. */}
								{isLoading && selectedType.format === type.format && (
									<Spinner size={Spinner.SIZE_SMALL} />
								)}
							</span>
						}
						onClick={() => handleStartDownload(type)}
						text={
							<Tooltip
								key={type.format}
								// @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
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
export default Download;

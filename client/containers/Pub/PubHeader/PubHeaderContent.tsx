import React from 'react';

import { ClickToCopyButton } from 'components';
import { getPubPublishedDate } from 'utils/pub/pubDates';
import { formatDate } from 'utils/dates';
import { usePageContext } from 'utils/hooks';
import { apiFetch } from 'client/utils/apiFetch';
import { Pub } from 'utils/types';

import CollectionsBar from './collections/CollectionsBar';
import DraftReleaseButtons from './DraftReleaseButtons';
import TitleGroup from './TitleGroup';
import UtilityButtons from './UtilityButtons';

type Props = {
	historyData: any;
	onShowHeaderDetails: (...args: any[]) => any;
	pubData: Pub & {
		isInMaintenanceMode: boolean;
	};
	pubHeadings: any[];
	updateLocalData: (...args: any[]) => any;
};

const PubHeaderContent = (props: Props) => {
	const { historyData, onShowHeaderDetails, pubData, pubHeadings, updateLocalData } = props;
	const { doi, isInMaintenanceMode } = pubData;
	const { communityData } = usePageContext();
	const publishedDate = getPubPublishedDate(pubData);

	const updatePubData = (newPubData) => {
		return updateLocalData('pub', newPubData, { isImmediate: true });
	};

	const updateHistoryData = (newHistoryData) => {
		return updateLocalData('history', newHistoryData);
	};

	const updateAndSavePubData = (newPubData) => {
		const oldPubData = { ...pubData };
		updatePubData(newPubData);
		return apiFetch('/api/pubs', {
			method: 'PUT',
			body: JSON.stringify({
				...newPubData,
				pubId: pubData.id,
				communityId: communityData.id,
			}),
		}).catch(() => updateLocalData('pub', oldPubData));
	};

	const renderTop = () => {
		return (
			<div className="pub-header-top-area has-bottom-hairline">
				<CollectionsBar pubData={pubData as any} updatePubData={updatePubData} />
				<div className="basic-details">
					<span className="metadata-pair">
						{publishedDate && (
							<b className="pub-header-themed-secondary">Published on</b>
						)}
						{publishedDate ? formatDate(publishedDate) : <i>Unpublished</i>}
					</span>
					{doi && (
						<span className="metadata-pair doi-pair">
							<b className="pub-header-themed-secondary">DOI</b>
							<ClickToCopyButton
								copyString={`https://doi.org/${doi}`}
								className="click-to-copy"
								beforeCopyPrompt="Copy doi.org link"
								icon={null}
							>
								{doi}
							</ClickToCopyButton>
						</span>
					)}
					<div className="show-details-placeholder" />
				</div>
			</div>
		);
	};

	return (
		<div className="pub-header-content-component">
			{renderTop()}
			<TitleGroup pubData={pubData} updatePubData={updateAndSavePubData} />
			<UtilityButtons
				pubData={pubData}
				updatePubData={updateAndSavePubData}
				pubHeadings={pubHeadings}
				onShowHeaderDetails={onShowHeaderDetails}
			/>
			{!isInMaintenanceMode && (
				<DraftReleaseButtons
					pubData={pubData}
					historyData={historyData}
					updatePubData={updatePubData}
					updateHistoryData={updateHistoryData}
				/>
			)}
		</div>
	);
};
export default PubHeaderContent;

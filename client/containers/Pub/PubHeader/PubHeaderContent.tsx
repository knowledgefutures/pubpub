import React from 'react';

import { ClickToCopyButton } from 'components';
import { getPubPublishedDateString } from 'utils/pub/pubDates';
import { usePageContext } from 'utils/hooks';
import { apiFetch } from 'client/utils/apiFetch';
import { PubPageData } from 'types';

import { usePubContext } from '../pubHooks';
import CollectionsBar from './collections/CollectionsBar';
import DraftReleaseButtons from './DraftReleaseButtons';
import TitleGroup from './TitleGroup';
import UtilityButtons from './UtilityButtons';

type Props = {
	onShowHeaderDetails: (...args: any[]) => any;
	pubData: PubPageData;
	updateLocalData: (...args: any[]) => any;
};

const PubHeaderContent = (props: Props) => {
	const { onShowHeaderDetails, pubData, updateLocalData } = props;
	const { doi, isInMaintenanceMode } = pubData;
	const { communityData } = usePageContext();
	const { submissionState, historyData } = usePubContext();
	const publishedDateString = getPubPublishedDateString(pubData);
	const isSubmission = !!submissionState;

	const updatePubData = (newPubData) => {
		return updateLocalData('pub', newPubData, { isImmediate: true });
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
				{!isSubmission && (
					<CollectionsBar pubData={pubData as any} updatePubData={updatePubData} />
				)}
				<div className="basic-details">
					<span className="metadata-pair">
						{publishedDateString ? (
							<>
								<b className="pub-header-themed-secondary">Published on </b>
								{publishedDateString}
							</>
						) : (
							<i>Unpublished</i>
						)}
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
			<UtilityButtons onShowHeaderDetails={onShowHeaderDetails} pubData={pubData} />
			{!isInMaintenanceMode && (
				<DraftReleaseButtons
					pubData={pubData}
					historyData={historyData}
					updatePubData={updatePubData}
				/>
			)}
		</div>
	);
};
export default PubHeaderContent;

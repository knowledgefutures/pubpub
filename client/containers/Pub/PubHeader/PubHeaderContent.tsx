import React from 'react';

import { ClickToCopyButton } from 'components';
import { getPubPublishedDate } from 'utils/pub/pubDates';
import { formatDate } from 'utils/dates';
import { usePageContext } from 'utils/hooks';
import { apiFetch } from 'client/utils/apiFetch';

import CollectionsBar from './collections/CollectionsBar';
import DraftReleaseButtons from './DraftReleaseButtons';
import TitleGroup from './TitleGroup';
import UtilityButtons from './UtilityButtons';

type Props = {
	historyData: any;
	onShowHeaderDetails: (...args: any[]) => any;
	pubData: {
		id: string;
		doi?: string;
		isInMaintenanceMode?: boolean;
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
				<CollectionsBar pubData={pubData} updateLocalData={updateLocalData} />
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
							{/* @ts-expect-error ts-migrate(2745) FIXME: This JSX tag's 'children' prop expects type 'never... Remove this comment to see the full error message */}
							<ClickToCopyButton
								// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
								copyString={`https://doi.org/${doi}`}
								// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
								className="click-to-copy"
								// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
								beforeCopyPrompt="Copy doi.org link"
								// @ts-expect-error ts-migrate(2322) FIXME: Type 'null' is not assignable to type 'never'.
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
			{/* @ts-expect-error ts-migrate(2559) FIXME: Type '{ id: string; doi?: string | undefined; isIn... Remove this comment to see the full error message */}
			<TitleGroup pubData={pubData} updatePubData={updateAndSavePubData} />
			<UtilityButtons
				// @ts-expect-error ts-migrate(2559) FIXME: Type '{ id: string; doi?: string | undefined; isIn... Remove this comment to see the full error message
				pubData={pubData}
				updatePubData={updateAndSavePubData}
				pubHeadings={pubHeadings}
				onShowHeaderDetails={onShowHeaderDetails}
			/>
			{!isInMaintenanceMode && (
				<DraftReleaseButtons
					// @ts-expect-error ts-migrate(2741) FIXME: Property 'releases' is missing in type '{ id: stri... Remove this comment to see the full error message
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

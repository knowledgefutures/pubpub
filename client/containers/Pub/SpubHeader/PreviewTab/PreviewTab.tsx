import React from 'react';
import { Icon } from '@blueprintjs/core';

import { PubPageData, DefinitelyHas, PubHistoryState } from 'types';
import { GridWrapper, PubByline, DialogLauncher } from 'components';
import { usePageContext } from 'utils/hooks';
import { usePubContext } from 'containers/Pub/pubHooks';

import SubmitDialog from './SubmitDialog';
import PubHeaderBackground from '../../PubHeader/PubHeaderBackground';
import ResponsiveHeaderButton from '../../PubHeader/ResponsiveHeaderButton';
import { getHistoryButtonLabelForTimestamp } from '../../PubHeader/DraftReleaseButtons';

require('../../PubHeader/draftReleaseButtons.scss');

type Props = {
	historyData: PubHistoryState;
	updateHistoryData: (patch: Partial<PubHistoryState>) => unknown;
	pubData: DefinitelyHas<PubPageData, 'submission'>;
};

const PreviewTab = (props: Props) => {
	const { communityData } = usePageContext();
	const { pubData, historyData } = props;
	const { latestKey, timestamps } = historyData;
	const latestTimestamp = timestamps[latestKey];
	const { collabData } = usePubContext();

	return (
		<PubHeaderBackground communityData={communityData} pubData={props.pubData}>
			<GridWrapper containerClassName="pub">
				<div className="title-group-component">
					{pubData.title && (
						<h1 className="title">
							<span className="text-wrapper">{pubData.title}</span>
						</h1>
					)}
					{pubData.description && (
						<h3 className="description pub-header-themed-secondary">
							<span className="text-wrapper">{pubData.description}</span>
						</h3>
					)}
					<PubByline pubData={pubData} />
					<div className="draft-submit-buttons-component">
						<ResponsiveHeaderButton
							// @ts-expect-error ts-migrate(2322) FIXME: Type '{ icon: string; className: string; active: a... Remove this comment to see the full error message
							icon="history"
							className="draft-history-button"
							active={historyData.isViewingHistory}
							outerLabel={getHistoryButtonLabelForTimestamp(
								latestTimestamp,
								'draft last updated',
								'draft created',
							)}
							disabled={historyData.loadedIntoHistory}
							onClick={() =>
								props.updateHistoryData({
									isViewingHistory: !historyData.isViewingHistory,
								})
							}
						/>
						<DialogLauncher
							renderLauncherElement={({ openDialog }) => (
								<ResponsiveHeaderButton
									// @ts-expect-error ts-migrate(2322) FIXME: Type '{ icon: string; tagName: string; href: strin... Remove this comment to see the full error message
									className="submit-button"
									disabled={collabData.status === 'connecting'}
									onClick={openDialog}
									icon={
										<Icon iconSize={13} className="submit-icon" icon="saved" />
									}
									label={{
										top: 'Submit Pub',
										bottom: 'finish your submission',
									}}
								/>
							)}
						>
							{({ isOpen, onClose }) => (
								<SubmitDialog
									submission={props.pubData.submission}
									isOpen={isOpen}
									onClose={onClose}
								/>
							)}
						</DialogLauncher>
					</div>
				</div>
			</GridWrapper>
		</PubHeaderBackground>
	);
};

export default PreviewTab;

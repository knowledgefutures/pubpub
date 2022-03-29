import React, { useMemo } from 'react';
import { Tab, Tabs, Icon, IconName, Button } from '@blueprintjs/core';
import Color from 'color';

import { GridWrapper, DialogLauncher } from 'components';
import { Submission, DefinitelyHas } from 'types';
import { usePageContext, usePendingChanges } from 'utils/hooks';

import SubmitDialog from './SubmitDialog';
import { SpubHeaderTab } from '../SpubHeader';

require('./spubHeaderToolbar.scss');

const renderTabTitle = (icon: IconName, title: string) => (
	<>
		<Icon icon={icon} iconSize={13} /> {title}
	</>
);

type Props = {
	selectedTab: SpubHeaderTab;
	onSelectTab: (t: SpubHeaderTab) => unknown;
	submission: DefinitelyHas<Submission, 'submissionWorkflow'>;
};

const SpubHeaderToolbar = (props: Props) => {
	const instructionTabTitle = renderTabTitle('align-left', 'Instructions');
	const submissionTabTitle = renderTabTitle('manually-entered-data', 'Submission');
	const contributorsTabTitle = renderTabTitle('people', 'Contributors');
	const previewTabTitle = renderTabTitle('eye-open', 'Preview');
	const { communityData } = usePageContext();

	const lighterAccentColor = useMemo(
		() => Color(communityData.accentColorDark).alpha(0.1),
		[communityData.accentColorDark],
	);
	const { pendingCount } = usePendingChanges();
	const isSaving = pendingCount > 0;
	const showSubmitButton =
		props.submission.status === 'incomplete' && props.selectedTab !== 'instructions';

	const status = isSaving ? (
		<strong>
			<em>Saving</em>
		</strong>
	) : (
		<span className="status-text">{props.submission.status}</span>
	);

	const showStatus = props.submission.status !== 'incomplete';

	const renderRight = () => (
		<>
			{showSubmitButton && (
				<DialogLauncher
					renderLauncherElement={({ openDialog }) => (
						<Button
							minimal
							outlined
							disabled={isSaving}
							intent="primary"
							className="submit-button"
							onClick={openDialog}
						>
							{isSaving ? <em>Saving</em> : 'Submit'}
						</Button>
					)}
				>
					{({ isOpen, onClose }) => (
						<SubmitDialog
							submission={props.submission}
							isOpen={isOpen}
							onClose={onClose}
						/>
					)}
				</DialogLauncher>
			)}
			{showStatus && (
				<div className="status">
					<em>status:</em>
					<Icon
						icon="symbol-square"
						iconSize={18}
						className={`status-color-${props.submission.status}`}
					/>
					<strong>{status}</strong>
				</div>
			)}
		</>
	);

	return (
		<div style={{ background: lighterAccentColor }} className="spub-header-toolbar-component">
			<GridWrapper containerClassName="toolbar-container">
				<div className="toolbar-items">
					<Tabs
						id="spubHeaderToolbar"
						onChange={props.onSelectTab}
						selectedTabId={props.selectedTab}
					>
						<Tab id="instructions" title={instructionTabTitle} />
						<Tab id="details" title={submissionTabTitle} />
						<Tab id="contributors" title={contributorsTabTitle} />
						<Tab id="preview" title={previewTabTitle} />
					</Tabs>
					<div>{renderRight()}</div>
				</div>
			</GridWrapper>
		</div>
	);
};

export default SpubHeaderToolbar;

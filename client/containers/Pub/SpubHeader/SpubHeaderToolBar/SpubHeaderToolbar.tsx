import React, { useMemo } from 'react';
import { Tab, Tabs, TabId, Icon, IconName, Button } from '@blueprintjs/core';
import Color from 'color';

import { GridWrapper } from 'components';
import { SubmissionStatus } from 'types';
import { usePageContext, usePendingChanges } from 'utils/hooks';

require('./spubHeaderToolbar.scss');

const renderTabTitle = (icon: IconName, title: string) => (
	<>
		<Icon icon={icon} /> {title}
	</>
);

type Props = {
	selectedTab: TabId;
	onSelectTab: (t: TabId) => unknown;
	status: SubmissionStatus;
	showSubmitButton: boolean;
	onSubmit: () => unknown;
};

const SpubHeaderToolbar = (props: Props) => {
	const instructionTabTitle = renderTabTitle('align-left', 'Instructions');
	const submissionTabTitle = renderTabTitle('manually-entered-data', 'Submission');
	const contributorsTabTitle = renderTabTitle('people', 'Contributors');
	const previewTabTitle = renderTabTitle('eye-open', 'Preview');
	const maybeActiveClass = (tabId: string) =>
		`${tabId === props.selectedTab ? 'active' : 'inactive'}`;

	const { communityData } = usePageContext();

	const lighterAccentColor = useMemo(
		() => Color(communityData.accentColorDark).alpha(0.1),
		[communityData.accentColorDark],
	);

	const { pendingCount } = usePendingChanges();
	const isSaving = pendingCount > 0;

	const status = isSaving ? (
		<strong>
			<em>Saving</em>
		</strong>
	) : (
		<span className="status-text">{props.status}</span>
	);

	const renderRight = props.showSubmitButton ? (
		<Button
			className="submission-button"
			minimal={true}
			outlined={true}
			intent="primary"
			onClick={props.onSubmit}
		>
			Submit
		</Button>
	) : (
		<div className="status">
			<em>status:&nbsp;&nbsp;&nbsp;</em>
			<strong>{status}</strong>
		</div>
	);
	return (
		<div className="spubheader-toolbar-component" style={{ background: lighterAccentColor }}>
			<GridWrapper>
				<Tabs
					id="spubHeader"
					onChange={props.onSelectTab}
					selectedTabId={props.selectedTab}
					large={true}
				>
					<Tab
						id="instructions"
						title={instructionTabTitle}
						className={`tab-panel ${maybeActiveClass('instructions')}`}
					/>

					<Tab
						id="submission"
						title={submissionTabTitle}
						className={`tab-panel ${maybeActiveClass('submission')}`}
					/>

					<Tab
						id="contributors"
						title={contributorsTabTitle}
						className={`tab-panel ${maybeActiveClass('contributors')}`}
					/>
					<Tab
						id="preview"
						title={previewTabTitle}
						className={`${maybeActiveClass('preview')}`}
					/>
				</Tabs>
				<div>{renderRight}</div>
			</GridWrapper>
		</div>
	);
};

export default SpubHeaderToolbar;

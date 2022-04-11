import React, { useMemo } from 'react';
import { Tab, Tabs, Icon, IconName, Button, Tooltip } from '@blueprintjs/core';
import Color from 'color';

import { GridWrapper, DialogLauncher } from 'components';
import { Submission, DefinitelyHas } from 'types';
import { usePageContext, usePendingChanges } from 'utils/hooks';
import { ValidatedSubmissionFields } from 'utils/submission/validate';

import { capitalize } from 'utils/strings';
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
	validatedFields: ValidatedSubmissionFields;
};

const SpubHeaderToolbar = (props: Props) => {
	const { selectedTab, submission, onSelectTab, validatedFields } = props;
	const { communityData } = usePageContext();
	const { pendingCount } = usePendingChanges();

	const lighterAccentColor = useMemo(
		() => Color(communityData.accentColorDark).alpha(0.1),
		[communityData.accentColorDark],
	);

	const invalidNotice = useMemo(() => {
		const invalidFields = Object.entries(validatedFields).reduce((fields, entry) => {
			const [key, valid] = entry;
			if (!valid) {
				return [...fields, key];
			}
			return fields;
		}, [] as string[]);

		if (invalidFields.length) {
			return (
				<>
					Please correct these fields before submitting:{' '}
					<em>{invalidFields.join(', ')}</em>
				</>
			);
		}
		return null;
	}, [validatedFields]);

	const instructionTabTitle = renderTabTitle('align-left', 'Instructions');
	const submissionTabTitle = renderTabTitle('manually-entered-data', 'Submission');
	const contributorsTabTitle = renderTabTitle('people', 'Contributors');
	const previewTabTitle = renderTabTitle('eye-open', 'Preview');

	const isSaving = pendingCount > 0;
	const savingText = isSaving ? <em>Saving</em> : null;
	const showSubmitButton = submission.status === 'incomplete' && selectedTab !== 'instructions';

	const renderSubmitButton = () => {
		const sharedProps = {
			minimal: true,
			outlined: true,
			intent: 'primary' as const,
			className: 'submit-button',
			children: savingText || 'Submit',
			disabled: !!savingText,
		};

		if (invalidNotice) {
			return (
				<Tooltip content={invalidNotice}>
					<Button {...sharedProps} disabled />
				</Tooltip>
			);
		}
		return (
			<DialogLauncher
				renderLauncherElement={({ openDialog }) => (
					<Button {...sharedProps} onClick={openDialog} />
				)}
			>
				{({ isOpen, onClose }) => (
					<SubmitDialog submission={submission} isOpen={isOpen} onClose={onClose} />
				)}
			</DialogLauncher>
		);
	};

	const renderStatus = () => {
		const { status } = submission;

		if (savingText) {
			return savingText;
		}

		if (status !== 'incomplete') {
			const statusText = status === 'received' ? 'Received' : capitalize(status);
			return (
				<div className="status">
					<Icon
						icon="symbol-square"
						iconSize={18}
						className={`status-color-${submission.status}`}
					/>
					{statusText}
				</div>
			);
		}
		return null;
	};

	const renderRight = () => {
		if (showSubmitButton) {
			return renderSubmitButton();
		}
		return renderStatus();
	};

	return (
		<div style={{ background: lighterAccentColor }} className="spub-header-toolbar-component">
			<GridWrapper containerClassName="toolbar-container pub">
				<div className="toolbar-items">
					<Tabs id="spubHeaderToolbar" onChange={onSelectTab} selectedTabId={selectedTab}>
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

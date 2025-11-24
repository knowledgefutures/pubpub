import type { DefinitelyHas, Submission } from 'types';
import type { ValidatedSubmissionFields } from 'utils/submission/validate';

import type { SpubHeaderTab } from '../SpubHeader';

import React, { useMemo, useState } from 'react';

import { Button, Icon, type IconName, Tab, Tabs, Tooltip } from '@blueprintjs/core';
import Color from 'color';

import { GridWrapper } from 'components';
import { usePageContext, usePendingChanges } from 'utils/hooks';
import { capitalize } from 'utils/strings';

import SubmitDialog from './SubmitDialog';

import './spubHeaderToolbar.scss';

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
	const [showSubmitDialog, setShowSubmitDialog] = useState(false);
	const { communityData } = usePageContext();
	const { pendingCount } = usePendingChanges();

	const lighterAccentColor = useMemo(
		() => Color(communityData.accentColorDark).alpha(0.1).toString(),
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
		return <Button {...sharedProps} onClick={() => setShowSubmitDialog(true)} />;
	};

	const renderSubmitDialog = () => {
		return (
			<SubmitDialog
				submission={submission}
				isOpen={showSubmitDialog}
				onClose={() => setShowSubmitDialog(false)}
			/>
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
					{renderRight()}
					{renderSubmitDialog()}
				</div>
			</GridWrapper>
		</div>
	);
};

export default SpubHeaderToolbar;

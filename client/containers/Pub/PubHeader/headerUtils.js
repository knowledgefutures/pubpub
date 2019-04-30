import React from 'react';
import { Position, Menu, MenuItem } from '@blueprintjs/core';

export const generateSubmissionButtons = (pubData) => {
	const defaultSubmissionBranch = pubData.branches.reduce((prev, curr) => {
		if (!prev && curr.id !== pubData.activeBranch.id) {
			return curr;
		}
		return prev;
	}, undefined);

	if (!defaultSubmissionBranch) {
		return null;
	}

	const outputButtons = [];
	outputButtons.push({
		text: (
			<div className="text-stack">
				<span>{defaultSubmissionBranch.submissionAlias || 'New Submission'}</span>
				<span className="subtext">to branch: {defaultSubmissionBranch.title}</span>
			</div>
		),
		href: `/pub/${pubData.slug}/submissions/new/${pubData.activeBranch.shortId}/${
			defaultSubmissionBranch.shortId
		}`,
		isWide: true,
	});
	if (pubData.branches.length > 2) {
		outputButtons.push({
			// text: 'hello',
			rightIcon: 'caret-down',
			isSkinny: true,
			popoverProps: {
				content: (
					<Menu>
						{pubData.branches
							.filter((branch) => {
								return (
									branch.id !== pubData.activeBranch.id &&
									branch.id !== defaultSubmissionBranch.id
								);
							})
							.map((branch) => {
								return (
									<MenuItem
										key={branch.id}
										href={`/pub/${pubData.slug}/submissions/new/${
											pubData.activeBranch.shortId
										}/${branch.shortId}`}
										text={
											<div className="text-stack">
												<span>{branch.submissionAlias || 'To'}</span>
												<span className="subtext">
													branch: {branch.title}
												</span>
											</div>
										}
									/>
								);
							})}
					</Menu>
				),
				minimal: true,
				popoverClassName: 'action-button-popover right-aligned-skewed',
				position: Position.BOTTOM_RIGHT,
			},
		});
	}
	return outputButtons;
};

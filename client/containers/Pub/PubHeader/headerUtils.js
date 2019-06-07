import React from 'react';
import { Position, Menu, MenuItem } from '@blueprintjs/core';

export const generateSubmissionButtons = (pubData) => {
	const defaultSubmissionBranch = pubData.branches.reduce((prev, curr) => {
		// if (!prev && curr.id !== pubData.activeBranch.id) {
		/* TODO-BRANCH: The check for title === 'public' is because we only want to support */
		/* publishing to a public branch until full branch capabilities are rolled out */
		if (curr.title === 'public' && curr.id !== pubData.activeBranch.id) {
			return curr;
		}
		return prev;
	}, undefined);

	/* TODO-BRANCH: this check to make sure the activeBranch is 'draft' is only */
	/* to valid until we roll out full branch features */
	if (pubData.activeBranch.title !== 'draft') {
		return null;
	}

	if (!defaultSubmissionBranch) {
		return null;
	}
	const outputButtons = [];
	/* TODO-BRANCH: Once we roll out full branch capabilities, we may want to rethink this language. */
	/* To change the button default to say Merge, into #branch. Rather than Publish, merge into #public */
	const buttonText = defaultSubmissionBranch.canManage ? 'Publish' : 'Submit for Review';
	const buttonSubText = defaultSubmissionBranch.canManage
		? `merge into #${defaultSubmissionBranch.title}`
		: `to #${defaultSubmissionBranch.title}`;
	outputButtons.push({
		text: (
			<div className="text-stack">
				<span>{buttonText}</span>
				<span className="action-subtext">{buttonSubText}</span>
			</div>
		),
		href: `/pub/${pubData.slug}/submissions/new/${pubData.activeBranch.shortId}/${
			defaultSubmissionBranch.shortId
		}`,
		isWide: true,
	});

	/* TODO-BRANCH: The following 'false' is because we only want to support publishing */
	/* to a public branch until full branch capabilities are rolled out */
	if (false && pubData.branches.length > 2) {
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

export const generateHeaderBreadcrumbs = (pubData, locationData) => {
	const { mode, slug } = pubData;
	const sections = {
		merge: [{ text: 'Merge' }],
		reviewCreate: [{ text: 'New Review' }],
		reviews: [{ text: 'Reviews' }],
		review: [
			{ text: 'Reviews', href: `/pub/${slug}/reviews` },
			{ text: locationData.params.reviewShortId },
		],
		manage: [{ text: 'Manage' }],
		branchCreate: [{ text: 'New Branch' }],
	};
	const sectionData = sections[mode];
	if (!sectionData) {
		return null;
	}
	return sectionData.map((data) => {
		return (
			<span key={data.text} className="breadcrumb">
				{data.href ? (
					<a key={data.text} href={data.href}>
						{data.text}
					</a>
				) : (
					data.text
				)}
			</span>
		);
	});
};

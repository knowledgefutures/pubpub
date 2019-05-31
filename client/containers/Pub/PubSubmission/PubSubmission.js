import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { AnchorButton, Button, ButtonGroup, Intent, Position, MenuItem, NonIdealState } from '@blueprintjs/core';
import { Select } from '@blueprintjs/select';
import { communityDataProps, locationDataProps, loginDataProps } from 'types/base';
import { pubDataProps } from 'types/pub';
import { GridWrapper, DropdownButton } from 'components';
import { PageContext } from 'components/PageWrapper/PageWrapper';
import { apiFetch } from 'utils';

const propTypes = {
	pubData: pubDataProps.isRequired,
};

const PubSubmission = (props) => {
	const { pubData } = props;
	const { locationData, communityData } = useContext(PageContext);
	const [isLoading, setIsLoading] = useState(false);
	const sourceBranch = pubData.branches.find((branch) => {
		return branch.shortId === Number(locationData.params.fromBranchShortId);
	});
	const destinationBranch = pubData.branches.find((branch) => {
		return branch.shortId === Number(locationData.params.toBranchShortId);
	});
	const canMerge = destinationBranch.canManage;
	const submitText = `Create Submission to #${destinationBranch.title}`;

	const createReview = () => {
		setIsLoading(true);
		return apiFetch('/api/reviews', {
			method: 'POST',
			body: JSON.stringify({
				sourceBranchId: sourceBranch.id,
				destinationBranchId: destinationBranch.id,
				pubId: pubData.id,
				communityId: communityData.id,
			}),
		})
			.then((newReview) => {
				window.location.href = `/pub/${pubData.slug}/reviews/${newReview.shortId}`;
			})
			.catch((err) => {
				console.error(err);
			});
	};

	const mergeBranch = () => {
		setIsLoading(true);
		return apiFetch('/api/reviews/accept', {
			method: 'POST',
			body: JSON.stringify({
				sourceBranchId: sourceBranch.id,
				destinationBranchId: destinationBranch.id,
				pubId: pubData.id,
				communityId: communityData.id,
			}),
		})
			.then(() => {
				window.location.href = `/pub/${pubData.slug}/branch/${destinationBranch.shortId}`;
			})
			.catch((err) => {
				console.error(err);
			});
	};

	const existingReview = pubData.reviews.reduce((prev, curr) => {
		if (
			curr.destinationBranchId === destinationBranch.id &&
			curr.sourceBranchId === sourceBranch.id &&
			!curr.isClosed
		) {
			return curr;
		}
		return prev;
	}, false);
	return (
		<GridWrapper containerClassName="pub pub-branch-create-component">
			<h1>Submission</h1>
			<p>
				{sourceBranch.title} -> {destinationBranch.title}
			</p>

			{existingReview && (
				<NonIdealState
					icon="issue"
					title="Review already open"
					action={
						<AnchorButton
							intent={Intent.PRIMARY}
							text="Go to existing review"
							href={`/pub/${pubData.slug}/reviews/${existingReview.shortId}`}
						/>
					}
				/>
			)}
			{!existingReview && (
				<ButtonGroup>
					<Button
						intent={Intent.PRIMARY}
						text={canMerge ? `Merge into #${destinationBranch.title}` : submitText}
						loading={isLoading}
						onClick={canMerge ? mergeBranch : createReview}
					/>
					{canMerge && (
						<Select
							items={[0]}
							filterable={false}
							popoverProps={{ minimal: true, position: Position.BOTTOM_RIGHT }}
							onItemSelect={createReview}
							itemRenderer={(item, rendererProps) => {
								return (
									<MenuItem
										key="static"
										text={submitText}
										onClick={rendererProps.handleClick}
									/>
								);
							}}
						>
							<Button icon="caret-down" intent={Intent.PRIMARY} loading={isLoading} />
						</Select>
					)}
				</ButtonGroup>
			)}
		</GridWrapper>
	);
};

PubSubmission.propTypes = propTypes;
export default PubSubmission;

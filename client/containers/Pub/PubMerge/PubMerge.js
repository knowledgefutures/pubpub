import React, { useContext, useState } from 'react';
import { Button, Intent, Tag } from '@blueprintjs/core';
import { pubDataProps } from 'types/pub';
import { GridWrapper, InputField, Icon, MinimalEditor } from 'components';
import { usePageContext } from 'utils/hooks';
import { apiFetch } from 'utils';

require('./pubMerge.scss');

const propTypes = {
	pubData: pubDataProps.isRequired,
};

const PubMerge = (props) => {
	const { pubData } = props;
	const { locationData, communityData } = usePageContext();
	const [isLoading, setIsLoading] = useState(false);
	const [noteData, setNoteData] = useState({});
	const sourceBranch = pubData.branches.find((branch) => {
		return branch.shortId === Number(locationData.params.fromBranchShortId);
	});
	const destinationBranch = pubData.branches.find((branch) => {
		return branch.shortId === Number(locationData.params.toBranchShortId);
	});

	const mergeBranch = () => {
		setIsLoading(true);
		return apiFetch('/api/merges', {
			method: 'POST',
			body: JSON.stringify({
				noteContent: noteData.content,
				noteText: noteData.text,
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

	return (
		<GridWrapper containerClassName="pub pub-merge-component">
			<div className="merge-header">
				<h2>Merge</h2>
				<Tag minimal={true} large={true}>
					#{sourceBranch.title}{' '}
					<Icon icon="arrow-right" iconSize={14} className="merge-arrow" /> #
					{destinationBranch.title}
				</Tag>
			</div>

			<p className="intro">
				Merging will update the #{destinationBranch.title} branch with the content from the
				#{sourceBranch.title} branch.
			</p>
			<InputField label="Note">
				<MinimalEditor
					onChange={(data) => {
						setNoteData(data);
					}}
					focusOnLoad={true}
					placeholder="Add a comment describing the changes in this merge."
				/>
			</InputField>
			<Button
				intent={Intent.PRIMARY}
				text={`Merge into #${destinationBranch.title}`}
				loading={isLoading}
				onClick={mergeBranch}
			/>
		</GridWrapper>
	);
};

PubMerge.propTypes = propTypes;
export default PubMerge;

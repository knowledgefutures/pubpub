import React, { useContext, useState } from 'react';
import { Button, Intent, Tag } from '@blueprintjs/core';
import { pubDataProps } from 'types/pub';
import { GridWrapper, InputField, Icon } from 'components';
import { PageContext } from 'components/PageWrapper/PageWrapper';
import { apiFetch } from 'utils';

require('./pubMerge.scss');

const propTypes = {
	pubData: pubDataProps.isRequired,
};

const PubMerge = (props) => {
	const { pubData } = props;
	const { locationData, communityData } = useContext(PageContext);
	const [isLoading, setIsLoading] = useState(false);
	const [noteText, setNoteText] = useState('');
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
				note: noteText,
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

			<p>
				Merging will update the #{destinationBranch.title} branch with the content from the
				#{sourceBranch.title} branch.
			</p>
			<InputField
				label="Note"
				isTextarea={true}
				placeholder="Add a comment describing the changes in this merge."
				value={noteText}
				onChange={(evt) => {
					setNoteText(evt.target.value);
				}}
			/>
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

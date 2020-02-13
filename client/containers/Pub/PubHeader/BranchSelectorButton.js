import React from 'react';
import PropTypes from 'prop-types';

import { Icon } from 'components';
import { Menu, MenuItem } from 'components/Menu';

import LargeHeaderButton from './LargeHeaderButton';

const propTypes = {
	pubData: PropTypes.shape({
		activeBranch: PropTypes.shape({
			title: PropTypes.string,
			id: PropTypes.string,
		}),
		branches: PropTypes.arrayOf(
			PropTypes.shape({
				title: PropTypes.string,
				id: PropTypes.string,
			}),
		),
		slug: PropTypes.string.isRequired,
	}).isRequired,
};

const BranchSelectorButton = (props) => {
	const { pubData } = props;
	const branchesToShow = pubData.branches.concat().sort((a, b) => a.order - b.order);

	// eslint-disable-next-line no-unused-vars
	const renderDisclosure = (disclosureProps) => (
		<LargeHeaderButton
			{...disclosureProps}
			aria-label="Select branch"
			className="branch-selector-button"
			outerLabel={{
				top: 'you are now on branch',
				bottom: '#' + pubData.activeBranch.title,
			}}
			icon={
				<div>
					<Icon icon="git-branch" className="branch-icon" iconSize={22} />
					<Icon icon="caret-down" className="branch-icon-caret" iconSize={10} />
				</div>
			}
		/>
	);

	return (
		<Menu
			disclosure={renderDisclosure}
			aria-label="Select branch"
			className="pub-header-branch-selector-menu"
		>
			<div className="label">Switch to...</div>
			{branchesToShow.map((branch, index) => {
				const branchUrlSuffix = index ? `branch/${branch.shortId}` : '';
				return (
					<MenuItem
						key={branch.id}
						text={`#${branch.title}`}
						active={pubData.activeBranch.id === branch.id}
						href={`/pub/${pubData.slug}/${branchUrlSuffix}`}
					/>
				);
			})}
		</Menu>
	);
};

BranchSelectorButton.propTypes = propTypes;
export default BranchSelectorButton;

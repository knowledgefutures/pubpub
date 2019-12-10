import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { InputField } from 'components';
import { apiFetch, slugifyString } from 'utils';
import { PageContext } from 'utils/hooks';

const propTypes = {
	pubData: PropTypes.object.isRequired,
	branchData: PropTypes.object.isRequired,
	updateLocalData: PropTypes.func.isRequired,
	setIsLoading: PropTypes.func,
};

const defaultProps = {
	setIsLoading: () => {},
};

const Branches = (props) => {
	const { pubData, branchData, updateLocalData, setIsLoading } = props;
	const { communityData } = useContext(PageContext);

	const handleBranchUpdate = (branchUpdates) => {
		setIsLoading(true);
		updateLocalData('pub', {
			branches: pubData.branches.map((branch) => {
				if (branch.id !== branchUpdates.branchId) {
					return branch;
				}
				return {
					...branch,
					...branchUpdates,
				};
			}),
		});
		return apiFetch('/api/branches', {
			method: 'PUT',
			body: JSON.stringify({
				...branchUpdates,
				pubId: pubData.id,
				communityId: communityData.id,
			}),
		})
			.then(() => {
				setIsLoading(false);
			})
			.catch((err) => {
				console.error(err);
			});
	};

	return (
		<div className="pub-manage_branches_settings-component">
			<InputField
				label="Title"
				value={branchData.title || ''}
				onChange={(evt) => {
					handleBranchUpdate({
						branchId: branchData.id,
						title: slugifyString(evt.target.value),
					});
				}}
			/>
			<InputField
				label="Submission Alias"
				value={branchData.submissionAlias || ''}
				onChange={(evt) => {
					handleBranchUpdate({
						branchId: branchData.id,
						submissionAlias: evt.target.value.substring(0, 20),
					});
				}}
			/>
		</div>
	);
};

Branches.propTypes = propTypes;
Branches.defaultProps = defaultProps;
export default Branches;

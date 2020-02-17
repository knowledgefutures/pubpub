import React from 'react';
import PropTypes from 'prop-types';
import { Menu, MenuItem, Intent } from '@blueprintjs/core';
import { pubDataProps } from 'types/pub';
import { GridWrapper } from 'components';
import { usePageContext } from 'utils/hooks';
import Attribution from './Attribution';
import Collections from './Collections';
import Details from './Details';
import Delete from './Delete';
import Managers from './Managers';
import Branches from './Branches';
import Metrics from './Metrics';
import Doi from './Doi';

require('./pubManage.scss');

const propTypes = {
	pubData: pubDataProps.isRequired,
	updateLocalData: PropTypes.func.isRequired,
};

const PubManage = (props) => {
	const { locationData, communityData, loginData } = usePageContext();
	const manageMode = locationData.params.manageMode || 'details';
	const modes = [
		{ text: 'Details', active: manageMode === 'details', path: '' },
		{ text: 'Managers', active: manageMode === 'managers', path: 'managers' },
		{ text: 'Attribution', active: manageMode === 'attribution', path: 'attribution' },
		{ text: 'Branches', active: manageMode === 'branches', path: 'branches' },
		{ text: 'Collections', active: manageMode === 'collections', path: 'collections' },
		{ text: 'DOI', active: manageMode === 'doi', path: 'doi' },
		{ text: 'Metrics', active: manageMode === 'metrics', path: 'metrics' },
		{ text: 'Delete', active: manageMode === 'delete', path: 'delete', danger: true },
	];
	return (
		<div className="pub-manage-component">
			<GridWrapper containerClassName="pub" columnClassName="manage-columns">
				<div className="side-content">
					<Menu className="side-menu">
						{modes.map((mode) => {
							return (
								<MenuItem
									key={mode.text}
									text={mode.text}
									active={mode.active}
									href={`/pub/${locationData.params.pubSlug}/manage/${mode.path}`}
									intent={mode.danger ? Intent.DANGER : undefined}
								/>
							);
						})}
					</Menu>
				</div>

				<div className="main-content">
					{manageMode === 'details' && (
						<Details
							locationData={locationData}
							communityData={communityData}
							pubData={props.pubData}
							updateLocalData={props.updateLocalData}
						/>
					)}
					{manageMode === 'attribution' && (
						<Attribution
							communityData={communityData}
							pubData={props.pubData}
							updateLocalData={props.updateLocalData}
						/>
					)}
					{manageMode === 'collections' && (
						<Collections
							communityData={communityData}
							loginData={loginData}
							pubData={props.pubData}
							updateLocalData={props.updateLocalData}
						/>
					)}
					{manageMode === 'doi' && (
						<Doi
							communityData={communityData}
							pubData={props.pubData}
							updateLocalData={props.updateLocalData}
						/>
					)}
					{manageMode === 'managers' && (
						<Managers
							communityData={communityData}
							pubData={props.pubData}
							updateLocalData={props.updateLocalData}
						/>
					)}
					{manageMode === 'branches' && (
						<Branches
							communityData={communityData}
							pubData={props.pubData}
							updateLocalData={props.updateLocalData}
						/>
					)}
					{manageMode === 'delete' && (
						<Delete communityData={communityData} pubData={props.pubData} />
					)}
					{manageMode === 'metrics' && <Metrics pubData={props.pubData} />}
				</div>
			</GridWrapper>
		</div>
	);
};

PubManage.propTypes = propTypes;
export default PubManage;

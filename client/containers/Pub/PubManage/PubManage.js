import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Menu, MenuItem, Intent } from '@blueprintjs/core';
import { pubDataProps } from 'types/pub';
import { GridWrapper } from 'components';
import { PageContext } from 'components/PageWrapper/PageWrapper';
import Collections from './Collections';
import Details from './Details';
import Delete from './Delete';

require('./pubManage.scss');

const propTypes = {
	pubData: pubDataProps.isRequired,
	updateLocalData: PropTypes.func.isRequired,
};

const PubManage = (props) => {
	const { locationData, communityData } = useContext(PageContext);
	const manageMode = locationData.params.manageMode || 'details';
	const modes = [
		{ text: 'Details', active: manageMode === 'details', path: '' },
		{ text: 'Attribution', active: manageMode === 'attribution', path: 'attribution' },
		{ text: 'Collections', active: manageMode === 'collections', path: 'collections' },
		{ text: 'Sharing', active: manageMode === 'sharing', path: 'sharing' },
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
									href={`/pub/${locationData.params.slug}/manage/${mode.path}`}
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
					{manageMode === 'collections' && (
						<Collections
							communityData={communityData}
							pubData={props.pubData}
							updateLocalData={props.updateLocalData}
						/>
					)}
					{manageMode === 'delete' && (
						<Delete communityData={communityData} pubData={props.pubData} />
					)}
				</div>
			</GridWrapper>
		</div>
	);
};

PubManage.propTypes = propTypes;
export default PubManage;

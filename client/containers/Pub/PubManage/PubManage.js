import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Menu, MenuItem, Intent } from '@blueprintjs/core';
import { pubDataProps } from 'types/pub';
import { GridWrapper } from 'components';
import { PageContext } from 'components/PageWrapper/PageWrapper';

require('./pubManage.scss');

const propTypes = {
	pubData: pubDataProps.isRequired,
	updateLocalData: PropTypes.func.isRequired,
};

const PubManage = (props) => {
	const { locationData } = useContext(PageContext);
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
					<Menu>
						{modes.map((mode) => {
							return (
								<MenuItem
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
					<h2>This is some content</h2>
				</div>
			</GridWrapper>
		</div>
	);
};

PubManage.propTypes = propTypes;
export default PubManage;

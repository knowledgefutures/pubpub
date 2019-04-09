import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { PageContext } from 'components/PageWrapper/PageWrapper';
import { Menu, MenuItem, Intent } from '@blueprintjs/core';
import GridWrapper from 'components/GridWrapper/GridWrapper';
import { pubDataProps } from './sharedPropTypes';

require('./pubSettings.scss');

const propTypes = {
	pubData: pubDataProps.isRequired,
	updateLocalData: PropTypes.func.isRequired,
};

const PubSettings = (props) => {
	const { locationData } = useContext(PageContext);
	const settingsMode = locationData.params.settingsMode || 'details';
	const modes = [
		{ text: 'Details', active: settingsMode === 'details', path: '' },
		{ text: 'Attribution', active: settingsMode === 'attribution', path: 'attribution' },
		{ text: 'Collections', active: settingsMode === 'collections', path: 'collections' },
		{ text: 'Sharing', active: settingsMode === 'sharing', path: 'sharing' },
		{ text: 'Delete', active: settingsMode === 'delete', path: 'delete', danger: true },
	];
	return (
		<div className="pub-settings-component">
			<GridWrapper containerClassName="pub" columnClassName="settings-columns">
				<div className="side-content">
					<Menu>
						{modes.map((mode) => {
							return (
								<MenuItem
									text={mode.text}
									active={mode.active}
									href={`/pubnew/${locationData.params.slug}/settings/${
										mode.path
									}`}
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

PubSettings.propTypes = propTypes;
export default PubSettings;

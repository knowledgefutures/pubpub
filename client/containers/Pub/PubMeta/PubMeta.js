import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@blueprintjs/core';
import GridWrapper from 'components/GridWrapper/GridWrapper';
import { pubDataProps } from 'types/pub';
import Details from './Details';
import Social from './Social';
import Download from './Download';

require('./pubMeta.scss');

const propTypes = {
	pubData: pubDataProps.isRequired,
	updateLocalData: PropTypes.func.isRequired,
};

const PubMeta = (props) => {
	const { pubData, updateLocalData } = props;

	if (!pubData.metaMode) {
		return null;
	}
	return (
		<div className="pub-meta-component">
			<GridWrapper containerClassName="pub">
				<div className="header">
					<h3>{pubData.metaMode}</h3>
					<Button
						icon="small-cross"
						minimal={true}
						small={true}
						className="meta-close"
						onClick={() => {
							updateLocalData('pub', {
								metaMode: undefined,
							});
						}}
					/>
				</div>
				{pubData.metaMode === 'details' && <Details pubData={pubData} />}
				{pubData.metaMode === 'social' && <Social pubData={pubData} />}
				{pubData.metaMode === 'download' && <Download pubData={pubData} />}
			</GridWrapper>
		</div>
	);
};

PubMeta.propTypes = propTypes;
export default PubMeta;

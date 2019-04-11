import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@blueprintjs/core';
import { PageContext } from 'components/PageWrapper/PageWrapper';
import GridWrapper from 'components/GridWrapper/GridWrapper';
import { pubDataProps } from 'containers/PubNew/sharedPropTypes';
import Details from './Details';

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
				{pubData.metaMode === 'details' && <Details />}
			</GridWrapper>
		</div>
	);
};

PubMeta.propTypes = propTypes;
export default PubMeta;

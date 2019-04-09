import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@blueprintjs/core';
import { PageContext } from 'components/PageWrapper/PageWrapper';
import GridWrapper from 'components/GridWrapper/GridWrapper';
import { pubDataProps } from './sharedPropTypes';

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
				<h3>
					{pubData.metaMode}
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
				</h3>
			</GridWrapper>
		</div>
	);
};

PubMeta.propTypes = propTypes;
export default PubMeta;

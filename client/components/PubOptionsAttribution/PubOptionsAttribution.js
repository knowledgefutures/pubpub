import React from 'react';
import PropTypes from 'prop-types';
import { Spinner } from '@blueprintjs/core';

import AttributionEditor from '../AttributionEditor/AttributionEditor';

require('./pubOptionsAttribution.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	pubData: PropTypes.object.isRequired,
	setPubData: PropTypes.func.isRequired,
};

class PubOptionsAttribution extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			persistCount: 0,
		};
		this.handleUpdateAttributions = this.handleUpdateAttributions.bind(this);
		this.handlePersistStateChange = this.handlePersistStateChange.bind(this);
	}

	handleUpdateAttributions(newAttributions) {
		const { pubData, setPubData } = this.props;
		setPubData({
			...pubData,
			attributions: newAttributions,
		});
	}

	handlePersistStateChange(delta) {
		this.setState((state) => ({ persistCount: state.persistCount + delta }));
	}

	render() {
		const { communityData, pubData } = this.props;
		const { persistCount } = this.state;
		const isPersisting = persistCount > 0;
		return (
			<div className="component-pub-options-attribution">
				{isPersisting && (
					<div className="save-wrapper">
						<Spinner small={true} /> Saving...
					</div>
				)}
				<h1>Attribution</h1>
				<AttributionEditor
					apiRoute="/api/pubAttributions"
					identifyingProps={{
						communityId: communityData.id,
						pubId: pubData.id,
					}}
					attributions={pubData.attributions}
					canEdit={pubData.isManager}
					communityData={communityData}
					onUpdateAttributions={this.handleUpdateAttributions}
					onPersistStateChange={this.handlePersistStateChange}
				/>
			</div>
		);
	}
}

PubOptionsAttribution.propTypes = propTypes;
export default PubOptionsAttribution;

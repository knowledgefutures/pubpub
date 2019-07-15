import React from 'react';
import PropTypes from 'prop-types';
import { Spinner } from '@blueprintjs/core';
import { AttributionEditor } from 'components';
import ensureUserForAttribution from 'shared/utils/ensureUserForAttribution';

const propTypes = {
	communityData: PropTypes.object.isRequired,
	pubData: PropTypes.object.isRequired,
	updateLocalData: PropTypes.func.isRequired,
};

class Attribution extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			persistCount: 0,
		};
		this.handleUpdateAttributions = this.handleUpdateAttributions.bind(this);
		this.handlePersistStateChange = this.handlePersistStateChange.bind(this);
	}

	handleUpdateAttributions(newAttributions) {
		const { updateLocalData } = this.props;
		updateLocalData('pub', {
			attributions: newAttributions.map(ensureUserForAttribution),
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
						<Spinner size={Spinner.SIZE_SMALL} /> Saving...
					</div>
				)}
				<h2>Attribution</h2>
				<AttributionEditor
					apiRoute="/api/pubAttributions"
					identifyingProps={{
						communityId: communityData.id,
						pubId: pubData.id,
					}}
					attributions={pubData.attributions}
					canEdit={pubData.canManage}
					communityData={communityData}
					onUpdateAttributions={this.handleUpdateAttributions}
					onPersistStateChange={this.handlePersistStateChange}
				/>
			</div>
		);
	}
}

Attribution.propTypes = propTypes;
export default Attribution;

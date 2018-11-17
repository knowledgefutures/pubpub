/* eslint-disable react/no-danger */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Tooltip, Position } from '@blueprintjs/core';

require('./pubOptionsCite.scss');

const propTypes = {
	// communityData: PropTypes.object.isRequired,
	pubData: PropTypes.object.isRequired,
	// loginData: PropTypes.object.isRequired,
	// setPubData: PropTypes.func.isRequired,
};

class PubOptionsCite extends Component {
	constructor(props) {
		super(props);
		this.state = {
			mode: 'pub',
		};
	}

	render() {
		const pubData = this.props.pubData;
		// TODO: How do we cite on drafts?
		if (!pubData.citationData) { return null; }
		const modeData = this.state.mode === 'pub'
			? pubData.citationData.pub
			: pubData.citationData.version;
		return (
			<div className="pub-options-cite-component">
				<div className="save-wrapper">
					<div className="pt-button-group pt-small">
						<Tooltip
							content="Cite the work as a whole. The url below will always produce the most recent version of the work."
							tooltipClassName="pt-dark cite-tooltip"
							position={Position.BOTTOM}
						>
							<button
								className={`pt-button ${this.state.mode === 'pub' ? 'pt-active' : ''}`}
								onClick={()=> { this.setState({ mode: 'pub' }); }}
								type="button"
							>
								Cite the Work
							</button>
						</Tooltip>
						<Tooltip
							content="Cite this specific version. The url below will always produce this specific version of the work."
							tooltipClassName="pt-dark cite-tooltip"
							position={Position.BOTTOM}
						>
							<button
								className={`pt-button ${this.state.mode === 'version' ? 'pt-active' : ''}`}
								onClick={()=> { this.setState({ mode: 'version' }); }}
								type="button"
							>
								Cite this Version
							</button>
						</Tooltip>
					</div>
				</div>

				<h1>Cite</h1>
				<div className="style-wrapper">
					<div className="style-title">APA</div>
					<div className="style-content" dangerouslySetInnerHTML={{ __html: modeData.apa }} />
				</div>

				<div className="style-wrapper">
					<div className="style-title">Harvard</div>
					<div className="style-content" dangerouslySetInnerHTML={{ __html: modeData.harvard }} />
				</div>

				<div className="style-wrapper">
					<div className="style-title">Vancouver</div>
					<div className="style-content" dangerouslySetInnerHTML={{ __html: modeData.vancouver }} />
				</div>

				<div className="style-wrapper">
					<div className="style-title">Bibtex</div>
					<div className="style-content bibtex" dangerouslySetInnerHTML={{ __html: modeData.bibtex }} />
				</div>
			</div>
		);
	}
}

PubOptionsCite.propTypes = propTypes;
export default PubOptionsCite;

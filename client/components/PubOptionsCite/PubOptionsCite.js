/* eslint-disable react/no-danger */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Tooltip, Position, Spinner } from '@blueprintjs/core';
import queryString from 'query-string';

import { apiFetch } from 'utilities';

require('./pubOptionsCite.scss');

const propTypes = {
	pubData: PropTypes.object.isRequired,
};

// TODO(ian): please move this somewhere else
export const getPubCitationData = (pubData) => {
	const versionId = pubData.activeVersion.id;
	const slug = pubData.slug;
	return apiFetch(
		`/api/citations?${queryString.stringify({ versionId: versionId, slug: slug })}`,
	).then(({ citationData }) => citationData);
};

class PubOptionsCite extends Component {
	constructor(props) {
		super(props);
		this.state = {
			mode: 'pub',
			citationData: null,
		};
	}

	componentDidMount() {
		getPubCitationData(this.props.pubData).then((citationData) =>
			this.setState({ citationData: citationData }),
		);
	}

	render() {
		const { citationData } = this.state;
		// TODO: How do we cite on drafts?
		if (!citationData) {
			return (
				<div className="pub-options-spinner-wrapper">
					<Spinner />
				</div>
			);
		}
		const modeData = this.state.mode === 'pub' ? citationData.pub : citationData.version;
		return (
			<div className="pub-options-cite-component">
				<div className="save-wrapper">
					<div className="bp3-button-group bp3-small">
						<Tooltip
							content="Cite the work as a whole. The url below will always produce the most recent version of the work."
							tooltipClassName="bp3-dark cite-tooltip"
							position={Position.BOTTOM}
						>
							<button
								className={`bp3-button ${
									this.state.mode === 'pub' ? 'bp3-active' : ''
								}`}
								onClick={() => {
									this.setState({ mode: 'pub' });
								}}
								type="button"
							>
								Cite the Work
							</button>
						</Tooltip>
						<Tooltip
							content="Cite this specific version. The url below will always produce this specific version of the work."
							tooltipClassName="bp3-dark cite-tooltip"
							position={Position.BOTTOM}
						>
							<button
								className={`bp3-button ${
									this.state.mode === 'version' ? 'bp3-active' : ''
								}`}
								onClick={() => {
									this.setState({ mode: 'version' });
								}}
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
					<div
						className="style-content"
						dangerouslySetInnerHTML={{ __html: modeData.apa }}
					/>
				</div>

				<div className="style-wrapper">
					<div className="style-title">Harvard</div>
					<div
						className="style-content"
						dangerouslySetInnerHTML={{ __html: modeData.harvard }}
					/>
				</div>

				<div className="style-wrapper">
					<div className="style-title">Vancouver</div>
					<div
						className="style-content"
						dangerouslySetInnerHTML={{ __html: modeData.vancouver }}
					/>
				</div>

				<div className="style-wrapper">
					<div className="style-title">Bibtex</div>
					<div
						className="style-content bibtex"
						dangerouslySetInnerHTML={{ __html: modeData.bibtex }}
					/>
				</div>
			</div>
		);
	}
}

PubOptionsCite.propTypes = propTypes;
export default PubOptionsCite;

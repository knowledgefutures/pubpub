import React from 'react';
import PropTypes from 'prop-types';
import Overlay from 'components/Overlay/Overlay';
import PubOptionsAnalytics from 'components/PubOptionsAnalytics/PubOptionsAnalytics';
import PubOptionsAttribution from 'components/PubOptionsAttribution/PubOptionsAttribution';
import PubOptionsCite from 'components/PubOptionsCite/PubOptionsCite';
import PubOptionsDoi from 'components/PubOptionsDoi/PubOptionsDoi';
import PubOptionsDetails from 'components/PubOptionsDetails/PubOptionsDetails';
import PubOptionsDelete from 'components/PubOptionsDelete/PubOptionsDelete';
import PubOptionsExport from 'components/PubOptionsExport/PubOptionsExport';
// import PubOptionsImport from 'components/PubOptionsImport/PubOptionsImport';
import PubOptionsTags from 'components/PubOptionsTags/PubOptionsTags';
import PubOptionsSections from 'components/PubOptionsSections/PubOptionsSections';
import PubOptionsSharing from 'components/PubOptionsSharing/PubOptionsSharing';
import PubOptionsSocial from 'components/PubOptionsSocial/PubOptionsSocial';
import PubOptionsSaveVersion from 'components/PubOptionsSaveVersion/PubOptionsSaveVersion';
import PubOptionsVersions from 'components/PubOptionsVersions/PubOptionsVersions';
import PubOptionsReview from 'components/PubOptionsReview/PubOptionsReview';
import PubOptionsDiscussions from 'components/PubOptionsDiscussions/PubOptionsDiscussions';


require('./pubOptions.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	pubData: PropTypes.object.isRequired,
	loginData: PropTypes.object.isRequired,
	locationData: PropTypes.object.isRequired,
	firebaseRef: PropTypes.object,
	editorView: PropTypes.object,
	optionsMode: PropTypes.string,
	setOptionsMode: PropTypes.func.isRequired,
	setPubData: PropTypes.func.isRequired,
};

const defaultProps = {
	firebaseRef: undefined,
	editorView: undefined,
	optionsMode: undefined,
};

const PubOptions = (props)=> {
	const optionsMode = props.optionsMode;
	// TODO: Hide based on isManager, and other metrics

	let adminModes = [
		'details',
		'tags',
		'sharing',
		'sections',
		'review',
		'DOI',
		'delete'
	];
	if (!props.pubData.isDraft) {
		adminModes = adminModes.filter((item)=> {
			return item !== 'sections';
		});
	}
	if (!props.loginData.isAdmin) {
		adminModes = adminModes.filter((item)=> {
			return item !== 'tags';
		});
	}

	const modes = [
		'attribution',
		// 'versions',
		'cite',
		'discussions',
		'social',
		'export',
		'analytics',
	];

	const defaultChildProps = {
		communityData: props.communityData,
		pubData: props.pubData,
		loginData: props.loginData,
		locationData: props.locationData,
		firebaseRef: props.firebaseRef,
		editorView: props.editorView,
		setOptionsMode: props.setOptionsMode,
		setPubData: props.setPubData,
	};

	const leftColumnStyle = optionsMode === 'saveVersion'
		? { display: 'none' }
		: {};

	return (
		<Overlay
			isOpen={optionsMode}
			onClose={()=> { props.setOptionsMode(undefined); }}
			maxWidth={928}
		>
			<div className="pub-options-component">
				{/* Left Navigation Buttons */}
				<div className="left-column" style={leftColumnStyle}>
					<ul className="pt-menu">
						{props.pubData.isManager &&
							<li className="pt-menu-header"><h6>Admin</h6></li>
						}
						{props.pubData.isManager && adminModes.map((mode)=> {
							return (
								<li key={mode}>
									<button
										type="button"
										onClick={()=> { props.setOptionsMode(mode); }}
										className={`pt-menu-item ${optionsMode === mode ? 'pt-active' : ''}`}
										tabIndex="0"
									>
										{mode}
									</button>
								</li>
							);
						})}
						{props.pubData.isManager &&
							<li className="pt-menu-header"><h6>Public</h6></li>
						}
						{modes.map((mode)=> {
							return (
								<li key={mode}>
									<button
										type="button"
										onClick={()=> { props.setOptionsMode(mode); }}
										className={`pt-menu-item ${optionsMode === mode ? 'pt-active' : ''}`}
										tabIndex="0"
									>
										{mode}
									</button>
								</li>
							);
						})}
					</ul>
				</div>

				{/* Right Content Panel */}
				<div className="right-column">
					{optionsMode === 'analytics' &&
						<PubOptionsAnalytics key="analytics" {...defaultChildProps} />
					}
					{optionsMode === 'attribution' &&
						<PubOptionsAttribution key="attribution" {...defaultChildProps} />
					}
					{optionsMode === 'cite' &&
						<PubOptionsCite key="cite" {...defaultChildProps} />
					}
					{optionsMode === 'DOI' &&
						<PubOptionsDoi key="doi" {...defaultChildProps} />
					}
					{optionsMode === 'details' &&
						<PubOptionsDetails key="details" {...defaultChildProps} />
					}
					{optionsMode === 'delete' &&
						<PubOptionsDelete key="delete" {...defaultChildProps} />
					}
					{optionsMode === 'export' &&
						<PubOptionsExport key="export" {...defaultChildProps} />
					}
					{/* optionsMode === 'import' &&
						<PubOptionsImport key="import" {...defaultChildProps} />
					*/}
					{optionsMode === 'tags' &&
						<PubOptionsTags key="tags" {...defaultChildProps} />
					}
					{optionsMode === 'sections' &&
						<PubOptionsSections key="sections" {...defaultChildProps} />
					}
					{optionsMode === 'sharing' &&
						<PubOptionsSharing key="sharing" {...defaultChildProps} />
					}
					{optionsMode === 'social' &&
						<PubOptionsSocial key="social" {...defaultChildProps} />
					}
					{optionsMode === 'saveVersion' &&
						<PubOptionsSaveVersion key="saveVersion" {...defaultChildProps} />
					}
					{optionsMode === 'versions' &&
						<PubOptionsVersions key="versions" {...defaultChildProps} />
					}
					{optionsMode === 'review' &&
						<PubOptionsReview key="review" {...defaultChildProps} />
					}
					{optionsMode === 'discussions' &&
						<PubOptionsDiscussions key="discussions" {...defaultChildProps} />
					}
				</div>
			</div>
		</Overlay>
	);
};

PubOptions.propTypes = propTypes;
PubOptions.defaultProps = defaultProps;
export default PubOptions;

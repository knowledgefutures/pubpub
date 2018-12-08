import React, { Component } from 'react';
import PropTypes from 'prop-types';
import dateFormat from 'dateformat';
import Icon from 'components/Icon/Icon';

require('./pubOptionsVersions.scss');

const propTypes = {
	// communityData: PropTypes.object.isRequired,
	pubData: PropTypes.object.isRequired,
	// loginData: PropTypes.object.isRequired,
	// setPubData: PropTypes.func.isRequired,
};

class PubOptionsVersions extends Component {
	render() {
		const pubData = this.props.pubData;
		const activeVersion = pubData.activeVersion;
		const versions = pubData.versions.map((item)=> {
			if (item.id === activeVersion.id) {
				return { ...item, isActive: true };
			}
			return item;
		}).sort((foo, bar)=>{
			if (foo.createdAt < bar.createdAt) { return 1; }
			if (foo.createdAt > bar.createdAt) { return -1; }
			return 0;
		});

		if (!versions.length) {
			return (
				<div className="pub-options-versions-component">
					<h1>Versions</h1>
					<p>No saved versions.</p>
				</div>
			);
		}
		return (
			<div className="pub-options-versions-component">
				<h1>Versions</h1>
				<div className="version-sections">
					<div className="section">
						<div className="title">All Versions</div>
						<ul className="bp3-menu">
							{versions.map((version)=> {
								return (
									<li key={`version-${version.id}`}>
										<a href={`/pub/${pubData.slug}?version=${version.id}`} className={`bp3-menu-item bp3-popover-dismiss ${version.isActive ? 'bp3-active' : ''}`}>
											{dateFormat(version.createdAt, 'mmm dd, yyyy · h:MMTT')}
											{!version.isPublic && <Icon icon="lock2" />}
										</a>
									</li>
								);
							})}
						</ul>
					</div>
					<div className="section">
						<div className="title">First Published</div>
						<ul className="bp3-menu">
							<li>
								<a href={`/pub/${pubData.slug}?version=${versions[versions.length - 1].id}`} className="bp3-menu-item bp3-popover-dismiss">
									{dateFormat(versions[versions.length - 1].createdAt, 'mmm dd, yyyy · h:MMTT')}
									{!versions[versions.length - 1].isPublic && <Icon icon="lock2" />}
								</a>
							</li>
						</ul>
					</div>
					<div className="section">
						<div className="title">Most Recently Updated</div>
						<ul className="bp3-menu">
							<li>
								<a href={`/pub/${pubData.slug}?version=${versions[0].id}`} className="bp3-menu-item bp3-popover-dismiss">
									{dateFormat(versions[0].createdAt, 'mmm dd, yyyy · h:MMTT')}
									{!versions[0].isPublic && <Icon icon="lock2" />}
								</a>
							</li>
						</ul>
					</div>
				</div>
			</div>
		);
	}
}

PubOptionsVersions.propTypes = propTypes;
export default PubOptionsVersions;

import React from 'react';
import PropTypes from 'prop-types';
import DropdownButton from 'components/DropdownButton/DropdownButton';
import { Button } from '@blueprintjs/core';

require('./pubSectionNav.scss');

const propTypes = {
	pubData: PropTypes.object.isRequired,
	queryObject: PropTypes.object.isRequired,
	hasSections: PropTypes.bool.isRequired,
	sectionId: PropTypes.string.isRequired,
	setOptionsMode: PropTypes.func.isRequired,
};

const PubSectionNav = function(props) {
	const pubData = props.pubData;
	const sectionsData = pubData.isDraft ? pubData.sectionsData : pubData.activeVersion.content;

	const sectionIds = props.hasSections
		? sectionsData.map((section) => {
				return section.id || '';
		  })
		: [];
	const currentSectionIndex = sectionIds.reduce((prev, curr, index) => {
		if (props.sectionId === curr) {
			return index;
		}
		return prev;
	}, undefined);
	const nextSectionId =
		sectionIds.length > currentSectionIndex + 1 ? sectionIds[currentSectionIndex + 1] : '';
	const prevSectionId = currentSectionIndex - 1 > 0 ? sectionIds[currentSectionIndex - 1] : '';
	return (
		<div className="pub-section-nav-component">
			<div className="bp3-button-group bp3-fill bp3-large">
				<a
					href={`/pub/${pubData.slug}/${pubData.isDraft ? 'draft/' : ''}${
						prevSectionId ? 'content/' : ''
					}${prevSectionId}${
						props.queryObject.version ? `?version=${props.queryObject.version}` : ''
					}`}
					className={`bp3-button bp3-icon-arrow-left ${
						prevSectionId || currentSectionIndex > 0 ? '' : ' disabled'
					}`}
				>
					Previous
				</a>
				<DropdownButton label={sectionsData[currentSectionIndex].title} usePortal={false}>
					<ul className="bp3-menu bp3-large">
						{sectionsData.map((section, index) => {
							const isActive = index === currentSectionIndex;
							const href = `/pub/${pubData.slug}/${pubData.isDraft ? 'draft/' : ''}${
								section.id ? 'content/' : ''
							}${section.id}${
								props.queryObject.version
									? `?version=${props.queryObject.version}`
									: ''
							}`;
							return (
								<li key={`section-link-${section.id}`}>
									<a
										className={`bp3-menu-item ${isActive ? 'bp3-active' : ''}`}
										tabIndex="0"
										href={href}
									>
										{section.title}
									</a>
								</li>
							);
						})}
						{pubData.isDraft &&
							(pubData.isDraftEditor || pubData.isManager) && [
								<li key="i1" className="bp3-menu-divider" />,
								<li key="i2">
									<Button
										className="bp3-menu-item bp3-popover-dismiss bp3-minimal"
										onClick={() => {
											props.setOptionsMode('sections');
										}}
										text="Manage Sections"
									/>
								</li>,
							]}
					</ul>
				</DropdownButton>
				<a
					href={`/pub/${pubData.slug}/${
						pubData.isDraft ? 'draft/' : ''
					}content/${nextSectionId}${
						props.queryObject.version ? `?version=${props.queryObject.version}` : ''
					}`}
					className={`bp3-button ${nextSectionId ? '' : ' disabled'}`}
				>
					Next
					<span className="bp3-icon-standard bp3-icon-arrow-right bp3-align-right" />
				</a>
			</div>
		</div>
	);
};

PubSectionNav.propTypes = propTypes;
export default PubSectionNav;

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Icon from 'components/Icon/Icon';
import { AnchorButton, Button } from '@blueprintjs/core';
import DropdownButton from 'components/DropdownButton/DropdownButton';

require('./pubSideOptions.scss');

const propTypes = {
	pubData: PropTypes.object.isRequired,
	communityData: PropTypes.object.isRequired,
	setOptionsMode: PropTypes.func.isRequired,
	setDiscussionChannel: PropTypes.func.isRequired,
	activeDiscussionChannel: PropTypes.object,
};

const defaultProps = {
	activeDiscussionChannel: { title: 'public' },
};

class PubSideOptions extends Component {
	constructor(props) {
		super(props);
		this.state = {
			isPositionFixed: false,
		};
		this.handleScroll = this.handleScroll.bind(this);
		this.wrapperRef = React.createRef();
	}

	componentDidMount() {
		window.addEventListener('scroll', this.handleScroll);
		this.handleScroll();
	}

	componentWillUnmount() {
		window.removeEventListener('scroll', this.handleScroll);
	}

	handleScroll() {
		const topOffset = this.props.pubData.isDraft
			? 73 /* Height of draftHeaderBar */
			: 0;
		if (this.wrapperRef.current) {
			if (!this.state.isPositionFixed) {
				const isPastTop = this.wrapperRef.current.getBoundingClientRect().top < topOffset;
				const isBeforeBottom = this.wrapperRef.current.parentNode.getBoundingClientRect().bottom > 200;
				if (isPastTop && isBeforeBottom) {
					this.setState(()=> { return { isPositionFixed: true }; });
				}
			} else {
				const isBeforeTop = this.wrapperRef.current.getBoundingClientRect().top > topOffset;
				const isAfterBottom = this.wrapperRef.current.parentNode.getBoundingClientRect().bottom < 200;
				if (isBeforeTop || isAfterBottom) {
					this.setState(()=> { return { isPositionFixed: false }; });
				}
			}
		}
	}

	render() {
		const topOffset = this.props.pubData.isDraft
			? 73 /* Height of draftHeaderBar */
			: 0;
		const wrapperStyle = {
			position: this.state.isPositionFixed ? 'fixed' : 'static',
			paddingTop: this.state.isPositionFixed ? '1em' : '0em',
			top: `${topOffset}px`,
		};

		// TODO: handling discussion flows
		// Iterate over all discussionSidePreviews
		// Set all to be position: absolute, top: 0
		// On every click - you iterate over them all, calculate their height and set their transformY
		// On every click - you figure out where they want to be, and then get as close as possible given the other
		// heights and position that exist.
		// If one is selected - you have to give that one priority, so you set it first, and then calculate
		// for the previews before and after.
		const discussionChannels = [
			{ title: 'public' },
			...this.props.pubData.discussionChannels,
		];

		const pubData = this.props.pubData;
		const communityHostname = this.props.communityData.domain || `${this.props.communityData.subdomain}.pubpub.org`;
		const pubLink = `https://${communityHostname}/pub/${pubData.slug}/${pubData.isDraft ? 'draft' : ''}`;
		const pubTitle = pubData.title;
		return (
			<div className="pub-side-options-component" ref={this.wrapperRef}>
				<div className="side-options-wrapper" style={wrapperStyle}>
					<div className="links">
						<AnchorButton
							className="bp3-minimal"
							onClick={()=> { this.props.setOptionsMode('cite'); }}
							text="Cite"
						/>
						<span>·</span>
						<AnchorButton
							className="bp3-minimal"
							onClick={()=> { this.props.setOptionsMode('export'); }}
							text="Export"
						/>
						<span>·</span>
						<a href={`https://www.facebook.com/sharer.php?u=${pubLink}`} rel="noopener noreferrer" target="_blank">
							<Icon icon="facebook" />
						</a>
						<span>·</span>
						<a href={`https://twitter.com/intent/tweet?url=${pubLink}&text=${pubTitle}`} rel="noopener noreferrer" target="_blank">
							<Icon icon="twitter" />
						</a>
						<span>·</span>
						<a href={`https://reddit.com/submit?url=${pubLink}&title=${pubTitle}`} rel="noopener noreferrer" target="_blank">
							<Icon icon="reddit" />
						</a>
						<span>·</span>
						<a href={`https://www.linkedin.com/shareArticle?url=${pubLink}&title=${pubTitle}`} rel="noopener noreferrer" target="_blank">
							<Icon icon="linkedin" />
						</a>
					</div>
					<div className="discussion-options">
						<DropdownButton
							label={`#${this.props.activeDiscussionChannel.title}`}
							// icon={items[props.value].icon}
							// isRightAligned={true}
							isSmall={true}
						>
							<ul className="channel-permissions-dropdown bp3-menu">
								{discussionChannels.map((channel)=> {
									return (
										<li key={`channel-option-${channel.title}`}>
											<button
												className="bp3-menu-item bp3-popover-dismiss"
												onClick={()=> {
													this.props.setDiscussionChannel(channel.title);
												}}
												type="button"
											>
												#{channel.title}
											</button>
										</li>
									);
								})}
								<li className="bp3-menu-divider" />
								<li>
									<Button
										minimal={true}
										text="Manage Discussion Channels"
										onClick={()=> {
											this.props.setOptionsMode('discussions');
										}}
									/>
								</li>
							</ul>
						</DropdownButton>
						<a href="#discussions">View All</a>
					</div>
				</div>
			</div>
		);
	}
}

PubSideOptions.propTypes = propTypes;
PubSideOptions.defaultProps = defaultProps;
export default PubSideOptions;

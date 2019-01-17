import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Card } from '@blueprintjs/core';
import DiscussionThread from 'components/DiscussionThread/DiscussionThread';

require('./discussionEmbed.scss');

const propTypes = {
	attrs: PropTypes.object.isRequired,
	options: PropTypes.object.isRequired,
	isSelected: PropTypes.bool.isRequired,
	isEditable: PropTypes.bool.isRequired,
};

class DiscussionEmbed extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	render() {
		const figFloat = this.props.attrs.align === 'left' || this.props.attrs.align === 'right' ? this.props.attrs.align : 'none';
		let figMargin = '0em auto 1em';
		if (this.props.attrs.align === 'left') { figMargin = '1em 1em 1em 0px'; }
		if (this.props.attrs.align === 'right') { figMargin = '1em 0px 1em 1em'; }
		const figWidth = this.props.attrs.align === 'full' ? '100%' : '60%';
		const figStyle = {
			width: figWidth,
			margin: figMargin,
			float: figFloat,
		};


		const threads = this.props.options.getThreads();
		const pubData = this.props.options.getPubData();
		const locationData = this.props.options.getLocationData();
		const loginData = this.props.options.getLoginData();
		const onPostDiscussion = this.props.options.getOnPostDiscussion();
		const onPutDiscussion = this.props.options.getOnPutDiscussion();
		const getHighlightContent = this.props.options.getGetHighlightContent();
		const handleQuotePermalink = this.props.options.getHandleQuotePermalink();

		const activeThread = threads.reduce((prev, curr)=> {
			if (curr[0].threadNumber === this.props.attrs.threadNumber) {
				return curr;
			}
			return prev;
		}, undefined);

		return (
			<div className="figure-wrapper">
				<figure className={`discussion bp3-elevation-2 ${this.props.isSelected ? 'isSelected' : ''} ${this.props.isEditable ? 'isEditable' : ''}`} style={figStyle}>
					{activeThread &&
						<DiscussionThread
							key={`thread-${activeThread[0].id}`}
							thread={activeThread}
							isMinimal={false}
							pubData={pubData}
							locationData={locationData}
							loginData={loginData}
							onPostDiscussion={(data)=> {
								return onPostDiscussion(data)
								.then(()=> {
									this.setState({});
								});
							}}
							onPutDiscussion={(data)=> {
								return onPutDiscussion(data)
								.then(()=> {
									this.setState({});
								});
							}}
							getHighlightContent={getHighlightContent}
							handleQuotePermalink={handleQuotePermalink}
						/>
					}
					{!activeThread &&
						<Card>Please select a discussion from the formatting bar.</Card>
					}
				</figure>
			</div>
		);
	}
}

DiscussionEmbed.propTypes = propTypes;
export default DiscussionEmbed;

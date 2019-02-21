import React, { Component } from 'react';
import PropTypes from 'prop-types';
import PageWrapper from 'components/PageWrapper/PageWrapper';
import LayoutPubs from 'components/LayoutPubs/LayoutPubs';
import LayoutHtml from 'components/LayoutHtml/LayoutHtml';
import LayoutBanner from 'components/LayoutBanner/LayoutBanner';
import LayoutText from 'components/LayoutText/LayoutText';
import LayoutPages from 'components/LayoutPages/LayoutPages';
import { hydrateWrapper, getDefaultLayout, generateRenderLists } from 'utilities';

require('./page.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	loginData: PropTypes.object.isRequired,
	locationData: PropTypes.object.isRequired,
	pageData: PropTypes.object.isRequired,
};

class Page extends Component {
	render() {
		const pageData = this.props.pageData;
		const slug = this.props.locationData.params.slug;
		const title = this.props.communityData.pages.reduce((prev, curr) => {
			if (curr.slug === '' && slug === undefined) {
				return curr.title;
			}
			if (curr.slug === slug) {
				return curr.title;
			}
			return prev;
		}, undefined);
		if (!title) {
			return <h1>Nothing</h1>;
		}

		const layout = pageData.layout || getDefaultLayout();
		const pubRenderLists = generateRenderLists(layout, this.props.pageData.pubs);
		return (
			<div id="page-container" className={pageData.isNarrowWidth ? 'narrow' : ''}>
				<PageWrapper
					loginData={this.props.loginData}
					communityData={this.props.communityData}
					locationData={this.props.locationData}
				>
					{layout.map((item, index) => {
						const validType =
							['pubs', 'text', 'html', 'banner', 'pages'].indexOf(item.type) > -1;
						if (!validType) {
							return null;
						}
						return (
							<div key={`block-${item.id}`} className="component-wrapper">
								{item.type === 'pubs' && (
									<LayoutPubs
										key={`item-${item.id}`}
										content={item.content}
										pubRenderList={pubRenderLists[index]}
									/>
								)}
								{item.type === 'text' && (
									<LayoutText key={`item-${item.id}`} content={item.content} />
								)}
								{item.type === 'html' && (
									<LayoutHtml key={`item-${item.id}`} content={item.content} />
								)}
								{item.type === 'banner' && (
									<LayoutBanner
										key={`item-${item.id}`}
										content={item.content}
										communityData={this.props.communityData}
										loginData={this.props.loginData}
										locationData={this.props.locationData}
									/>
								)}
								{item.type === 'pages' && (
									<LayoutPages
										key={`item-${item.id}`}
										content={item.content}
										pages={this.props.communityData.pages}
									/>
								)}
							</div>
						);
					})}
				</PageWrapper>
			</div>
		);
	}
}

Page.propTypes = propTypes;
export default Page;

hydrateWrapper(Page);

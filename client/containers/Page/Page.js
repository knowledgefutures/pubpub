import React from 'react';
import PropTypes from 'prop-types';
import { PageWrapper } from 'components';
import { hydrateWrapper, getDefaultLayout, generateRenderLists } from 'utils';
import LayoutPubs from './LayoutPubs';
import LayoutHtml from './LayoutHtml';
import LayoutBanner from './LayoutBanner';
import LayoutText from './LayoutText';
import LayoutPages from './LayoutPages';

require('./page.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	loginData: PropTypes.object.isRequired,
	locationData: PropTypes.object.isRequired,
	pageData: PropTypes.object.isRequired,
};

const Page = (props) => {
	const pageData = props.pageData;
	const slug = props.locationData.params.slug;
	const title = props.communityData.pages.reduce((prev, curr) => {
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
	const pubRenderLists = generateRenderLists(layout, props.pageData.pubs);
	return (
		<div id="page-container" className={pageData.isNarrowWidth ? 'narrow' : ''}>
			<PageWrapper
				loginData={props.loginData}
				communityData={props.communityData}
				locationData={props.locationData}
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
									communityData={props.communityData}
									loginData={props.loginData}
									locationData={props.locationData}
								/>
							)}
							{item.type === 'pages' && (
								<LayoutPages
									key={`item-${item.id}`}
									content={item.content}
									pages={props.communityData.pages}
								/>
							)}
						</div>
					);
				})}
			</PageWrapper>
		</div>
	);
};

Page.propTypes = propTypes;
export default Page;

hydrateWrapper(Page);

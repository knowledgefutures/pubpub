import React from 'react';
import PropTypes from 'prop-types';
import { PageWrapper } from 'components';
import { hydrateWrapper, getDefaultLayout, generateRenderLists } from 'utils';
import LayoutPubs from './LayoutPubs';
import LayoutHtml from './LayoutHtml';
import LayoutBanner from './LayoutBanner';
import LayoutText from './LayoutText';
import LayoutPages from './LayoutPages';
import CustomLanding from './CustomLanding';

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
	const customPageWhiteList = [
		'99608f92-d70f-46c1-a72c-df272215f13e',
		// '7808da6b-94d1-436d-ad79-2e036a8e4428',
	];
	const useCustom = !slug && customPageWhiteList.includes(props.communityData.id);
	return (
		<div id="page-container" className={pageData.isNarrowWidth ? 'narrow' : ''}>
			<PageWrapper
				loginData={props.loginData}
				communityData={props.communityData}
				locationData={props.locationData}
			>
				{/* useCustom && (
					<CustomLanding pageData={pageData} communityData={props.communityData} />
				) */}
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

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, NonIdealState } from '@blueprintjs/core';
import PageWrapper from 'components/PageWrapper/PageWrapper';
import LayoutPubs from 'components/LayoutPubs/LayoutPubs';
import LayoutHtml from 'components/LayoutHtml/LayoutHtml';
import LayoutBanner from 'components/LayoutBanner/LayoutBanner';
// import LayoutCreatePub from 'components/LayoutCreatePub/LayoutCreatePub';
// import LayoutDrafts from 'components/LayoutDrafts/LayoutDrafts';
import LayoutText from 'components/LayoutText/LayoutText';
import { hydrateWrapper, apiFetch, getDefaultLayout, generateRenderLists } from 'utilities';

require('./page.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	loginData: PropTypes.object.isRequired,
	locationData: PropTypes.object.isRequired,
	pageData: PropTypes.object.isRequired,
};

class Page extends Component {
	constructor(props) {
		super(props);
		this.state = {
			createPubIsLoading: false,
		};
		this.handleCreatePub = this.handleCreatePub.bind(this);
	}

	handleCreatePub() {
		this.setState({ createPubIsLoading: true });
		return apiFetch('/api/pubs', {
			method: 'POST',
			body: JSON.stringify({
				collectionId: this.props.pageData.id,
				communityId: this.props.communityData.id,
				createPubHash: undefined,
			})
		})
		.then((result)=> {
			// this.setState({ createPubIsLoading: false });
			window.location.href = result;
		})
		.catch((err)=> {
			console.error(err);
			this.setState({ createPubIsLoading: false });
		});
	}

	render() {
		const pageData = this.props.pageData;
		const slug = this.props.locationData.params.slug;
		const title = this.props.communityData.pages.reduce((prev, curr)=> {
			if (curr.slug === '' && slug === undefined) { return curr.title; }
			if (curr.slug === slug) { return curr.title; }
			return prev;
		}, undefined);
		if (!title) { return <h1>Nothing</h1>; }
		const publicDrafts = pageData.pubs.filter((item)=> {
			return !item.firstPublishedAt;
		}).sort((foo, bar)=> {
			if (foo.updatedAt > bar.updatedAt) { return -1; }
			if (foo.updatedAt < bar.updatedAt) { return 1; }
			return 0;
		});
		const layout = pageData.layout || getDefaultLayout();
		const hasTextLayoutComponent = layout.reduce((prev, curr)=> {
			if (curr.type === 'text') { return true; }
			return prev;
		}, false);
		const pubRenderLists = generateRenderLists(layout, this.props.pageData.pubs);
		return (
			<div id="page-container">
				<PageWrapper
					loginData={this.props.loginData}
					communityData={this.props.communityData}
					locationData={this.props.locationData}
				>
					{/* <div className="container create-pub-wrapper">
							<div className="row">
								<div className="col-12">
									<Button
										type="button"
										className="pt-button pt-intent-primary"
										loading={this.state.createPubIsLoading}
										onClick={this.handleCreatePub}
										text="Create Pub in Collection"
									/>
								</div>
							</div>
						</div>
					*/}
					{/* ((!pageData.isPage && pageData.isOpenSubmissions) || (title && title !== 'Home')) &&
						<div className="row">
							<div className="col-12">
								{!pageData.isPage && pageData.isOpenSubmissions &&
									<div className="create-pub-wrapper">
										{this.props.loginData.id &&
											<Button
												type="button"
												className="pt-button pt-intent-primary"
												loading={this.state.createPubIsLoading}
												onClick={this.handleCreatePub}
												text="Create Pub in Collection"
											/>
										}
										{!this.props.loginData.id &&
											<a
												href={`/login?redirect=${this.props.locationData.path}`}
												className="pt-button pt-intent-primary"
											>
												Login to Create Pub
											</a>
										}
										{pageData.createPubMessage &&
											<a href={`/${pageData.slug}/submit`} className="instructions-link">
												Submission Instructions
											</a>
										}
									</div>
								}
								{title && title !== 'Home' &&
									<h1 className="collection-title">{title}</h1>
								}
							</div>
						</div>
					*/}
					{layout.map((item, index)=> {
						const validType = ['pubs', 'text', 'html', 'banner'].indexOf(item.type) > -1;
						if (!validType) { return null; }
						return (
							<div key={`block-${item.id}`} className="component-wrapper">
								{item.type === 'pubs' &&
									<LayoutPubs
										key={`item-${item.id}`}
										layoutIndex={index}
										content={item.content}
										pubRenderList={pubRenderLists[index]}
									/>
								}
								{item.type === 'text' &&
									<LayoutText
										key={`item-${item.id}`}
										content={item.content}
									/>
								}
								{item.type === 'html' &&
									<LayoutHtml
										key={`item-${item.id}`}
										content={item.content}
									/>
								}
								{item.type === 'banner' &&
									<LayoutBanner
										key={`item-${item.id}`}
										content={item.content}
										communityData={this.props.communityData}
										loginData={this.props.loginData}
										locationData={this.props.locationData}
									/>
								}
								{/* item.type === 'createPub' &&
									<LayoutCreatePub
										key={`item-${item.id}`}
										content={item.content}
										communityData={this.props.communityData}
										loginData={this.props.loginData}
										locationData={this.props.locationData}
									/>
								*/}
							</div>
						);
					})}

					{!publicDrafts.length && !!pageData.id && !pageData.isPage && !hasTextLayoutComponent &&
						<NonIdealState
							title="Empty Collection"
							description="This collection has no Pubs."
							visual="pt-icon-applications"
						/>
					}
				</PageWrapper>
			</div>
		);
	}
}

Page.propTypes = propTypes;
export default Page;

hydrateWrapper(Page);

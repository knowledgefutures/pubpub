import React, { Component } from 'react';
import PropTypes from 'prop-types';
import algoliasearch from 'algoliasearch';
import { NonIdealState, Spinner, InputGroup, Button, Tabs, Tab } from '@blueprintjs/core';
import dateFormat from 'dateformat';
import throttle from 'lodash.throttle';
import PageWrapper from 'components/PageWrapper/PageWrapper';
import Icon from 'components/Icon/Icon';
import { hydrateWrapper, getResizedUrl, generatePubBackground, generatePageBackground } from 'utilities';

require('./search.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	loginData: PropTypes.object.isRequired,
	locationData: PropTypes.object.isRequired,
	searchData: PropTypes.object.isRequired,
};

class Search extends Component {
	constructor(props) {
		super(props);
		this.state = {
			searchQuery: this.props.locationData.query.q || '',
			searchResults: [],
			isLoading: this.props.locationData.query.q || false,
			page: this.props.locationData.query.page
				? Number(this.props.locationData.query.page) - 1
				: 0,
			numPages: 0,
			mode: this.props.locationData.query.mode || 'pubs',
		};
		this.handleSearchChange = this.handleSearchChange.bind(this);
		this.handleSetPage = this.handleSetPage.bind(this);
		this.setClient = this.setClient.bind(this);
		this.setMode = this.setMode.bind(this);
		this.throttledSearch = throttle(this.handleSearch, 1000, { leading: true, trailing: true });
		this.inputRef = React.createRef();

		this.client = undefined;
		this.index = undefined;
		this.setClient();
	}

	componentDidMount() {
		this.inputRef.current.focus();
		const val = this.inputRef.current.value;
		this.inputRef.current.value = '';
		this.inputRef.current.value = val;
		const query = this.state.searchQuery;
		if (query) {
			this.setState({ isLoading: !!query, searchQuery: query }, ()=> {
				const queryString = query ? `?q=${query}` : '';
				const pageString = this.state.page ? `&page=${this.state.page + 1}` : '';
				const modeString = this.state.mode !== 'pubs' ? `${queryString ? '&' : '?'}mode=${this.state.mode}` : '';
				window.history.replaceState({}, '', `/search${queryString}${pageString}${modeString}`);
				this.throttledSearch();
			});
		}
	}

	setClient() {
		const allowedModes = ['pubs', 'pages'];
		if (allowedModes.indexOf(this.state.mode) > -1) {
			let key;
			if (this.state.mode === 'pubs') {
				key = this.props.searchData.pubsSearchKey;
			}
			if (this.state.mode === 'pages') {
				key = this.props.searchData.pagesSearchKey;
			}
			this.client = algoliasearch(this.props.searchData.searchId, key);
			this.index = this.client.initIndex(this.state.mode);
		}
	}

	setMode(mode) {
		if (mode !== this.state.mode) {
			this.setState((prevState)=> {
				return {
					mode: mode,
					page: 0,
					searchResults: [],
					isLoading: !!prevState.searchQuery,
				};
			}, ()=> {
				this.setClient();
				const queryString = this.state.searchQuery ? `?q=${this.state.searchQuery}` : '';
				const pageString = this.state.page ? `&page=${this.state.page + 1}` : '';
				const modeString = this.state.mode !== 'pubs' ? `${queryString ? '&' : '?'}mode=${this.state.mode}` : '';
				window.history.replaceState({}, '', `/search${queryString}${pageString}${modeString}`);
				this.throttledSearch();
			});
		}
	}

	handleSearchChange(evt) {
		const query = evt.target.value;
		this.setState({ isLoading: !!query, searchQuery: query, page: 0 }, ()=> {
			const queryString = query ? `?q=${query}` : '';
			const pageString = this.state.page ? `&page=${this.state.page + 1}` : '';
			const modeString = this.state.mode !== 'pubs' ? `${queryString ? '&' : '?'}mode=${this.state.mode}` : '';
			window.history.replaceState({}, '', `/search${queryString}${pageString}${modeString}`);
			this.throttledSearch();
		});
	}

	handleSetPage(pageIndex) {
		this.setState((prevState)=> {
			return {
				isLoading: pageIndex !== prevState.page,
				page: pageIndex,
				searchResults: [],
			};
		}, ()=> {
			const queryString = this.state.searchQuery ? `?q=${this.state.searchQuery}` : '';
			const pageString = this.state.page ? `&page=${this.state.page + 1}` : '';
			const modeString = this.state.mode !== 'pubs' ? `${queryString ? '&' : '?'}mode=${this.state.mode}` : '';
			window.history.replaceState({}, '', `/search${queryString}${pageString}${modeString}`);
			window.scrollTo(0, 0);
			this.throttledSearch();
		});
	}

	handleSearch() {
		if (this.state.searchQuery) {
			this.index.search({
				query: this.state.searchQuery,
				page: this.state.page,
			}).then((results)=>{
				this.setState({
					isLoading: false,
					searchResults: results.hits,
					numPages: Math.min(results.nbPages, 10),
				});
			});
		}
	}

	render() {
		// const searchData = this.props.searchData;
		const pages = new Array(this.state.numPages).fill('');
		const queryString = this.state.searchQuery ? `?q=${this.state.searchQuery}` : '';
		const pageString = this.state.page ? `&page=${this.state.page + 1}` : '';
		const modeString = this.state.mode !== 'pubs' ? `${queryString ? '&' : '?'}mode=${this.state.mode}` : '';
		const searchString = `/search${queryString}${pageString}${modeString}`;
		return (
			<div id="search-container">
				<PageWrapper
					loginData={this.props.loginData}
					communityData={this.props.communityData}
					locationData={this.props.locationData}
					hideNav={this.props.locationData.isBasePubPub}
					hideFooter={true}
				>
					<div className="container narrow">
						<div className="row">
							<div className="col-12">
								<div className="search-header">
									<h2>Search {this.props.communityData.title}</h2>
									{!this.props.locationData.isBasePubPub &&
										<a href={`https://www.pubpub.org${searchString}`}>
											Search all PubPub Communities
										</a>
									}
								</div>
								<InputGroup
									placeholder="search..."
									value={this.state.searchQuery}
									onChange={this.handleSearchChange}
									rightElement={this.state.isLoading && <Spinner />}
									inputRef={this.inputRef}
								/>
							</div>
						</div>
						<div className="row">
							<div className="col-12">
								<Tabs
									onChange={this.setMode}
									selectedTabId={this.state.mode}
									large={true}
									animate={false}
								>
									<Tab id="pubs" title="Pubs" />
									<Tab id="pages" title="Pages" />
								</Tabs>
							</div>
						</div>
						<div className="row">
							<div className="col-12">
								{!this.state.searchResults.length && this.state.searchQuery && !this.state.isLoading &&
									<NonIdealState
										title="No Results"
										visual="search"
									/>
								}
								{!!this.state.searchResults.length &&
									<div>
										{this.state.searchResults.map((item)=> {
											let link;
											let bannerStyle;
											let keyId;
											let isPublic;
											const resizedBannerImage = getResizedUrl(item.avatar, 'fit-in', '800x0');
											const resizedCommunityLogo = getResizedUrl(item.communityAvatar, 'fit-in', '125x35');

											if (this.state.mode === 'pubs') {
												link = `https://${item.communityDomain}/pub/${item.slug}`;
												bannerStyle = item.avatar
													? { backgroundImage: `url("${resizedBannerImage}")` }
													: { background: generatePubBackground(item.title) };
												keyId = item.pubId;
												isPublic = item.versionIsPublic;
											}
											if (this.state.mode === 'pages') {
												link = `https://${item.communityDomain}/${item.slug}`;
												bannerStyle = item.avatar
													? { backgroundImage: `url("${resizedBannerImage}")` }
													: { background: generatePageBackground(item.title) };
												keyId = item.pageId;
												isPublic = item.isPublic;
											}

											return (
												<div className={`result ${this.state.mode}`} key={`result-${keyId}`}>
													<div>
														<a href={link} alt={item.title}>
															<div className="banner-image" style={bannerStyle} />
														</a>
													</div>
													<div className="content">
														<div className="title">
															<a href={link} alt={item.title} className="pub-title">
																{item.title}
																{!isPublic &&
																	<Icon icon="lock2" />
																}
															</a>
															{(this.props.locationData.isBasePubPub) &&
																<div className="community-title">
																	<a href={`https://${item.communityDomain}`} alt={item.communityTitle} style={{ backgroundColor: item.communityColor, color: item.communityTextColor }}>
																		{resizedCommunityLogo &&
																			<img
																				alt={`${item.communityTitle} logo`}
																				src={resizedCommunityLogo}
																			/>
																		}
																		{!resizedCommunityLogo &&
																			<span>{item.communityTitle}</span>
																		}
																	</a>
																</div>
															}
														</div>
														{this.state.mode === 'pubs' &&
															<div className="byline">
																{dateFormat(item.versionCreatedAt, 'mmm dd, yyyy')}
																{item.byline &&
																	<span> · </span>
																}
																{item.byline}
															</div>
														}
														<div className="description">
															{item.description}
														</div>
													</div>
												</div>
											);
										})}
										{this.state.numPages > 1 &&
											<div className="pt-button-group pt-large">
												{pages.map((page, index)=> {
													const key = `page-button-${index}`;
													return (
														<Button
															key={key}
															text={index + 1}
															active={index === this.state.page}
															onClick={()=> {
																this.handleSetPage(index);
															}}
														/>
													);
												})}
											</div>
										}
									</div>
								}
							</div>
						</div>
					</div>
				</PageWrapper>
			</div>
		);
	}
}

Search.propTypes = propTypes;
export default Search;

hydrateWrapper(Search);

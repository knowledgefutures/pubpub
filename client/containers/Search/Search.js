import React, { Component } from 'react';
import PropTypes from 'prop-types';
import algoliasearch from 'algoliasearch';
import { NonIdealState, Spinner, InputGroup, Button } from '@blueprintjs/core';
import dateFormat from 'dateformat';
import throttle from 'lodash.throttle';
import PageWrapper from 'components/PageWrapper/PageWrapper';
import { hydrateWrapper, getResizedUrl, generatePubBackground } from 'utilities';

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
		};
		this.handleSearchChange = this.handleSearchChange.bind(this);
		this.handleSetPage = this.handleSetPage.bind(this);
		this.throttledSearch = throttle(this.handleSearch, 1000, { leading: true, trailing: true });

		const client = algoliasearch(props.searchData.searchId, props.searchData.searchKey);
		this.pubIndex = client.initIndex('pubs');
	}

	componentDidMount() {
		const query = this.state.searchQuery;
		if (query) {
			this.setState({ isLoading: !!query, searchQuery: query }, ()=> {
				const queryString = query ? `?q=${query}` : '';
				const pageString = this.state.page ? `&page=${this.state.page + 1}` : '';
				window.history.replaceState({}, '', `/search${queryString}${pageString}`);
				this.throttledSearch();
			});
		}
	}

	handleSearchChange(evt) {
		const query = evt.target.value;
		this.setState({ isLoading: !!query, searchQuery: query, page: 0 }, ()=> {
			const queryString = query ? `?q=${query}` : '';
			const pageString = this.state.page ? `&page=${this.state.page + 1}` : '';
			window.history.replaceState({}, '', `/search${queryString}${pageString}`);
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
			window.history.replaceState({}, '', `/search${queryString}${pageString}`);
			window.scrollTo(0, 0);
			this.throttledSearch();
		});
	}

	handleSearch() {
		if (this.state.searchQuery) {
			this.pubIndex.search({
				query: this.state.searchQuery,
				page: this.state.page,
			}).then((results)=>{
				this.setState({
					isLoading: false,
					searchResults: results.hits,
					numPages: results.nbPages,
				});
			});
		}
	}

	render() {
		// const searchData = this.props.searchData;
		const pages = new Array(this.state.numPages).fill('');
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
								<InputGroup
									placeholder="Search for pubs..."
									value={this.state.searchQuery}
									onChange={this.handleSearchChange}
									rightElement={this.state.isLoading && <Spinner />}
								/>
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
										{this.state.searchResults.map((pub)=> {
											const resizedBannerImage = getResizedUrl(pub.avatar, 'fit-in', '800x0');
											const bannerStyle = pub.avatar || !pub.slug
												? { backgroundImage: `url("${resizedBannerImage}")` }
												: { background: generatePubBackground(pub.title) };
											const pubLink = `https://${pub.communityDomain}/pub/${pub.slug}`;
											return (
												<div className="pub-result" key={`result-${pub.pubId}`}>
													<div>
														<a href={pubLink} alt={pub.title}>
															<div className="banner-image" style={bannerStyle} />
														</a>
													</div>
													<div>
														<a href={pubLink} alt={pub.title} className="title">
															{pub.title}
														</a>
														<div className="byline">
															{dateFormat(pub.versionCreatedAt, 'mmm dd, yyyy')}
															{pub.byline &&
																<span> · </span>
															}
															{pub.byline}
														</div>
														<div className="description">
															{pub.description}
														</div>
													</div>
												</div>
											);
										})}
										{this.state.numPages > 1 &&
											<div className="pt-button-group">
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

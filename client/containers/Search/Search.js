import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import algoliasearch from 'algoliasearch';
import { NonIdealState, Spinner, InputGroup, Button, Tabs, Tab } from '@blueprintjs/core';
import dateFormat from 'dateformat';

import { Icon } from 'components';
import { getResizedUrl } from 'utils/images';
import { generatePageBackground } from 'utils/pages';
import { generatePubBackground } from 'utils/pubs';
import { usePageContext, useThrottled } from 'utils/hooks';

require('./search.scss');

const propTypes = {
	searchData: PropTypes.object.isRequired,
};

const getSearchPath = (query, page, mode) => {
	const params = new URLSearchParams();

	if (query) {
		params.append('q', query);
	}

	if (page) {
		params.append('page', page + 1);
	}

	if (mode !== 'pubs') {
		params.append('mode', mode);
	}

	const queryString = params.toString();

	return `/search${queryString.length > 0 ? `?${queryString}` : ''}`;
};

const updateHistory = (query, page, mode) => {
	window.history.replaceState({}, '', getSearchPath(query, page, mode));
};

const Search = (props) => {
	const { searchData } = props;
	const { locationData, communityData } = usePageContext();
	const [searchQuery, setSearchQuery] = useState(locationData.query.q || '');
	const [searchResults, setSearchResults] = useState([]);
	const [isLoading, setIsLoading] = useState(locationData.query.q || false);
	const [page, setPage] = useState(
		locationData.query.page ? Number(locationData.query.page) - 1 : 0,
	);
	const [numPages, numPagesSetter] = useState(0);
	const [mode, setMode] = useState(locationData.query.mode || 'pubs');
	const throttledSearchQuery = useThrottled(searchQuery, 1000, false);
	const inputRef = useRef(null);
	const clientRef = useRef(undefined);
	const indexRef = useRef(undefined);

	const setClient = () => {
		const allowedModes = ['pubs', 'pages'];
		if (allowedModes.indexOf(mode) > -1) {
			let key;
			if (mode === 'pubs') {
				key = searchData.pubsSearchKey;
			}
			if (mode === 'pages') {
				key = searchData.pagesSearchKey;
			}
			clientRef.current = algoliasearch(searchData.searchId, key);
			indexRef.current = clientRef.current.initIndex(mode);
		}
	};

	useEffect(() => {
		inputRef.current.focus();
		/* This inputRef manipulation is to ensure that the cursor starts */
		/* at the end of the text in the search input */
		const val = inputRef.current.value;
		inputRef.current.value = '';
		inputRef.current.value = val;
	}, []); /* eslint-disable-line react-hooks/exhaustive-deps */

	// Update search client when mode changes
	useEffect(setClient, [mode]);

	useEffect(() => {
		// Execute search when search text (throttled), page, or mode changes
		if (throttledSearchQuery.length > 0) {
			setIsLoading(true);

			indexRef.current
				.search(throttledSearchQuery, {
					page: page,
				})
				.then((results) => {
					setIsLoading(false);
					setSearchResults(results.hits);
					numPagesSetter(Math.min(results.nbPages, 10));
				});
		}
		// Sync URL with search state
		updateHistory(throttledSearchQuery, page, mode);
	}, [throttledSearchQuery, page, mode]);

	const handleSearchChange = (evt) => {
		setSearchQuery(evt.target.value);
		setPage(0);
	};

	const handleSetPage = (pageIndex) => {
		setPage(pageIndex);
		window.scrollTo(0, 0);
		setSearchResults([]);
	};

	const handleModeChange = (nextMode) => {
		setMode(nextMode);
		setPage(0);
		setSearchResults([]);
	};

	const pages = new Array(numPages).fill('');
	const searchString = getSearchPath(throttledSearchQuery, page, mode);

	return (
		<div id="search-container">
			<div className="container narrow">
				<div className="row">
					<div className="col-12">
						<div className="search-header">
							<h2>Search {communityData.title}</h2>
							{!locationData.isBasePubPub && (
								<a href={`https://www.pubpub.org${searchString}`}>
									Search all PubPub Communities
								</a>
							)}
						</div>
						<InputGroup
							placeholder="search..."
							value={searchQuery}
							onChange={handleSearchChange}
							rightElement={isLoading && <Spinner size={35} />}
							inputRef={inputRef}
						/>
					</div>
				</div>
				<div className="row">
					<div className="col-12">
						<Tabs
							onChange={handleModeChange}
							selectedTabId={mode}
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
						{!searchResults.length && searchQuery && !isLoading && (
							<NonIdealState title="No Results" visual="search" />
						)}
						{!!searchResults.length && (
							<div>
								{searchResults.map((item) => {
									let link;
									let bannerStyle;
									let keyId;
									let isPublic;
									const resizedBannerImage = getResizedUrl(
										item.avatar,
										'fit-in',
										'800x0',
									);
									const resizedCommunityLogo = getResizedUrl(
										item.communityAvatar,
										'fit-in',
										'125x35',
									);

									if (mode === 'pubs') {
										link = `https://${item.communityDomain}/pub/${item.slug}`;
										bannerStyle = item.avatar
											? {
													backgroundImage: `url("${resizedBannerImage}")`,
											  }
											: {
													background: generatePubBackground(item.title),
											  };
										keyId = item.pubId;
										isPublic = item.branchIsPublic;
									}
									if (mode === 'pages') {
										link = `https://${item.communityDomain}/${item.slug}`;
										bannerStyle = item.avatar
											? {
													backgroundImage: `url("${resizedBannerImage}")`,
											  }
											: {
													background: generatePageBackground(item.title),
											  };
										keyId = item.pageId;
										isPublic = item.isPublic;
									}

									return (
										<div className={`result ${mode}`} key={`result-${keyId}`}>
											<div>
												<a href={link} alt={item.title}>
													<div
														className="banner-image"
														style={bannerStyle}
													/>
												</a>
											</div>
											<div className="content">
												<div className="title">
													<a
														href={link}
														alt={item.title}
														className="pub-title"
													>
														{item.title}
														{!isPublic && <Icon icon="lock2" />}
													</a>
													{locationData.isBasePubPub && (
														<div className="community-title">
															<a
																href={`https://${item.communityDomain}`}
																alt={item.communityTitle}
																style={{
																	backgroundColor:
																		item.communityColor,
																	color: item.communityTextColor,
																}}
															>
																{resizedCommunityLogo && (
																	<img
																		alt={`${item.communityTitle} logo`}
																		src={resizedCommunityLogo}
																	/>
																)}
																{!resizedCommunityLogo && (
																	<span>
																		{item.communityTitle}
																	</span>
																)}
															</a>
														</div>
													)}
												</div>
												{mode === 'pubs' && (
													<div className="byline">
														{dateFormat(
															item.customPublishedAt ||
																item.branchCreatedAt,
															'mmm dd, yyyy',
														)}
														{item.byline && <span> · </span>}
														{item.byline}
													</div>
												)}
												<div className="description">
													{item.description}
												</div>
											</div>
										</div>
									);
								})}
								{numPages > 1 && (
									<div className="bp3-button-group bp3-large">
										{pages.map((pageItem, index) => {
											const key = `page-button-${index}`;
											return (
												<Button
													key={key}
													text={index + 1}
													active={index === pageItem}
													onClick={() => {
														handleSetPage(index);
													}}
												/>
											);
										})}
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

Search.propTypes = propTypes;
export default Search;

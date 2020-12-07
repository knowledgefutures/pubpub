import React, { useState, useRef, useEffect } from 'react';
import algoliasearch from 'algoliasearch';
import { NonIdealState, Spinner, InputGroup, Button, Tabs, Tab } from '@blueprintjs/core';
import dateFormat from 'dateformat';

import { Icon } from 'components';
import { getResizedUrl } from 'utils/images';
import { generatePageBackground } from 'utils/pages';
import { generatePubBackground } from 'utils/pubs';
import { usePageContext, useThrottled } from 'utils/hooks';

require('./search.scss');

type Props = {
	searchData: any;
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

const Search = (props: Props) => {
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
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'SearchClient' is not assignable to type 'und... Remove this comment to see the full error message
			clientRef.current = algoliasearch(searchData.searchId, key);
			// @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
			indexRef.current = clientRef.current.initIndex(mode);
		}
	};

	useEffect(() => {
		// @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
		inputRef.current.focus();
		/* This inputRef manipulation is to ensure that the cursor starts */
		/* at the end of the text in the search input */
		// @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
		const val = inputRef.current.value;
		// @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
		inputRef.current.value = '';
		// @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
		inputRef.current.value = val;
	}, []); /* eslint-disable-line react-hooks/exhaustive-deps */

	// Update search client when mode changes
	useEffect(setClient, [mode]);

	useEffect(() => {
		// Execute search when search text (throttled), page, or mode changes
		if (throttledSearchQuery.length > 0) {
			setIsLoading(true);

			// @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
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
							inputRef={inputRef as any}
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
							// @ts-expect-error ts-migrate(2322) FIXME: Type '{ title: string; visual: string; }' is not a... Remove this comment to see the full error message
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
										// @ts-expect-error ts-migrate(2339) FIXME: Property 'avatar' does not exist on type 'never'.
										item.avatar,
										'fit-in',
										'800x0',
									);
									const resizedCommunityLogo = getResizedUrl(
										// @ts-expect-error ts-migrate(2339) FIXME: Property 'communityAvatar' does not exist on type ... Remove this comment to see the full error message
										item.communityAvatar,
										'fit-in',
										'125x35',
									);

									if (mode === 'pubs') {
										// @ts-expect-error ts-migrate(2339) FIXME: Property 'communityDomain' does not exist on type ... Remove this comment to see the full error message
										link = `https://${item.communityDomain}/pub/${item.slug}`;
										// @ts-expect-error ts-migrate(2339) FIXME: Property 'avatar' does not exist on type 'never'.
										bannerStyle = item.avatar
											? {
													backgroundImage: `url("${resizedBannerImage}")`,
											  }
											: {
													// @ts-expect-error ts-migrate(2339) FIXME: Property 'title' does not exist on type 'never'.
													background: generatePubBackground(item.title),
											  };
										// @ts-expect-error ts-migrate(2339) FIXME: Property 'pubId' does not exist on type 'never'.
										keyId = item.pubId;
										// @ts-expect-error ts-migrate(2339) FIXME: Property 'branchIsPublic' does not exist on type '... Remove this comment to see the full error message
										isPublic = item.branchIsPublic;
									}
									if (mode === 'pages') {
										// @ts-expect-error ts-migrate(2339) FIXME: Property 'communityDomain' does not exist on type ... Remove this comment to see the full error message
										link = `https://${item.communityDomain}/${item.slug}`;
										// @ts-expect-error ts-migrate(2339) FIXME: Property 'avatar' does not exist on type 'never'.
										bannerStyle = item.avatar
											? {
													backgroundImage: `url("${resizedBannerImage}")`,
											  }
											: {
													// @ts-expect-error ts-migrate(2339) FIXME: Property 'title' does not exist on type 'never'.
													background: generatePageBackground(item.title),
											  };
										// @ts-expect-error ts-migrate(2339) FIXME: Property 'pageId' does not exist on type 'never'.
										keyId = item.pageId;
										// @ts-expect-error ts-migrate(2339) FIXME: Property 'isPublic' does not exist on type 'never'... Remove this comment to see the full error message
										isPublic = item.isPublic;
									}

									return (
										<div className={`result ${mode}`} key={`result-${keyId}`}>
											<div>
												{/* @ts-expect-error ts-migrate(2322) FIXME: Type '{ children: Element; href: any; alt: any; }'... Remove this comment to see the full error message */}
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
														// @ts-expect-error ts-migrate(2322) FIXME: Type '{ children: any[]; href: any; alt: any; clas... Remove this comment to see the full error message
														alt={item.title}
														className="pub-title"
													>
														{/* @ts-expect-error ts-migrate(2339) FIXME: Property 'title' does not exist on type 'never'. */}
														{item.title}
														{!isPublic && <Icon icon="lock2" />}
													</a>
													{locationData.isBasePubPub && (
														<div className="community-title">
															<a
																// @ts-expect-error ts-migrate(2339) FIXME: Property 'communityDomain' does not exist on type ... Remove this comment to see the full error message
																href={`https://${item.communityDomain}`}
																// @ts-expect-error ts-migrate(2322) FIXME: Type '{ children: (false | Element)[]; href: strin... Remove this comment to see the full error message
																alt={item.communityTitle}
																style={{
																	backgroundColor:
																		// @ts-expect-error ts-migrate(2339) FIXME: Property 'communityColor' does not exist on type '... Remove this comment to see the full error message
																		item.communityColor,
																	// @ts-expect-error ts-migrate(2339) FIXME: Property 'communityTextColor' does not exist on ty... Remove this comment to see the full error message
																	color: item.communityTextColor,
																}}
															>
																{resizedCommunityLogo && (
																	<img
																		// @ts-expect-error ts-migrate(2339) FIXME: Property 'communityTitle' does not exist on type '... Remove this comment to see the full error message
																		alt={`${item.communityTitle} logo`}
																		src={resizedCommunityLogo}
																	/>
																)}
																{!resizedCommunityLogo && (
																	<span>
																		{/* @ts-expect-error ts-migrate(2339) FIXME: Property 'communityTitle' does not exist on type '... Remove this comment to see the full error message */}
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
															// @ts-expect-error ts-migrate(2339) FIXME: Property 'customPublishedAt' does not exist on typ... Remove this comment to see the full error message
															item.customPublishedAt ||
																// @ts-expect-error ts-migrate(2339) FIXME: Property 'branchCreatedAt' does not exist on type ... Remove this comment to see the full error message
																item.branchCreatedAt,
															'mmm dd, yyyy',
														)}
														{/* @ts-expect-error ts-migrate(2339) FIXME: Property 'byline' does not exist on type 'never'. */}
														{item.byline && <span> · </span>}
														{/* @ts-expect-error ts-migrate(2339) FIXME: Property 'byline' does not exist on type 'never'. */}
														{item.byline}
													</div>
												)}
												<div className="description">
													{/* @ts-expect-error ts-migrate(2339) FIXME: Property 'description' does not exist on type 'nev... Remove this comment to see the full error message */}
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
export default Search;

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, InputGroup } from '@blueprintjs/core';
import fuzzysearch from 'fuzzysearch';
import classNames from 'classnames';
import { generatePlainAuthorString } from 'components/PubPreview/pubPreviewUtils';
import { usePageContext } from 'utils/hooks';
import { groupPubs } from 'utils/dashboard';
import ContentRow from './ContentRow';

require('./contentOverview.scss');

const propTypes = {
	overviewData: PropTypes.object.isRequired,
};

const ContentOverview = (props) => {
	const { overviewData } = props;
	const { scopeData } = usePageContext();
	const { activeCollection } = scopeData;
	const collectionSlug = activeCollection && activeCollection.slug;
	const { collections, pubs } = groupPubs(overviewData.pubs, overviewData.collections);
	const rootPubs = activeCollection
		? collections.find((collection) => {
				return collectionSlug === collection.slug;
		  }).pubs
		: pubs;

	const [filterText, setFilterText] = useState('');
	const filteredCollections = collections
		.map((collection) => {
			if (
				!filterText ||
				fuzzysearch(filterText.toLowerCase(), collection.title.toLowerCase())
			) {
				return collection;
			}
			const filteredPubs = collection.pubs
				.map((pub) => {
					const titleMatch = fuzzysearch(
						filterText.toLowerCase(),
						pub.title.toLowerCase(),
					);
					const authorString = generatePlainAuthorString(pub) || '';
					const authorMatch = fuzzysearch(
						filterText.toLowerCase(),
						authorString.toLowerCase(),
					);
					if (titleMatch || authorMatch) {
						return pub;
					}
					return null;
				})
				.filter((pub) => !!pub);
			if (filteredPubs.length) {
				return { ...collection, pubs: filteredPubs };
			}
			return null;
		})
		.filter((coll) => !!coll);
	const filteredPubs = rootPubs
		.map((pub) => {
			const titleMatch = fuzzysearch(filterText.toLowerCase(), pub.title.toLowerCase());
			const authorString = generatePlainAuthorString(pub) || '';
			const authorMatch = fuzzysearch(filterText.toLowerCase(), authorString.toLowerCase());
			if (titleMatch || authorMatch) {
				return pub;
			}
			return null;
		})
		.filter((pub) => !!pub);
	return (
		<div className="content-overview-component">
			<div className="dashboard-content-header">
				<div className="name">Overview</div>
				<div className="buttons">
					<Button text="New Pub" />
					{!collectionSlug && <Button text="New Collection" />}
				</div>
			</div>
			<div className="filter-bar">
				<div className="left">{collectionSlug ? 'Pubs' : 'Collections and Pubs'}</div>
				<div className="right">
					<InputGroup
						fill
						placeholder={collectionSlug ? 'Filter Pubs' : 'Filter Collections and Pubs'}
						value={filterText}
						onChange={(evt) => {
							setFilterText(evt.target.value);
						}}
					/>
				</div>
			</div>
			{!collectionSlug &&
				filteredCollections
					.sort((foo, bar) => {
						if (foo.title.toLowerCase() < bar.title.toLowerCase()) {
							return -1;
						}
						if (foo.title.toLowerCase() > bar.title.toLowerCase()) {
							return 1;
						}
						return 0;
					})
					.map((collection) => {
						return <ContentRow key={collection.id} content={collection} />;
					})}
			{filteredPubs
				.sort((foo, bar) => {
					if (foo.title.toLowerCase() < bar.title.toLowerCase()) {
						return -1;
					}
					if (foo.title.toLowerCase() > bar.title.toLowerCase()) {
						return 1;
					}
					return 0;
				})
				.map((pub) => {
					return <ContentRow key={pub.id} content={pub} parentSlug={collectionSlug} />;
				})}
		</div>
	);
};

ContentOverview.propTypes = propTypes;
export default ContentOverview;

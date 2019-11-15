import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, InputGroup } from '@blueprintjs/core';
import fuzzysearch from 'fuzzysearch';
import classNames from 'classnames';
import { Avatar } from 'components';
import { generatePlainAuthorString } from 'components/PubPreview/pubPreviewUtils';
import { groupPubs } from 'utils/dashboard';
import ContentRow from './ContentRow';

require('./contentOverview.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	// loginData: PropTypes.object.isRequired,
	locationData: PropTypes.object.isRequired,
};

const ContentOverview = (props) => {
	const { communityData, locationData } = props;
	const collectionSlug = locationData.params.collectionSlug || locationData.query.collectionSlug;
	const { collections, pubs } = groupPubs(communityData.pubs, communityData.collections);
	const rootPubs = collectionSlug
		? collections.find((collection) => {
				const currSlug = collection.title.toLowerCase().replace(/ /gi, '-');
				return collectionSlug === currSlug;
		  }).pubs
		: pubs;
	const activeCollection =
		communityData.collections.find((collection) => {
			return collection.title.toLowerCase().replace(/ /gi, '-') === collectionSlug;
		}) || {};

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
			<div className="header">
				<div className={classNames({ 'header-name': true, collection: collectionSlug })}>
					Overview
				</div>
				<div className="header-buttons">
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

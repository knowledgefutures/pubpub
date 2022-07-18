import React from 'react';
import { Button } from 'reakit/Button';

import { GridWrapper, ContributorAvatars, Icon, ClickToCopyButton } from 'components';
import { Collection } from 'types';
import { LayoutBlockCollectionHeader } from 'utils/layout/types';
import { getAllCollectionContributors } from 'utils/contributors';
import getCollectionDoi from 'utils/collections/getCollectionDoi';
import { getSchemaForKind } from 'utils/collections/schemas';
import { capitalize } from 'utils/strings';
import { formatDate } from 'utils/dates';
import {
	getOrderedCollectionMetadataFields,
	formattedMetadata,
} from 'utils/collections/getMetadata';
import WithinCommunityByline from '../WithinCommunityByline/WithinCommunityByline';

require('./layoutCollectionHeader.scss');

type Props = {
	collection: Collection;
	content: LayoutBlockCollectionHeader['content'];
};

const MetadataDetails = (props: Props) => {
	const {
		collection,
		content: { hiddenMetadataFields = [] },
	} = props;
	const { metadata, kind } = collection;

	if (!metadata || kind === 'tag') {
		return null;
	}

	const excludedMetadataFields = ['doi', 'url'];
	const fields = getOrderedCollectionMetadataFields(collection).filter(
		(x) => !excludedMetadataFields.includes[x.name],
	);

	return (
		<>
			{fields.map((field) => {
				const name = field.name;
				const data = metadata[name];
				const isShown = !hiddenMetadataFields.includes(name);
				const formattedData = isShown && data && formattedMetadata(name, data);
				if (formattedData) {
					return <div key={name}>{formattedData}</div>;
				}
				return null;
			})}
		</>
	);
};

const LayoutCollectionHeader = (props: Props) => {
	const {
		collection,
		content: {
			hideByline,
			hideContributors,
			hideCollectionKind,
			hideDate,
			hiddenMetadataFields = [],
		},
		content,
	} = props;
	const contributors = getAllCollectionContributors(collection);
	const bylineContributors = contributors.filter((c) => c.isAuthor);
	const schema = getSchemaForKind(collection.kind)!;
	const doi = getCollectionDoi(collection);

	const detailsRowElements = [
		!hideCollectionKind && (
			<div className="collection-kind" key={0}>
				<Icon icon={schema.bpDisplayIcon} />
				{capitalize(schema.label.singular)}
			</div>
		),
		!hideDate && <div key={1}>Created {formatDate(collection.createdAt)}</div>,
		doi && !hiddenMetadataFields?.includes('doi') && (
			<ClickToCopyButton
				className="click-to-copy"
				copyString={`https://doi.org/${doi}`}
				beforeCopyPrompt="Copy doi.org link"
				icon={null}
				small
				key={2}
			>
				{(handleClick) => (
					<Button as="a" onClick={handleClick}>
						{doi}
					</Button>
				)}
			</ClickToCopyButton>
		),
		<MetadataDetails collection={collection} content={content} key={3} />,
	].filter((x) => x);

	return (
		<div className="layout-collection-header-component">
			<GridWrapper columnClassName="inner">
				<h1>{collection.title}</h1>
				{bylineContributors && !hideByline && (
					<WithinCommunityByline
						contributors={bylineContributors}
						renderSuffix={() => {
							return (
								!hideContributors &&
								contributors.length > 0 && (
									<ContributorAvatars
										attributions={contributors}
										truncateAt={8}
									/>
								)
							);
						}}
					/>
				)}
				{detailsRowElements.length > 0 && (
					<div className="details-row">{detailsRowElements}</div>
				)}
			</GridWrapper>
		</div>
	);
};

export default LayoutCollectionHeader;

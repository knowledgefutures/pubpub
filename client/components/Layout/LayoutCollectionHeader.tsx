import React from 'react';
import { Button } from 'reakit/Button';

import { Byline, GridWrapper, ContributorAvatars, Icon, ClickToCopyButton } from 'components';
import { Collection } from 'utils/types';
import { LayoutBlockCollectionHeader } from 'utils/layout/types';
import { getAllCollectionContributors } from 'utils/contributors';
import getCollectionDoi from 'utils/collections/getCollectionDoi';
import { getSchemaForKind } from 'utils/collections/schemas';
import { capitalize } from 'utils/strings';
import { formatDate } from 'utils/dates';

require('./layoutCollectionHeader.scss');

type Props = {
	collection: Collection;
	content: LayoutBlockCollectionHeader['content'];
};

const LayoutCollectionHeader = (props: Props) => {
	const {
		collection,
		content: { hideByline, hideContributors, hideCollectionKind, hideDate, hideDoi },
	} = props;
	const contributors = getAllCollectionContributors(collection);
	const bylineContributors = contributors.filter((c) => c.isAuthor);
	const schema = getSchemaForKind(collection.kind);
	const doi = getCollectionDoi(collection);

	const detailsRowElements = [
		!hideCollectionKind && (
			<div className="collection-kind">
				<Icon icon={schema?.bpDisplayIcon as string} />
				{capitalize(schema?.label.singular)}
			</div>
		),
		!hideDate && <div>Created {formatDate(collection.createdAt)}</div>,
		doi && !hideDoi && (
			// @ts-expect-error ts-migrate(2745) FIXME: This JSX tag's 'children' prop expects type 'never... Remove this comment to see the full error message
			<ClickToCopyButton
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
				className="click-to-copy"
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
				copyString={`https://doi.org/${doi}`}
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
				beforeCopyPrompt="Copy doi.org link"
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'null' is not assignable to type 'never'.
				icon={null}
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'boolean' is not assignable to type 'never'.
				small
			>
				{(handleClick) => (
					<Button as="a" onClick={handleClick}>
						{doi}
					</Button>
				)}
			</ClickToCopyButton>
		),
	].filter((x) => x);

	return (
		<div className="layout-collection-header-component">
			<GridWrapper columnClassName="inner">
				<h1>{collection.title}</h1>
				{bylineContributors && !hideByline && (
					<Byline
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

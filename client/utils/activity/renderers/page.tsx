import React from 'react';

import { PageCreatedActivityItem, PageUpdatedActivityItem, PageRemovedActivityItem } from 'types';

import { pageTitle } from '../titles';
import { itemRenderer } from './itemRenderer';

type BaseTitles = 'page';

export const renderPageCreated = itemRenderer<PageCreatedActivityItem, BaseTitles>({
	icon: 'page-layout',
	titleRenderers: {
		page: pageTitle,
	},
	message: ({ titles }) => {
		const { actor, page } = titles;
		return (
			<>
				{actor} created {page}
			</>
		);
	},
});

export const renderPageUpdated = itemRenderer<PageUpdatedActivityItem, BaseTitles>({
	icon: 'page-layout',
	titleRenderers: {
		page: pageTitle,
	},
	message: ({ titles, item }) => {
		const { payload } = item;
		const { actor, page } = titles;
		const changes: ((referent: React.ReactNode) => React.ReactNode)[] = [];

		if (payload.title) {
			const { title } = payload;
			changes.push((referent: React.ReactNode) => (
				<>
					changed the title of {referent} from {title.from} to {title.to}
				</>
			));
		}

		if (payload.slug) {
			const { slug } = payload;
			changes.push((referent: React.ReactNode) => (
				<>
					changed the slug of {referent} from {slug.from} to {slug.to}
				</>
			));
		}

		if (payload.layout) {
			changes.push((referent: React.ReactNode) => <>updated the layout of {referent}</>);
		}

		if (payload.isPublic) {
			const isNowPublic = payload.isPublic.to;
			changes.push((referent: React.ReactNode) => {
				const resultingState = isNowPublic ? 'public' : 'private';
				return (
					<>
						made {referent} {resultingState}
					</>
				);
			});
		}

		if (changes.length > 1) {
			return (
				<>
					{actor} made the following changes to {page}:
					<ul>
						{changes.map((change, index) => (
							// eslint-disable-next-line react/no-array-index-key
							<li key={index}>{change('the Page')}</li>
						))}
					</ul>
				</>
			);
		}

		if (changes.length === 1) {
			const [change] = changes;
			return (
				<>
					{actor} {change(page)}
				</>
			);
		}

		return (
			<>
				{actor} updated the settings for {page}
			</>
		);
	},
});

export const renderPageRemoved = itemRenderer<PageRemovedActivityItem, BaseTitles>({
	icon: 'page-layout',
	titleRenderers: {
		page: pageTitle,
	},
	message: ({ titles }) => {
		const { actor, page } = titles;
		return (
			<>
				{actor} removed {page}
			</>
		);
	},
});

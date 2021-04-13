import React, { useContext } from 'react';
import classNames from 'classnames';
import { Button, InputGroup } from '@blueprintjs/core';

import { Icon, IconName } from 'components';
import { getSchemaForKind } from 'utils/collections/schemas';
import { CommunityNavigationEntry, isCommunityNavigationMenu } from 'client/utils/navigation';

import PageCollectionAutocomplete from './PageCollectionAutocomplete';
import { NavBuilderContext } from './navBuilderContext';

type Props = {
	dropdownId: string;
	index: number;
	item: CommunityNavigationEntry;
	newLink?: any;
	isStatic?: boolean;
	NavBuilderList?: (...args: any[]) => any;
};

const NavBuilderRow = (props: Props) => {
	const { dropdownId, NavBuilderList, index, item, newLink, isStatic = false } = props;
	const { updateItem, pages, collections } = useContext(NavBuilderContext);

	const renderForPageOrCollection = (title: string, icon: null | IconName) => {
		return (
			<>
				{icon && <Icon icon={icon} />}
				{title}
			</>
		);
	};

	const renderEditableTitle = (title: string) => {
		return (
			<InputGroup
				small
				placeholder="Title"
				onChange={(evt) => {
					updateItem(dropdownId, index, { title: evt.target.value });
				}}
				value={title}
			/>
		);
	};

	const renderTop = () => {
		if ('type' in item) {
			if (item.type === 'collection') {
				const collection = collections.find((c) => c.id === item.id);
				if (collection) {
					const schema = getSchemaForKind(collection.kind);
					return renderForPageOrCollection(
						collection.title,
						schema && schema.bpDisplayIcon,
					);
				}
			} else if (item.type === 'page') {
				const page = pages.find((pg) => pg.id === item.id);
				if (page) {
					return renderForPageOrCollection(page.title, 'page-layout');
				}
			}
			return null;
		}
		if ('href' in item) {
			return (
				<>
					<Icon icon="link" />
					{renderEditableTitle(item.title)}
					<InputGroup
						small
						className="href-input"
						placeholder="https://www.example.com"
						onChange={(evt) => {
							updateItem(dropdownId, index, { href: evt.target.value });
						}}
						value={item.href}
					/>
				</>
			);
		}
		if (isCommunityNavigationMenu(item)) {
			return (
				<>
					{renderEditableTitle(item.title)}
					<PageCollectionAutocomplete
						items={pages}
						placeholder="Add Page"
						usedItems={pages.filter((page) =>
							item.children.some(
								(current: any) => current === page.id || current.id === page.id,
							),
						)}
						onSelect={(page) => {
							const newItem = { type: 'page' as const, id: page.id };
							updateItem(dropdownId, index, {
								children: [newItem, ...item.children],
							});
						}}
					/>
					<PageCollectionAutocomplete
						items={collections}
						placeholder="Add Collection"
						usedItems={collections.filter((collection) =>
							item.children.some((current: any) => current.id === collection.id),
						)}
						onSelect={(collection) => {
							const newItem = { type: 'collection' as const, id: collection.id };
							updateItem(dropdownId, index, {
								children: [newItem, ...item.children],
							});
						}}
					/>
					<Button
						small
						text="Add Link"
						onClick={() => {
							updateItem(dropdownId, index, {
								children: [newLink, ...item.children],
							});
						}}
					/>
				</>
			);
		}
		return null;
	};

	const renderChildren = () => {
		if (isCommunityNavigationMenu(item)) {
			return (
				<div className="children">
					{/* @ts-expect-error ts-migrate(2604) FIXME: JSX element type 'NavBuilderList' does not have an... Remove this comment to see the full error message */}
					<NavBuilderList
						id={item.id}
						items={item.children}
						pages={pages}
						newLink={newLink}
					/>
				</div>
			);
		}
		return null;
	};

	return (
		<div className={classNames({ 'nav-builder-row-component': true, static: isStatic })}>
			<div className="top">{renderTop()}</div>
			{renderChildren()}
		</div>
	);
};

export default NavBuilderRow;

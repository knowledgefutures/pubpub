import React from 'react';
import classNames from 'classnames';
import { Button, InputGroup } from '@blueprintjs/core';
import PageAutocomplete from './PageAutocomplete';

type OwnProps = {
	dropdownId?: string;
	index?: number;
	item: string | any;
	updateItem?: (...args: any[]) => any;
	removeItem?: (...args: any[]) => any;
	pages: any[];
	newLink?: any;
	isStatic?: boolean;
	NavBuilderList?: (...args: any[]) => any;
};

const defaultProps = {
	dropdownId: undefined,
	NavBuilderList: undefined,
	isStatic: false,
	newLink: undefined,
	updateItem: () => {},
	removeItem: () => {},
	index: undefined,
};

type Props = OwnProps & typeof defaultProps;

const NavBuilderRow = (props: Props) => {
	const {
		dropdownId,
		NavBuilderList,
		index,
		item,
		pages,
		updateItem,
		removeItem,
		newLink,
		isStatic,
	} = props;
	const data = typeof item === 'string' ? pages.find((page) => page.id === item) : item;
	if (!data) {
		return null;
	}
	let type = 'page';
	if (typeof data.href === 'string' && !isStatic) {
		type = 'link';
	}
	if (data.children) {
		type = 'dropdown';
	}

	return (
		<div className={classNames({ 'nav-builder-row-component': true, static: isStatic })}>
			<div className="top">
				{type === 'page' && <div className="nav-title">{data.title}</div>}
				{type !== 'page' && (
					<InputGroup
						small
						placeholder="Title"
						onChange={(evt) => {
							updateItem(dropdownId, index, { title: evt.target.value });
						}}
						value={data.title}
					/>
				)}
				{type === 'link' && (
					<InputGroup
						small
						placeholder="https://www.example.com"
						onChange={(evt) => {
							updateItem(dropdownId, index, { href: evt.target.value });
						}}
						value={data.href}
					/>
				)}
				{type === 'dropdown' && (
					<React.Fragment>
						<PageAutocomplete
							pages={pages}
							placeholder="Add Page"
							// @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
							usedItems={pages.filter((page) => {
								return data.children.includes(page.id);
							})}
							// @ts-expect-error ts-migrate(2322) FIXME: Type '(newItem: any) => void' is not assignable to... Remove this comment to see the full error message
							onSelect={(newItem) => {
								updateItem(dropdownId, index, {
									children: [newItem.id, ...item.children],
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
					</React.Fragment>
				)}
			</div>
			{type === 'dropdown' && (
				<div className="children">
					{/* @ts-expect-error ts-migrate(2604) FIXME: JSX element type 'NavBuilderList' does not have an... Remove this comment to see the full error message */}
					<NavBuilderList
						id={item.id}
						items={item.children}
						removeItem={removeItem}
						updateItem={updateItem}
						pages={pages}
						newLink={newLink}
					/>
				</div>
			)}
		</div>
	);
};
NavBuilderRow.defaultProps = defaultProps;
export default NavBuilderRow;

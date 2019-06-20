/* eslint-disable no-multi-assign */
import React from 'react';
import PropTypes from 'prop-types';
import { Menu, MenuItem } from '@blueprintjs/core';
import { getJSON } from '@pubpub/editor';

require('./pubToc.scss');

const propTypes = {
	pubData: PropTypes.object.isRequired,
	editorChangeObject: PropTypes.object.isRequired,
};

const PubToc = function(props) {
	const pubData = props.pubData;
	if (!pubData.initialDoc && !props.editorChangeObject.view) {
		return null;
	}

	const docJson = props.editorChangeObject.view
		? getJSON(props.editorChangeObject.view)
		: pubData.initialDoc;

	const headings = docJson.content
		.filter((item) => {
			return item.type === 'heading' && item.attrs.level < 3;
		})
		.map((item, index) => {
			const textContent =
				item.content &&
				item.content
					.filter((node) => {
						/* Filter to remove inline non-text nodes: e.g. equations */
						return node.type === 'text';
					})
					.reduce((prev, curr) => {
						return `${prev}${curr.text}`;
					}, '');
			return {
				title: textContent,
				level: item.attrs.level,
				href:
					textContent &&
					textContent
						.replace(/[^a-zA-Z0-9-\s]/gi, '')
						.replace(/\s+/gi, ' ')
						.trim()
						.toLowerCase()
						.replace(/\s/gi, '-'),
				index: index,
			};
		})
		.filter((item) => {
			/* Filter out empty headers */
			return item.title;
		});

	if (!headings.length) {
		return null;
	}

	return (
		<div className="pub-toc-component">
			<Menu className="toc">
				{headings.map((item) => {
					return (
						<MenuItem
							key={item.index}
							href={`#${item.href}`}
							className={`level-${item.level}`}
							onClick={(evt) => {
								/* If editing, don't use anchor tags for nav since we have */
								/* a fixed header bar. Plus, the URL with an anchor tag will behave */
								/* unexpectedly on reload given the async loading of doc. Instead, */
								/* manually scroll to the position and offset by fixed header height. */
								if (pubData.canEditBranch) {
									evt.preventDefault();
									document.getElementById(item.href).scrollIntoView();
									const currentTop =
										document.body.scrollTop ||
										document.documentElement.scrollTop;
									document.body.scrollTop = document.documentElement.scrollTop =
										currentTop - 75;
								}
							}}
							text={item.title}
						/>
					);
				})}
			</Menu>
		</div>
	);
};

PubToc.propTypes = propTypes;
export default PubToc;

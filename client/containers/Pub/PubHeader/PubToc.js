/* eslint-disable no-multi-assign */
import React from 'react';
import PropTypes from 'prop-types';
import { Menu, MenuItem } from '@blueprintjs/core';

require('./pubToc.scss');

const propTypes = {
	pubData: PropTypes.object.isRequired,
	headings: PropTypes.array.isRequired,
};

const PubToc = function(props) {
	return (
		<div className="pub-toc-component">
			<Menu className="toc">
				{props.headings.map((item) => {
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
								if (props.pubData.canEditBranch) {
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

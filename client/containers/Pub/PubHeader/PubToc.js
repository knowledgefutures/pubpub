/* eslint-disable no-multi-assign */
import React from 'react';
import PropTypes from 'prop-types';

import { Menu, MenuItem } from 'components/Menu';
import { usePageContext } from 'utils/hooks';

require('./pubToc.scss');

const propTypes = {
	children: PropTypes.oneOfType([PropTypes.func, PropTypes.node]).isRequired,
	headings: PropTypes.arrayOf(
		PropTypes.shape({
			title: PropTypes.string,
			index: PropTypes.any,
			href: PropTypes.string,
		}),
	).isRequired,
	onSelect: PropTypes.func,
	placement: PropTypes.string,
};

const defaultProps = {
	onSelect: null,
	placement: 'bottom-end',
};

const PubToc = (props) => {
	const { headings, children, onSelect, placement } = props;
	const { scopeData } = usePageContext();
	const { canEdit, canEditDraft } = scopeData.activePermissions;
	return (
		<Menu
			aria-label="Table of contents"
			className="pub-toc-component"
			disclosure={children}
			placement={placement}
		>
			{headings.map((heading) => {
				return (
					<MenuItem
						key={heading.index}
						href={`#${heading.href}`}
						className={`level-${heading.level}`}
						onClick={(evt) => {
							/* If editing, don't use anchor tags for nav since we have */
							/* a fixed header bar. Plus, the URL with an anchor tag will behave */
							/* unexpectedly on reload given the async loading of doc. Instead, */
							/* manually scroll to the position and offset by fixed header height. */
							if (onSelect) {
								onSelect();
							}
							if (canEdit || canEditDraft) {
								evt.preventDefault();
								document.getElementById(heading.href).scrollIntoView();
								const currentTop =
									document.body.scrollTop || document.documentElement.scrollTop;
								document.body.scrollTop = document.documentElement.scrollTop =
									currentTop - 75;
							}
						}}
						text={heading.title}
					/>
				);
			})}
		</Menu>
	);
};

PubToc.propTypes = propTypes;
PubToc.defaultProps = defaultProps;
export default PubToc;

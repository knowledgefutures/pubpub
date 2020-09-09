/* eslint-disable no-multi-assign */
import React from 'react';

import { Menu, MenuItem } from 'components/Menu';
import { usePageContext } from 'utils/hooks';

require('./pubToc.scss');

type OwnProps = {
	children: ((...args: any[]) => any) | React.ReactNode;
	headings: {
		title?: string;
		index?: any;
		href?: string;
	}[];
	onSelect?: (...args: any[]) => any;
	placement?: string;
};

const defaultProps = {
	onSelect: null,
	placement: 'bottom-end',
};

type Props = OwnProps & typeof defaultProps;

const PubToc = (props: Props) => {
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
			{/* @ts-expect-error ts-migrate(2339) FIXME: Property 'map' does not exist on type 'never'. */}
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
								// @ts-expect-error ts-migrate(2349) FIXME: Type 'never' has no call signatures.
								onSelect();
							}
							if (canEdit || canEditDraft) {
								evt.preventDefault();
								// @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
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
PubToc.defaultProps = defaultProps;
export default PubToc;

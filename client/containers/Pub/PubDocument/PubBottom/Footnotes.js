import React, { useState, useRef, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

import { Icon, PubNoteContent } from 'components';

require('./footnotes.scss');

export const footnotePropType = PropTypes.shape({
	html: PropTypes.string,
	unstructuredValue: PropTypes.string,
	count: PropTypes.number,
});

const propTypes = {
	accentColor: PropTypes.string.isRequired,
	footnotes: PropTypes.arrayOf(footnotePropType).isRequired,
	targetFootnoteElement: PropTypes.func.isRequired,
};

const scrollToNode = (node) => {
	if (node) {
		node.scrollIntoView();
		const currentTop = document.body.scrollTop || document.documentElement.scrollTop;
		document.body.scrollTop = currentTop - 75;
		document.documentElement.scrollTop = currentTop - 75;
	}
};

const findLastElementChild = (node) => {
	let child = node;
	// eslint-disable-next-line no-constant-condition
	while (true) {
		const { lastElementChild } = child;
		if (lastElementChild) {
			child = lastElementChild;
		} else {
			break;
		}
	}
	return child;
};

const Footnote = (props) => {
	const { footnote, accentColor, targetFootnoteElement } = props;
	const contentRef = useRef();
	const [returnLinkTarget, setReturnLinkTarget] = useState(null);

	useLayoutEffect(() => {
		const contentNode = contentRef.current;
		if (contentNode) {
			const lastChild = findLastElementChild(contentNode);
			if (lastChild) {
				const newReturnLinkTarget = document.createElement('span');
				lastChild.appendChild(newReturnLinkTarget);
				setReturnLinkTarget(newReturnLinkTarget);
			}
		}
	}, []);

	return (
		<li className="footnote">
			<div className="number">{footnote.number}.</div>
			<div className="inner">
				<PubNoteContent
					ref={contentRef}
					structured={footnote.html}
					unstructured={footnote.unstructuredValue}
				/>
				{returnLinkTarget &&
					ReactDOM.createPortal(
						<span
							role="button"
							aria-label="Jump back to source"
							tabIndex="0"
							style={{ cursor: 'pointer' }}
							onClick={() => scrollToNode(targetFootnoteElement(footnote))}
						>
							<Icon
								className="jump-back-icon"
								icon="return"
								color={accentColor}
								iconSize={10}
							/>
						</span>,
						returnLinkTarget,
					)}
			</div>
		</li>
	);
};

Footnote.propTypes = {
	accentColor: PropTypes.string.isRequired,
	footnote: footnotePropType.isRequired,
	targetFootnoteElement: PropTypes.func.isRequired,
};

const Footnotes = (props) => {
	const { footnotes, ...restProps } = props;
	return (
		<ul className="footnotes-component">
			{footnotes.map((fn) => (
				<Footnote key={fn.number} footnote={fn} {...restProps} />
			))}
		</ul>
	);
};

Footnotes.propTypes = propTypes;
export default Footnotes;

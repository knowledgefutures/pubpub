import React from 'react';
import PropTypes from 'prop-types';

import Icon from 'components/Icon/Icon';

require('./footnotes.scss');

const footnotePropType = PropTypes.shape({
	content: PropTypes.node,
	href: PropTypes.string,
	number: PropTypes.number,
});

const propTypes = {
	accentColor: PropTypes.string.isRequired,
	footnotes: PropTypes.arrayOf(footnotePropType).isRequired,
};

const Footnotes = (props) => {
	const { accentColor, footnotes } = props;
	return (
		<ul className="footnotes-component">
			{footnotes.map((fn) => (
				<li className="footnote">
					<div className="number">{fn.number}.</div>
					<div className="inner">
						{fn.content}
						<a href={fn.href}>
							<Icon
								className="jump-back-icon"
								icon="return"
								color={accentColor}
								iconSize={10}
								ariaLabel="Jump back to source"
							/>
						</a>
					</div>
				</li>
			))}
		</ul>
	);
};

Footnotes.propTypes = propTypes;
export default Footnotes;
export { propTypes as footnotePropType };

import React, { useRef, useEffect } from 'react';
import uuidv4 from 'uuid/v4';

require('./discussionEmbed.scss');

type Props = {
	attrs: any;
	options: any;
	isSelected: boolean;
	isEditable: boolean;
};

const DiscussionEmbed = (props: Props) => {
	const { align, threadNumber } = props.attrs;
	const { addRef, removeRef } = props.options;
	const figFloat = align === 'left' || align === 'right' ? align : 'none';
	let figMargin = '0em auto 1em';
	if (align === 'left') {
		figMargin = '1em 1em 1em 0px';
	}
	if (align === 'right') {
		figMargin = '1em 0px 1em 1em';
	}
	const figWidth = align === 'full' ? '100%' : '60%';
	const figStyle = {
		width: figWidth,
		margin: figMargin,
		float: figFloat,
		padding: '1em 1em 0em',
	};

	const containerRef = useRef(null);
	useEffect(() => {
		const embedId = uuidv4();
		addRef(embedId, containerRef, threadNumber);
		return () => {
			removeRef(embedId);
		};
	}, [threadNumber, addRef, removeRef]);
	return (
		<div className="figure-wrapper" tabIndex={-1}>
			<figure
				className={`discussion bp3-elevation-2 ${props.isSelected ? 'isSelected' : ''} ${
					props.isEditable ? 'isEditable' : ''
				}`}
				style={figStyle}
				ref={containerRef}
			/>
		</div>
	);
};
export default DiscussionEmbed;

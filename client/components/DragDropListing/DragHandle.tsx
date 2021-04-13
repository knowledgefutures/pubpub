import React from 'react';
import { DraggableProvidedDragHandleProps } from 'react-beautiful-dnd';

import Icon from '../Icon/Icon';

type Props = {
	dragHandleProps: DraggableProvidedDragHandleProps;
	[key: string]: any;
};

const DragHandle = React.forwardRef((props: Props, ref: any) => {
	const { dragHandleProps, ...restProps } = props;
	return (
		<div {...restProps} {...dragHandleProps} ref={ref}>
			<Icon icon="drag-handle-vertical" />
		</div>
	);
});

export default DragHandle;

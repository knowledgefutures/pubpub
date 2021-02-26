import { useState } from 'react';

import { generateHash } from 'utils/hashes';
import { LayoutBlock } from 'utils/layout/types';

type LayoutUpdateFn = (newLayout: LayoutBlock[]) => LayoutBlock[];
type ChangeHandler = (newLayout: LayoutBlock[]) => unknown;

export const useLayout = (initialLayout: LayoutBlock[], onChange: ChangeHandler) => {
	const [layout, setLayout] = useState(initialLayout);

	const onUpdateLayout = (fn: LayoutUpdateFn) => {
		const newLayout = [...layout];
		const nextLayout = fn(newLayout);
		onChange(nextLayout);
		setLayout(nextLayout);
	};

	const changeLayout = (index: number, newContent: LayoutBlock['content']) => {
		onUpdateLayout((newLayout) => {
			newLayout[index].content = newContent;
			return newLayout;
		});
	};

	const changeLayoutPartial = (index: number, update: Partial<LayoutBlock['content']>) => {
		onUpdateLayout((newLayout) => {
			const block = newLayout[index];
			const nextBlock = { ...block, content: { ...block.content, ...update } };
			return [
				...newLayout.slice(0, index),
				nextBlock,
				...newLayout.slice(index + 1),
			] as LayoutBlock[];
		});
	};

	const insertBlock = (
		index: number,
		type: LayoutBlock['type'],
		newContent: LayoutBlock['content'],
	) => {
		onUpdateLayout((newLayout) => {
			newLayout.splice(index, 0, {
				id: generateHash(8),
				type,
				content: newContent,
			} as LayoutBlock);
			return newLayout;
		});
	};

	const removeBlock = (index: number) => {
		onUpdateLayout((newLayout) => {
			newLayout.splice(index, 1);
			return newLayout;
		});
	};

	const moveBlockUp = (index: number) => {
		onUpdateLayout((newLayout) => {
			const swap = newLayout[index - 1];
			newLayout[index - 1] = newLayout[index];
			newLayout[index] = swap;
			return newLayout;
		});
	};

	const moveBlockDown = (index: number) => {
		onUpdateLayout((newLayout) => {
			const swap = newLayout[index + 1];
			newLayout[index + 1] = newLayout[index];
			newLayout[index] = swap;
			return newLayout;
		});
	};

	return {
		layout,
		changeLayout,
		changeLayoutPartial,
		insertBlock,
		removeBlock,
		moveBlockUp,
		moveBlockDown,
	};
};

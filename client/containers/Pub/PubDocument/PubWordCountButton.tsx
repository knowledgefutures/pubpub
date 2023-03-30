import React, { useMemo, useState } from 'react';
import { Button, Classes, Icon, Popover } from '@blueprintjs/core';
import { Node } from 'prosemirror-model';

import { getWordAndCharacterCountsFromDoc } from 'utils/pub/metadata';

require('./pubWordCountButton.scss');

type Props = {
	doc: Node;
};

const PubHeaderFormattingWordCountButton = (props: Props) => {
	const { doc } = props;
	const [open, setOpen] = useState(false);
	const counts = useMemo(() => {
		if (open) {
			return getWordAndCharacterCountsFromDoc(doc);
		}
		return null;
	}, [open, doc]);
	const content = (
		<div className="pub-word-count-button-popover-content">
			<dl>
				<dt>Words</dt>
				<dd>{counts?.[0].toLocaleString()}</dd>
				<dt>Characters</dt>
				<dd>{counts?.[1].toLocaleString()}</dd>
			</dl>
		</div>
	);

	return (
		<Popover
			content={content}
			isOpen={open}
			minimal
			position="bottom-right"
			popoverClassName="pub-word-count-button-popover"
			targetClassName="pub-word-count-button-target"
		>
			<Button
				role="button"
				className={`${Classes.BUTTON} ${Classes.MINIMAL}`}
				onClick={() => setOpen(!open)}
				onBlur={() => setOpen(false)}
				aria-label="Word count"
			>
				<Icon icon="timeline-line-chart" />
			</Button>
		</Popover>
	);
};

export default PubHeaderFormattingWordCountButton;

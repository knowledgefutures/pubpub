import React, { useCallback, useRef, useState } from 'react';
import { useUpdateEffect } from 'react-use';
import { Spinner } from '@blueprintjs/core';

import { Icon } from 'components';

require('./autosaveIndicator.scss');

type Props = {
	isSaving: boolean;
};

type Status = 'start' | 'saving' | 'saved';

const AutosaveIndicator = (props: Props) => {
	const { isSaving } = props;
	const [visible, setVisible] = useState(true);
	const [status, setStatus] = useState<Status>('start');
	const pendingTransition = useRef<number | null>(null);

	const transitionToStatus = useCallback((nextStatus: Status) => {
		setVisible(false);
		setTimeout(() => {
			setStatus(nextStatus);
			setVisible(true);
		}, 200);
	}, []);

	useUpdateEffect(() => {
		clearTimeout(pendingTransition.current!);
		if (isSaving) {
			transitionToStatus('saving');
		} else {
			transitionToStatus('saved');
			pendingTransition.current = setTimeout(() => transitionToStatus('start'), 10000) as any;
		}
	}, [isSaving, transitionToStatus]);

	const renderInner = () => {
		if (status === 'saving') {
			return (
				<>
					<Spinner size={18} />
					Saving...
				</>
			);
		}
		if (status === 'saved') {
			return (
				<>
					<Icon iconSize={18} intent="success" icon="tick" />
					Saved
				</>
			);
		}
		return 'Changes save automatically';
	};

	return (
		<div className="autosave-indicator-component" aria-hidden={!visible}>
			{renderInner()}
		</div>
	);
};

export default AutosaveIndicator;

import React, { useEffect, useRef, useState } from 'react';
import { usePrevious } from 'react-use';

import { usePubContext } from '../pubHooks';

require('./pubConnectionStatusIndicator.scss');

const PubConnectionStatusIndicator = () => {
	const {
		collabData: { status: providedStatus },
	} = usePubContext();
	const savingTimeoutRef = useRef<any>(null);
	const previousProvidedStatus = usePrevious(providedStatus);
	const [displayedStatus, setDisplayedStatus] = useState(providedStatus);

	useEffect(() => {
		if (savingTimeoutRef.current) {
			clearTimeout(savingTimeoutRef.current);
		}

		if (previousProvidedStatus === 'connecting' && providedStatus === 'connected') {
			setDisplayedStatus(providedStatus);
		}
		if (previousProvidedStatus !== 'connecting' && previousProvidedStatus !== 'disconnected') {
			if (displayedStatus === 'saving') {
				savingTimeoutRef.current = setTimeout(
					() => setDisplayedStatus(providedStatus),
					250,
				);
			} else {
				setDisplayedStatus(providedStatus);
			}
		}
		if (previousProvidedStatus === 'disconnected' && providedStatus === 'connected') {
			setDisplayedStatus(providedStatus);
		}
	}, [previousProvidedStatus, providedStatus, displayedStatus]);

	return (
		<span className={`pub-connection-status-indicator-component ${displayedStatus}`}>
			{displayedStatus}
			{displayedStatus === 'saving' || displayedStatus === 'connecting' ? '...' : ''}
		</span>
	);
};

export default PubConnectionStatusIndicator;

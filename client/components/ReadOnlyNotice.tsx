import React, { useCallback, useEffect, useState } from 'react';

import { Callout } from '@blueprintjs/core';

const AUTO_DISMISS_MS = 15_000;

export const ReadOnlyNotice = () => {
	const [visible, setVisible] = useState(false);
	const [dismissTimer, setDismissTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

	const show = useCallback(() => {
		setVisible(true);
		if (dismissTimer) {
			clearTimeout(dismissTimer);
		}
		setDismissTimer(setTimeout(() => setVisible(false), AUTO_DISMISS_MS));
	}, [dismissTimer]);

	useEffect(() => {
		window.addEventListener('pubpub:readOnly', show);
		return () => {
			window.removeEventListener('pubpub:readOnly', show);
			if (dismissTimer) {
				clearTimeout(dismissTimer);
			}
		};
	}, [show, dismissTimer]);

	if (!visible) {
		return null;
	}

	return (
		<div
			style={{
				position: 'fixed',
				bottom: 16,
				left: '50%',
				transform: 'translateX(-50%)',
				zIndex: 9999,
				maxWidth: 480,
				width: '90%',
				background: 'white',
			}}
		>
			<Callout intent="warning" icon="info-sign" title="Read-only mode">
				PubPub is in read-only mode for scheduled maintenance. Your changes cannot be saved
				right now. Please try again shortly.
			</Callout>
		</div>
	);
};

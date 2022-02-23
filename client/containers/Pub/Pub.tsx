import React, { useEffect } from 'react';

import { usePageContext } from 'utils/hooks';
import pick from 'lodash.pick';
import { PubPageData, DefinitelyHas } from 'types';

import PubSyncManager, { PubContextType } from './PubSyncManager';
import PubHeader from './PubHeader';

import SpubHeader from './SpubHeader';
// import SubmissionPubHeader from './SubmissionPubHeader';

import PubDocument from './PubDocument';
import { PubSuspendWhileTypingProvider, PubSuspendWhileTyping } from './PubSuspendWhileTyping';

require('./pub.scss');

type Props = {
	pubData: PubPageData;
};

type ModePropsType = Pick<
	PubContextType,
	'pubData' | 'historyData' | 'collabData' | 'firebaseDraftRef' | 'updateLocalData'
>;

const getModeProps = (ctx: PubContextType): ModePropsType =>
	pick(ctx, ['pubData', 'collabData', 'historyData', 'firebaseDraftRef', 'updateLocalData']);

const isInViewport = (rect: DOMRect, offsets: { top?: number; left?: number } = {}) => {
	const { top, left, bottom, right } = rect;
	const { innerWidth, innerHeight } = window;
	const { clientWidth, clientHeight } = document.documentElement;
	const { top: offsetTop, left: offsetLeft } = { top: 0, left: 0, ...offsets };

	return (
		top >= offsetTop &&
		left >= offsetLeft &&
		bottom <= (innerHeight || clientHeight) &&
		right <= (innerWidth || clientWidth)
	);
};

const scrollToElementTop = (hash: string, delay = 0) => {
	let element: HTMLElement | null;

	try {
		element = document.getElementById(hash.replace('#', ''));
	} catch {
		return;
	}

	if (!element) {
		return;
	}

	setTimeout(() => {
		const rect = (element as HTMLElement).getBoundingClientRect();

		if (!isInViewport(rect, { top: 50 })) {
			document.body.scrollTop += rect.top - 80;
		}
	}, delay);
};

const HeaderComponent = (props: ModePropsType) => {
	const { pubData, ...rest } = props;
	if (props.pubData.submission?.status === 'incomplete')
		return (
			<SpubHeader {...rest} pubData={pubData as DefinitelyHas<PubPageData, 'submission'>} />
		);
	return <PubHeader {...props} />;
};

const Pub = (props: Props) => {
	const { loginData, locationData, communityData } = usePageContext();
	useEffect(() => {
		const { hash } = window.location;

		if (hash) {
			scrollToElementTop(hash, 500);
		}

		const onClick = (event: MouseEvent) => {
			const { target, metaKey } = event;

			if (target instanceof HTMLAnchorElement && !metaKey) {
				const href = target.getAttribute('href');

				if (href && href.indexOf('#') === 0) {
					event.preventDefault();
					window.location.hash = href;
					scrollToElementTop(href);
				}
			}
		};

		if (props.pubData.isReadOnly) {
			document.addEventListener('click', onClick);
			return () => document.removeEventListener('click', onClick);
		}

		return () => {};
	}, [props.pubData]);
	return (
		<PubSuspendWhileTypingProvider>
			<div id="pub-container">
				<PubSyncManager
					pubData={props.pubData}
					locationData={locationData}
					communityData={communityData}
					loginData={loginData}
				>
					{(ctx) => (
						<>
							<PubSuspendWhileTyping delay={1000}>
								{() => <HeaderComponent {...getModeProps(ctx)} />}
							</PubSuspendWhileTyping>
							<PubDocument {...getModeProps(ctx)} />
						</>
					)}
				</PubSyncManager>
			</div>
		</PubSuspendWhileTypingProvider>
	);
};

export default Pub;

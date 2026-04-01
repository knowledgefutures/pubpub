import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

import { usePageContext } from 'utils/hooks';

export type AltchaRef = {
	value: string | null;
	verify: () => Promise<string>;
};

type AltchaProps = {
	challengeurl?: string;
	auto?: 'off' | 'onfocus' | 'onload' | 'onsubmit';
	onStateChange?: (ev: Event | CustomEvent<{ payload?: string; state: string }>) => void;
	style?: React.CSSProperties & Record<string, string>;
};

const DEFAULT_CHALLENGE_URL = '/api/captcha/challenge';

type WidgetElement = HTMLElement & AltchaWidgetMethods;

const Altcha = forwardRef<AltchaRef, AltchaProps>((props, ref) => {
	const { challengeurl = DEFAULT_CHALLENGE_URL, auto, onStateChange, style } = props;
	const { locationData } = usePageContext();
	const devMode = !locationData.isProd;
	const widgetRef = useRef<WidgetElement | null>(null);
	const [value, setValue] = useState<string | null>(null);
	const [loaded, setLoaded] = useState(false);
	const [simulateFailure, setSimulateFailure] = useState(false);
	const [widgetKey, setWidgetKey] = useState(0);
	const valueRef = useRef<string | null>(null);
	valueRef.current = value;

	useEffect(() => {
		import('altcha').then(() => setLoaded(true));
	}, []);

	const [altchaVisible, setAltchaVisible] = useState<boolean>(false);
	// biome-ignore lint/correctness/useExhaustiveDependencies: widgetKey triggers re-attach after remount
	useEffect(() => {
		if (!loaded) return;
		const w = widgetRef.current;
		if (!w) return;
		const handleStateChange = (ev: Event) => {
			const e = ev as CustomEvent<{ payload?: string; state: string }>;
			console.log('state changed', e.detail);

			switch (e.detail.state) {
				case 'error':
				case 'code':
				case 'unverified':
					setAltchaVisible(true);
					break;
				case 'verifying':
					if (devMode) {
						setAltchaVisible(true);
					}
					break;
				case 'verified':
					if (e.detail.payload) {
						setValue(e.detail.payload);
						setAltchaVisible(false);
					}
					break;
				default:
					break;
			}

			onStateChange?.(e);
		};
		w.addEventListener('statechange', handleStateChange);
		return () => w.removeEventListener('statechange', handleStateChange);
	}, [loaded, onStateChange, widgetKey]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: widgetKey triggers re-bind after remount
	useImperativeHandle(
		ref,
		() => ({
			get value() {
				return valueRef.current;
			},
			verify(): Promise<string> {
				const w = widgetRef.current;
				if (!w) return Promise.reject(new Error('Altcha widget not mounted'));
				const current = valueRef.current;
				if (current) return Promise.resolve(current);
				return new Promise((resolve, reject) => {
					const handler = (ev: Event) => {
						const e = ev as CustomEvent<{ payload?: string; state: string }>;
						const state = e.detail?.state;
						if (state === 'verified' && e.detail?.payload) {
							w.removeEventListener('statechange', handler);
							resolve(e.detail.payload);
							return;
						}
						if (state === 'error' || state === 'expired') {
							w.removeEventListener('statechange', handler);
							reject(new Error('Captcha verification failed'));
						}
					};
					w.addEventListener('statechange', handler);
					w.verify();
				});
			},
		}),
		[widgetKey],
	);

	const handleToggleFailure = () => {
		setSimulateFailure((prev) => !prev);
		setValue(null);
		setWidgetKey((k) => k + 1);
	};

	const handleReset = () => {
		setValue(null);
		widgetRef.current?.reset();
	};

	if (!loaded) return null;

	const devAttrs = devMode ? { debug: true, floatingpersist: 'focus' as const } : {};

	const widget = (
		<React.Fragment key={widgetKey}>
			<altcha-widget
				delay={500}
				ref={widgetRef as any}
				challengeurl={challengeurl}
				{...(auto ? { auto } : {})}
				floating="auto"
				{...devAttrs}
				{...(simulateFailure ? { mockerror: true } : {})}
				style={{
					display: altchaVisible ? 'block' : 'none',
					zIndex: 1000,
					...(style ? ({ style } as any) : {}),
				}}
				// disable very annoying wait alert
				strings="{&quot;waitAlert&quot;:&quot;&quot;}"
			/>
		</React.Fragment>
	);

	if (!devMode) return widget;

	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: 6,
				fontSize: 11,
				color: '#5c7080',
				padding: '2px 6px',
				border: '1px dashed #5c7080',
				borderRadius: 3,
			}}
		>
			{widget}
			<span style={{ fontWeight: 600 }}>Captcha</span>
			<label
				style={{
					cursor: 'pointer',
					display: 'inline-flex',
					alignItems: 'center',
					gap: 3,
					color: simulateFailure ? '#db3737' : undefined,
				}}
			>
				<input
					type="checkbox"
					checked={simulateFailure}
					onChange={handleToggleFailure}
					style={{ margin: 0 }}
				/>
				fail
			</label>
			<button
				type="button"
				onClick={handleReset}
				style={{
					fontSize: 11,
					padding: '1px 6px',
					cursor: 'pointer',
					border: '1px solid #ced9e0',
					borderRadius: 3,
					background: 'white',
					lineHeight: '16px',
				}}
			>
				reset
			</button>
		</div>
	);
});

Altcha.displayName = 'Altcha';

export default Altcha;

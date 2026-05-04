import React, { useCallback, useEffect, useState } from 'react';

import {
	Button,
	Classes,
	ControlGroup,
	Dialog,
	InputGroup,
	MenuItem,
	NonIdealState,
	Position,
	Spinner,
	Tag,
} from '@blueprintjs/core';
import { Select } from '@blueprintjs/select';

import { apiFetch } from 'client/utils/apiFetch';
import { s3Upload } from 'client/utils/upload';

type BrandAsset = {
	label: string;
	url: string;
	type: 'image' | 'color' | 'text';
};

type BrandResult = {
	domain: string;
	siteTitle: string | null;
	siteDescription: string | null;
	assets: BrandAsset[];
};

type ApplyTarget =
	| 'title'
	| 'subtitle'
	| 'description'
	| 'avatar'
	| 'heroImage'
	| 'heroLogo'
	| 'accentColorLight'
	| 'accentColorDark';

type TargetOption = { key: ApplyTarget; label: string };

const imageTargets: TargetOption[] = [
	{ key: 'avatar', label: 'Avatar' },
	{ key: 'heroImage', label: 'Hero Image' },
	{ key: 'heroLogo', label: 'Hero Logo' },
];

const colorTargets: TargetOption[] = [
	{ key: 'accentColorLight', label: 'Accent Color (Light)' },
	{ key: 'accentColorDark', label: 'Accent Color (Dark)' },
];

const textTargets: TargetOption[] = [
	{ key: 'title', label: 'Title' },
	{ key: 'subtitle', label: 'Subtitle' },
	{ key: 'description', label: 'Description' },
];

type Props = {
	isOpen: boolean;
	domain: string;
	onClose: () => void;
	onApply: (field: ApplyTarget, value: string) => void;
};

const COLORS_DEFAULT = 10;

/** Fetch a remote image via our server proxy (or decode a data URI), upload to PubPub S3, return asset URL. */
const uploadImageFromUrl = (imageUrl: string): Promise<string> => {
	return new Promise(async (resolve, reject) => {
		try {
			let blob: Blob;
			let ext = 'png';
			if (imageUrl.startsWith('data:')) {
				// Inline SVG data URI — decode directly
				const res = await fetch(imageUrl);
				blob = await res.blob();
				ext = 'svg';
			} else {
				// Proxy through our server to avoid CORS
				const proxyUrl = `/api/hubs/brand-helper/proxy-image?url=${encodeURIComponent(imageUrl)}`;
				const res = await fetch(proxyUrl);
				if (!res.ok) throw new Error(`Proxy returned ${res.status}`);
				blob = await res.blob();
				ext = imageUrl.split(/[#?]/)[0].split('.').pop()?.toLowerCase() || 'png';
			}
			const filename = `brand-import.${ext}`;
			const file = new File([blob], filename, { type: blob.type || 'image/png' });
			s3Upload(
				file,
				() => {},
				(_evt, _idx, _type, s3Key) => {
					resolve(`https://assets.pubpub.org/${s3Key}`);
				},
			);
		} catch (err) {
			reject(err);
		}
	});
};

const BrandHelper = ({ isOpen, domain, onClose, onApply }: Props) => {
	const [inputDomain, setInputDomain] = useState(domain);
	const [result, setResult] = useState<BrandResult | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [applied, setApplied] = useState<Record<string, ApplyTarget>>({});
	const [uploading, setUploading] = useState<Record<string, boolean>>({});
	const [showAllColors, setShowAllColors] = useState(false);

	useEffect(() => {
		if (isOpen) setInputDomain(domain);
	}, [isOpen, domain]);

	const fetchBrand = useCallback(
		async (d?: string) => {
			const target = (d ?? inputDomain).toLowerCase().trim();
			if (!target) return;
			setLoading(true);
			setError('');
			setResult(null);
			setApplied({});
			setUploading({});
			try {
				const data = await apiFetch.get(
					`/api/hubs/brand-helper?domain=${encodeURIComponent(target)}`,
				);
				setResult(data as any as BrandResult);
			} catch (err: any) {
				setError(err?.message || 'Failed to fetch brand assets');
			} finally {
				setLoading(false);
			}
		},
		[inputDomain],
	);

	const handleOpening = useCallback(() => {
		setResult(null);
		setError('');
		setApplied({});
		setUploading({});
		setShowAllColors(false);
		if (domain) fetchBrand(domain);
	}, [domain, fetchBrand]);

	const handleApplyImage = async (asset: BrandAsset, target: ApplyTarget) => {
		setUploading((prev) => ({ ...prev, [asset.url]: true }));
		try {
			const pubpubUrl = await uploadImageFromUrl(asset.url);
			onApply(target, pubpubUrl);
			setApplied((prev) => ({ ...prev, [asset.url]: target }));
		} catch {
			// Image may be CORS-blocked
		} finally {
			setUploading((prev) => ({ ...prev, [asset.url]: false }));
		}
	};

	const handleApplyDirect = (asset: BrandAsset, target: ApplyTarget) => {
		onApply(target, asset.url);
		setApplied((prev) => ({ ...prev, [asset.url]: target }));
	};

	const images = result?.assets.filter((a) => a.type === 'image') ?? [];
	const colors = result?.assets.filter((a) => a.type === 'color') ?? [];
	const texts = result?.assets.filter((a) => a.type === 'text') ?? [];

	return (
		<Dialog
			isOpen={isOpen}
			onClose={onClose}
			onOpening={handleOpening}
			title="Import from Site"
			className="brand-helper-dialog"
			style={{ width: 960 }}
		>
			<div className={Classes.DIALOG_BODY}>
				<div className="brand-domain-input">
					<ControlGroup fill>
						<InputGroup
							placeholder="Enter a domain, e.g. mit.edu"
							value={inputDomain}
							onChange={(e) => setInputDomain(e.target.value)}
							onKeyDown={(e) => e.key === 'Enter' && fetchBrand()}
							leftIcon="globe"
						/>
						<Button
							intent="primary"
							text="Fetch"
							icon="search"
							onClick={() => fetchBrand()}
							loading={loading}
							disabled={!inputDomain.trim()}
						/>
					</ControlGroup>
				</div>

				{loading && (
					<NonIdealState icon={<Spinner size={32} />} title="Scanning website..." />
				)}

				{error && (
					<NonIdealState
						icon="error"
						title="Could not fetch brand"
						description={error}
						action={<Button text="Retry" onClick={() => fetchBrand()} />}
					/>
				)}

				{result && !loading && (
					<div className="brand-results">
						{result.siteTitle && (
							<div className="brand-site-title">
								Site: <strong>{result.siteTitle}</strong>
							</div>
						)}

						{/* ── Text assets ── */}
						{texts.length > 0 && (
							<div className="brand-section">
								<h4>Text</h4>
								<div className="brand-text-list">
									{texts.map((asset) => (
										<div
											key={`${asset.label}:${asset.url}`}
											className="brand-text-row"
										>
											<div className="brand-text-content">
												<span className="brand-asset-label">
													{asset.label}
												</span>
												<span className="brand-text-value">
													{asset.url}
												</span>
											</div>
											{applied[asset.url] ? (
												<Tag
													minimal
													intent="success"
													icon="tick"
													className="brand-applied-tag"
												>
													{textTargets.find(
														(t) => t.key === applied[asset.url],
													)?.label ?? applied[asset.url]}
												</Tag>
											) : (
												<ApplyDropdown
													targets={textTargets}
													onSelect={(target) =>
														handleApplyDirect(asset, target)
													}
												/>
											)}
										</div>
									))}
								</div>
							</div>
						)}

						{/* ── Images ── */}
						{images.length > 0 && (
							<div className="brand-section">
								<h4>Images</h4>
								<div className="brand-image-grid">
									{images.map((asset) => (
										<div key={asset.url} className="brand-image-card">
											<div className="brand-image-preview">
												{' '}
												{/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: hide broken images */}{' '}
												<img
													src={asset.url}
													alt={asset.label}
													onError={(e) => {
														(
															e.target as HTMLImageElement
														).style.display = 'none';
													}}
												/>
											</div>
											<div className="brand-image-meta">
												<span className="brand-asset-label">
													{asset.label}
												</span>
												{uploading[asset.url] ? (
													<Tag
														minimal
														intent="primary"
														icon={<Spinner size={12} />}
													>
														Uploading...
													</Tag>
												) : applied[asset.url] ? (
													<Tag minimal intent="success" icon="tick">
														{imageTargets.find(
															(t) => t.key === applied[asset.url],
														)?.label ?? applied[asset.url]}
													</Tag>
												) : (
													<ApplyDropdown
														targets={imageTargets}
														onSelect={(target) =>
															handleApplyImage(asset, target)
														}
													/>
												)}
											</div>
										</div>
									))}
								</div>
							</div>
						)}

						{/* ── Colors ── */}
						{colors.length > 0 && (
							<div className="brand-section">
								<h4>Colors ({colors.length})</h4>
								<div className="brand-color-list">
									{(showAllColors ? colors : colors.slice(0, COLORS_DEFAULT)).map(
										(asset) => (
											<div
												key={`${asset.label}:${asset.url}`}
												className="brand-color-row"
											>
												<span
													className="brand-color-swatch"
													style={{ background: asset.url }}
												/>
												<code className="brand-color-value">
													{asset.url}
												</code>
												<span className="brand-asset-label">
													{asset.label}
												</span>
												<div className="brand-color-action">
													{applied[asset.url] ? (
														<Tag minimal intent="success" icon="tick">
															{colorTargets.find(
																(t) => t.key === applied[asset.url],
															)?.label ?? applied[asset.url]}
														</Tag>
													) : (
														<ApplyDropdown
															targets={colorTargets}
															onSelect={(target) =>
																handleApplyDirect(asset, target)
															}
														/>
													)}
												</div>
											</div>
										),
									)}
								</div>
								{!showAllColors && colors.length > COLORS_DEFAULT && (
									<Button
										small
										minimal
										intent="primary"
										icon="more"
										text={`Show all (${colors.length - COLORS_DEFAULT} more)`}
										onClick={() => setShowAllColors(true)}
										style={{ marginTop: 6 }}
									/>
								)}
							</div>
						)}

						{images.length === 0 && colors.length === 0 && texts.length === 0 && (
							<NonIdealState
								icon="search"
								title="No brand assets found"
								description={`Could not extract assets from ${inputDomain}.`}
							/>
						)}
					</div>
				)}
			</div>
			<div className={Classes.DIALOG_FOOTER}>
				<div className={Classes.DIALOG_FOOTER_ACTIONS}>
					<Button text="Done" onClick={onClose} />
				</div>
			</div>
		</Dialog>
	);
};

const ApplyDropdown = ({
	targets,
	onSelect,
}: {
	targets: TargetOption[];
	onSelect: (target: ApplyTarget) => void;
}) => {
	return (
		<Select<TargetOption>
			items={targets}
			itemRenderer={(item, { handleClick, modifiers }) => (
				<MenuItem
					key={item.key}
					text={item.label}
					active={modifiers.active}
					onClick={handleClick}
				/>
			)}
			onItemSelect={(item) => onSelect(item.key)}
			filterable={false}
			popoverProps={{ minimal: true, position: Position.BOTTOM_RIGHT }}
		>
			<Button small minimal intent="primary" rightIcon="caret-down" text="Apply as..." />
		</Select>
	);
};

export default BrandHelper;
export type { ApplyTarget };

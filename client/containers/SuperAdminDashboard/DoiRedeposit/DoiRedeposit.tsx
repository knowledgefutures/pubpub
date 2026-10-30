import React, { useCallback, useEffect, useRef, useState } from 'react';

import {
	Button,
	Callout,
	Classes,
	Dialog,
	FormGroup,
	HTMLTable,
	InputGroup,
	Intent,
	MenuItem,
	Position,
	ProgressBar,
	Tag,
} from '@blueprintjs/core';
import { Suggest } from '@blueprintjs/select';

import { apiFetch } from 'client/utils/apiFetch';

import './doiRedeposit.scss';

type CommunityOption = {
	id: string;
	title: string;
	subdomain: string;
};

type ItemSummary = { title: string; doi: string; slug?: string; error?: string };

type RedepositTask = {
	id: string;
	createdAt: string;
	isProcessing: boolean;
	error: string | null;
	input: { communityId: string; pubSlug?: string; limit?: number; stopRequested?: boolean };
	output: {
		startedAt?: string;
		finishedAt?: string;
		progress?: {
			total: number;
			processed: number;
			failed: number;
			current: ItemSummary | null;
		};
		total?: number;
		processed?: number;
		succeeded?: number;
		failed?: number;
		stopped?: boolean;
		failures?: ItemSummary[];
		deposited?: ItemSummary[];
	};
};

type Plan = {
	community: { id: string; title: string; subdomain: string; issn: string | null };
	doiPrefix: string | null;
	collectionCount: number;
	pubCount: number;
	firstPub: ItemSummary | null;
	skipped: { pubsWithoutDepositRecord: number; pubsWithoutRelease: number };
	tasks: RedepositTask[];
};

const pollIntervalMs = 3000;

const crossrefApiUrl = (doi: string) => `https://api.crossref.org/works/${doi}`;

const formatDate = (value?: string) => (value ? new Date(value).toLocaleString() : '');

const describeScope = (task: RedepositTask) => {
	if (task.input.pubSlug) return `Pub ${task.input.pubSlug}`;
	if (task.input.limit) return `First ${task.input.limit} pubs`;
	return 'All DOIs';
};

const useCommunitySearch = () => {
	const [query, setQuery] = useState('');
	const [results, setResults] = useState<CommunityOption[]>([]);
	const debounceRef = useRef<ReturnType<typeof setTimeout>>();

	useEffect(() => {
		if (debounceRef.current) clearTimeout(debounceRef.current);
		if (!query.trim()) {
			setResults([]);
			return;
		}
		debounceRef.current = setTimeout(async () => {
			try {
				const params = new URLSearchParams({ q: query });
				setResults(
					await apiFetch.get<CommunityOption[]>(
						`/api/superadmin/communities/search?${params}`,
					),
				);
			} catch {
				setResults([]);
			}
		}, 250);
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, [query]);

	return { query, setQuery, results };
};

const TaskStatus = ({ task }: { task: RedepositTask }) => {
	const { output } = task;
	if (task.isProcessing) {
		return (
			<Tag intent={Intent.PRIMARY} minimal>
				{task.input.stopRequested ? 'Stopping' : 'Running'}
			</Tag>
		);
	}
	if (task.error) {
		return (
			<Tag intent={Intent.DANGER} minimal>
				Error
			</Tag>
		);
	}
	if (output.stopped) {
		return (
			<Tag intent={Intent.WARNING} minimal>
				Stopped
			</Tag>
		);
	}
	return (
		<Tag intent={output.failed ? Intent.WARNING : Intent.SUCCESS} minimal>
			Done
		</Tag>
	);
};

const TaskCounts = ({ task }: { task: RedepositTask }) => {
	const { output } = task;
	if (task.isProcessing) {
		const progress = output.progress;
		return <>{progress ? `${progress.processed} / ${progress.total}` : 'Starting'}</>;
	}
	if (task.error) {
		return <span className="error-text">{String(task.error)}</span>;
	}
	return (
		<>
			{output.succeeded ?? 0} deposited
			{output.failed ? `, ${output.failed} failed` : ''}
			{output.stopped ? `, ${(output.total ?? 0) - (output.processed ?? 0)} not run` : ''}
		</>
	);
};

const ItemList = ({ items, showErrors }: { items: ItemSummary[]; showErrors?: boolean }) => (
	<ul className="item-list">
		{items.map((item) => (
			<li key={item.doi}>
				<a href={crossrefApiUrl(item.doi)} target="_blank" rel="noreferrer">
					{item.doi}
				</a>{' '}
				{item.title}
				{showErrors && item.error && <div className="error-text">{item.error}</div>}
			</li>
		))}
	</ul>
);

const ActiveRun = ({
	task,
	onStop,
	isStopping,
}: {
	task: RedepositTask;
	onStop: () => void;
	isStopping: boolean;
}) => {
	const progress = task.output.progress;
	const fraction = progress && progress.total ? progress.processed / progress.total : undefined;
	const failures = task.output.failures ?? [];
	return (
		<div className="active-run">
			<h4>
				Running: {describeScope(task)}
				<Button
					small
					intent={Intent.DANGER}
					text={task.input.stopRequested ? 'Stopping…' : 'Stop'}
					disabled={task.input.stopRequested || isStopping}
					onClick={onStop}
				/>
			</h4>
			<ProgressBar value={fraction} intent={Intent.PRIMARY} stripes={!progress} />
			<div className="run-detail">
				{progress
					? `${progress.processed} of ${progress.total} deposited, ${progress.failed} failed`
					: 'Waiting for the worker to start…'}
				{progress?.current && (
					<div className={Classes.TEXT_MUTED}>Last: {progress.current.title}</div>
				)}
			</div>
			{failures.length > 0 && <ItemList items={failures} showErrors />}
		</div>
	);
};

const DoiRedeposit = () => {
	const search = useCommunitySearch();
	const [community, setCommunity] = useState<CommunityOption | null>(null);
	const [plan, setPlan] = useState<Plan | null>(null);
	const [testSlug, setTestSlug] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [isConfirmingAll, setIsConfirmingAll] = useState(false);
	const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const loadPlan = useCallback(async (communityId: string) => {
		try {
			const params = new URLSearchParams({ communityId });
			setPlan(await apiFetch.get<Plan>(`/api/superadmin/doi-redeposit?${params}`));
			setError(null);
		} catch (err: any) {
			setError(err?.message || 'Failed to load DOIs for this community.');
		}
	}, []);

	useEffect(() => {
		setPlan(null);
		setTestSlug('');
		if (community) {
			loadPlan(community.id);
		}
	}, [community, loadPlan]);

	const activeTask = plan?.tasks.find((task) => task.isProcessing) ?? null;
	const activeTaskId = activeTask?.id;

	// Poll the running task, and reload the plan (and its run history) once it finishes.
	useEffect(() => {
		if (!activeTaskId || !community) return undefined;
		const interval = setInterval(async () => {
			try {
				const task = await apiFetch.get<RedepositTask>(
					`/api/superadmin/doi-redeposit/tasks/${activeTaskId}`,
				);
				if (!task.isProcessing) {
					loadPlan(community.id);
					setExpandedTaskId(task.id);
					return;
				}
				setPlan(
					(current) =>
						current && {
							...current,
							tasks: current.tasks.map((t) => (t.id === task.id ? task : t)),
						},
				);
			} catch {
				// Keep polling; a missed poll is harmless.
			}
		}, pollIntervalMs);
		return () => clearInterval(interval);
	}, [activeTaskId, community, loadPlan]);

	const startRun = async (body: { pubSlug?: string }) => {
		if (!community) return;
		setIsLoading(true);
		setError(null);
		try {
			await apiFetch.post('/api/superadmin/doi-redeposit', {
				communityId: community.id,
				...body,
			});
			await loadPlan(community.id);
		} catch (err: any) {
			setError(err?.message || 'Failed to start the redeposit.');
		} finally {
			setIsLoading(false);
			setIsConfirmingAll(false);
		}
	};

	const stopRun = async () => {
		if (!activeTask || !community) return;
		setIsLoading(true);
		try {
			await apiFetch.post(`/api/superadmin/doi-redeposit/tasks/${activeTask.id}/stop`);
			await loadPlan(community.id);
		} catch (err: any) {
			setError(err?.message || 'Failed to stop the redeposit.');
		} finally {
			setIsLoading(false);
		}
	};

	const total = plan ? plan.collectionCount + plan.pubCount : 0;
	const testTarget = testSlug.trim() || plan?.firstPub?.slug;

	return (
		<div className="doi-redeposit-component">
			<h2>DOI Redeposit</h2>
			<p className={Classes.TEXT_MUTED}>
				Resends a community's existing DOIs to Crossref, rebuilt from current data. Use it
				after a fix to the deposit code. Each pub keeps the content version and review
				settings from its last deposit.
			</p>

			{error && (
				<Callout intent={Intent.DANGER} className="callout">
					{error}
				</Callout>
			)}

			<FormGroup label="Community">
				<Suggest<CommunityOption>
					items={search.results}
					query={search.query}
					onQueryChange={search.setQuery}
					selectedItem={community}
					onItemSelect={(item) => {
						setCommunity(item);
						search.setQuery(item.title);
					}}
					inputValueRenderer={(item) => item.title}
					itemRenderer={(item, { handleClick, modifiers }) => (
						<MenuItem
							key={item.id}
							text={item.title}
							label={item.subdomain}
							active={modifiers.active}
							onClick={handleClick}
						/>
					)}
					noResults={
						search.query.trim() ? (
							<MenuItem disabled text="No communities found" />
						) : undefined
					}
					resetOnSelect={false}
					inputProps={{ placeholder: 'Search communities…' }}
					popoverProps={{ minimal: true, position: Position.BOTTOM_LEFT }}
				/>
			</FormGroup>

			{community && !plan && !error && <p className={Classes.TEXT_MUTED}>Loading…</p>}

			{plan && (
				<>
					<HTMLTable condensed className="plan-table">
						<tbody>
							<tr>
								<th>DOI prefix</th>
								<td>{plan.doiPrefix ?? 'Default PubPub prefix'}</td>
							</tr>
							<tr>
								<th>Community ISSN</th>
								<td>{plan.community.issn ?? 'None set'}</td>
							</tr>
							<tr>
								<th>To redeposit</th>
								<td>
									{plan.collectionCount} collections, {plan.pubCount} pubs
								</td>
							</tr>
							<tr>
								<th>Skipped</th>
								<td>
									{plan.skipped.pubsWithoutDepositRecord} pubs with a DOI that
									PubPub didn't deposit, {plan.skipped.pubsWithoutRelease} pubs
									without a release
								</td>
							</tr>
						</tbody>
					</HTMLTable>

					{!plan.community.issn && (
						<Callout intent={Intent.WARNING} className="callout">
							This community has no ISSN set, so deposits will only carry ISSNs set on
							individual issues. Add it in the community's settings first if it has
							one.
						</Callout>
					)}

					{activeTask ? (
						<ActiveRun task={activeTask} onStop={stopRun} isStopping={isLoading} />
					) : (
						<div className="actions">
							<FormGroup
								label="Test with one pub"
								helperText="Deposits a single pub so you can check the record in Crossref before running everything."
							>
								<div className="test-row">
									<InputGroup
										placeholder={plan.firstPub?.slug ?? 'Pub slug'}
										value={testSlug}
										onChange={(e) => setTestSlug(e.target.value)}
										disabled={isLoading}
									/>
									<Button
										text="Deposit one pub"
										disabled={isLoading || !testTarget}
										onClick={() => startRun({ pubSlug: testTarget })}
									/>
								</div>
							</FormGroup>
							<Button
								intent={Intent.PRIMARY}
								text={`Redeposit all (${total})`}
								disabled={isLoading || total === 0}
								onClick={() => setIsConfirmingAll(true)}
							/>
						</div>
					)}

					{plan.tasks.length > 0 && (
						<>
							<h4>Recent runs</h4>
							<HTMLTable condensed interactive className="runs-table">
								<thead>
									<tr>
										<th>Started</th>
										<th>Scope</th>
										<th>Status</th>
										<th>Result</th>
									</tr>
								</thead>
								<tbody>
									{plan.tasks.map((task) => (
										<React.Fragment key={task.id}>
											<tr
												onClick={() =>
													setExpandedTaskId(
														expandedTaskId === task.id ? null : task.id,
													)
												}
											>
												<td>{formatDate(task.createdAt)}</td>
												<td>{describeScope(task)}</td>
												<td>
													<TaskStatus task={task} />
												</td>
												<td>
													<TaskCounts task={task} />
												</td>
											</tr>
											{expandedTaskId === task.id && !task.isProcessing && (
												<tr className="run-detail-row">
													<td colSpan={4}>
														{!!task.output.failures?.length && (
															<>
																<strong>Failed</strong>
																<ItemList
																	items={task.output.failures}
																	showErrors
																/>
															</>
														)}
														{!!task.output.deposited?.length && (
															<>
																<strong>Deposited (first 5)</strong>
																<ItemList
																	items={task.output.deposited}
																/>
															</>
														)}
														<div className={Classes.TEXT_MUTED}>
															Crossref processes deposits in a queue,
															so changes can take a few minutes to
															show in its API.
														</div>
													</td>
												</tr>
											)}
										</React.Fragment>
									))}
								</tbody>
							</HTMLTable>
						</>
					)}
				</>
			)}

			<Dialog
				isOpen={isConfirmingAll}
				onClose={() => setIsConfirmingAll(false)}
				title="Redeposit all DOIs?"
			>
				<div className={Classes.DIALOG_BODY}>
					<p>
						This sends {total} deposits to Crossref for {plan?.community.title}, one at
						a time. Expect it to take a while. You can stop it from this page.
					</p>
				</div>
				<div className={Classes.DIALOG_FOOTER}>
					<div className={Classes.DIALOG_FOOTER_ACTIONS}>
						<Button text="Cancel" onClick={() => setIsConfirmingAll(false)} />
						<Button
							intent={Intent.PRIMARY}
							text="Redeposit all"
							loading={isLoading}
							onClick={() => startRun({})}
						/>
					</div>
				</div>
			</Dialog>
		</div>
	);
};

export default DoiRedeposit;

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

type Status =
	| 'ready'
	| 'skipped'
	| 'error'
	| 'submitted'
	| 'succeeded'
	| 'warning'
	| 'failed'
	| 'unverified';

type ItemResult = {
	kind: 'pub' | 'collection';
	title: string;
	doi: string;
	slug: string;
	status: Status;
	message?: string;
	changes?: string[];
	submissionFile?: string;
};

type RedepositTask = {
	id: string;
	createdAt: string;
	isProcessing: boolean;
	error: string | null;
	input: {
		communityId: string;
		pubSlug?: string;
		limit?: number;
		checkOnly?: boolean;
		stopRequested?: boolean;
		source?: string;
	};
	output: {
		startedAt?: string;
		finishedAt?: string;
		plan?: { warnings?: string[] };
		progress?: {
			phase: 'sending' | 'verifying';
			total: number;
			processed: number;
			current: { title: string; doi: string } | null;
		};
		total?: number;
		notRun?: number;
		stopped?: boolean;
		counts: Partial<Record<Status, number>>;
		needsAttention: ItemResult[];
		succeeded: ItemResult[];
		changed: ItemResult[];
	};
};

type Plan = {
	community: { id: string; title: string; subdomain: string; issn: string | null };
	doiPrefix: string;
	submissionHost: string | null;
	isTestCrossref: boolean;
	warnings: string[];
	collectionCount: number;
	pubCount: number;
	firstPub: { slug: string; title: string; doi: string } | null;
	skipped: { pubsWithoutDepositRecord: number; pubsWithoutRelease: number };
	tasks: RedepositTask[];
};

const pollIntervalMs = 3000;

const statusLabels: Record<Status, string> = {
	ready: 'ready to send',
	skipped: 'skipped',
	error: 'not sent (error)',
	submitted: 'awaiting Crossref',
	succeeded: 'succeeded',
	warning: 'succeeded with warning',
	failed: 'failed at Crossref',
	unverified: 'unconfirmed',
};

const statusIntents: Partial<Record<Status, Intent>> = {
	ready: Intent.SUCCESS,
	succeeded: Intent.SUCCESS,
	skipped: Intent.WARNING,
	warning: Intent.WARNING,
	unverified: Intent.WARNING,
	error: Intent.DANGER,
	failed: Intent.DANGER,
};

const crossrefApiUrl = (doi: string) => `https://api.crossref.org/works/${doi}`;

const formatDate = (value?: string) => (value ? new Date(value).toLocaleString() : '');

const describeScope = (task: RedepositTask) => {
	const scope = task.input.pubSlug
		? `Pub ${task.input.pubSlug}`
		: task.input.limit
			? `First ${task.input.limit} pubs`
			: 'All DOIs';
	const mode = task.input.checkOnly ? 'Check' : 'Redeposit';
	return `${mode}: ${scope}${task.input.source === 'cli' ? ' (CLI)' : ''}`;
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

const StatusCounts = ({ counts }: { counts: Partial<Record<Status, number>> }) => (
	<span className="status-counts">
		{(Object.keys(statusLabels) as Status[])
			.filter((status) => counts[status])
			.map((status) => (
				<Tag key={status} minimal intent={statusIntents[status]}>
					{counts[status]} {statusLabels[status]}
				</Tag>
			))}
	</span>
);

const TaskState = ({ task }: { task: RedepositTask }) => {
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
				Crashed
			</Tag>
		);
	}
	if (task.output.stopped) {
		return (
			<Tag intent={Intent.WARNING} minimal>
				Stopped
			</Tag>
		);
	}
	return <Tag minimal>Finished</Tag>;
};

const ItemList = ({ items }: { items: ItemResult[] }) => (
	<ul className="item-list">
		{items.map((item) => (
			<li key={`${item.kind}-${item.doi}`}>
				<Tag minimal intent={statusIntents[item.status]}>
					{statusLabels[item.status]}
				</Tag>{' '}
				<a href={crossrefApiUrl(item.doi)} target="_blank" rel="noreferrer">
					{item.doi}
				</a>{' '}
				{item.title}
				{item.message && <div className="item-message">{item.message}</div>}
				{item.changes?.map((change) => (
					<div key={change} className={Classes.TEXT_MUTED}>
						{change}
					</div>
				))}
			</li>
		))}
	</ul>
);

const RunDetail = ({ task }: { task: RedepositTask }) => {
	const { output } = task;
	return (
		<div className="run-detail">
			{task.error && (
				<Callout intent={Intent.DANGER} className="callout">
					The run stopped with an error: {String(task.error)}. Anything listed below was
					already handled; items not listed weren't sent.
				</Callout>
			)}
			{!!output.notRun && (
				<p>{output.notRun} items weren't reached before the run stopped.</p>
			)}
			{output.needsAttention.length > 0 && (
				<>
					<strong>Needs attention</strong>
					<ItemList items={output.needsAttention} />
				</>
			)}
			{output.changed.length > 0 && (
				<>
					<strong>Sent with other changes (first 20)</strong>
					<ItemList items={output.changed} />
				</>
			)}
			{output.succeeded.length > 0 && (
				<>
					<strong>Succeeded (first 5)</strong>
					<ItemList items={output.succeeded} />
				</>
			)}
		</div>
	);
};

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
	const verb = progress?.phase === 'verifying' ? 'confirmed by Crossref' : 'checked';
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
			<div className="run-progress">
				{progress
					? `${progress.processed} of ${progress.total} ${verb}`
					: 'Waiting for the worker to start…'}
				{progress?.phase === 'verifying' && (
					<div className={Classes.TEXT_MUTED}>
						Everything has been sent. Reading Crossref's submission logs, which can take
						a while; Stop ends the checking, not the deposits.
					</div>
				)}
				{progress?.current && (
					<div className={Classes.TEXT_MUTED}>Last: {progress.current.title}</div>
				)}
			</div>
			<StatusCounts counts={task.output.counts} />
			<RunDetail task={task} />
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
		setError(null);
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

	const startRun = async (body: { pubSlug?: string; checkOnly?: boolean }) => {
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
			setError(err?.message || 'Failed to start the run.');
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
			setError(err?.message || 'Failed to stop the run.');
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
				Resends a community's existing DOIs to Crossref, rebuilt from current data, for use
				after a fix to the deposit code. Each item is checked just before it is sent and
				skipped, with the reason, if its DOI, record type, issue, or journal would change,
				or if Crossref holds metadata PubPub doesn't send. Results come from Crossref's
				submission logs, not just from Crossref accepting the upload.
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
								<th>Sends to</th>
								<td>
									{plan.submissionHost ?? 'Not configured'}
									{plan.isTestCrossref && (
										<Tag minimal intent={Intent.WARNING} className="inline-tag">
											test system
										</Tag>
									)}
								</td>
							</tr>
							<tr>
								<th>DOI prefix</th>
								<td>{plan.doiPrefix}</td>
							</tr>
							<tr>
								<th>Community ISSN</th>
								<td>{plan.community.issn ?? 'None'}</td>
							</tr>
							<tr>
								<th>To redeposit</th>
								<td>
									{plan.collectionCount} collections, {plan.pubCount} pubs
								</td>
							</tr>
							<tr>
								<th>Not included</th>
								<td>
									{plan.skipped.pubsWithoutDepositRecord} pubs with a DOI that
									PubPub didn't deposit, {plan.skipped.pubsWithoutRelease} pubs
									without a release
								</td>
							</tr>
						</tbody>
					</HTMLTable>

					{plan.warnings.map((warning) => (
						<Callout key={warning} intent={Intent.WARNING} className="callout">
							{warning}
						</Callout>
					))}

					{activeTask ? (
						<ActiveRun task={activeTask} onStop={stopRun} isStopping={isLoading} />
					) : (
						<div className="steps">
							<FormGroup
								label="1. Check everything"
								helperText="Runs every check against PubPub and Crossref and sends nothing."
							>
								<Button
									text={`Check all (${total})`}
									disabled={isLoading || total === 0}
									onClick={() => startRun({ checkOnly: true })}
								/>
							</FormGroup>
							<FormGroup
								label="2. Send one pub"
								helperText="Then open its Crossref record to confirm the result before sending the rest."
							>
								<div className="test-row">
									<InputGroup
										placeholder={plan.firstPub?.slug ?? 'Pub slug'}
										value={testSlug}
										onChange={(e) => setTestSlug(e.target.value)}
										disabled={isLoading}
									/>
									<Button
										text="Send one pub"
										disabled={isLoading || !testTarget}
										onClick={() => startRun({ pubSlug: testTarget })}
									/>
								</div>
							</FormGroup>
							<FormGroup label="3. Send everything">
								<Button
									intent={Intent.PRIMARY}
									text={`Redeposit all (${total})`}
									disabled={isLoading || total === 0}
									onClick={() => setIsConfirmingAll(true)}
								/>
							</FormGroup>
						</div>
					)}

					{plan.tasks.length > 0 && (
						<>
							<h4>Recent runs</h4>
							<HTMLTable condensed interactive className="runs-table">
								<thead>
									<tr>
										<th>Started</th>
										<th>Run</th>
										<th>State</th>
										<th>Results</th>
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
													<TaskState task={task} />
												</td>
												<td>
													<StatusCounts counts={task.output.counts} />
												</td>
											</tr>
											{expandedTaskId === task.id && !task.isProcessing && (
												<tr className="run-detail-row">
													<td colSpan={4}>
														<RunDetail task={task} />
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
						This checks and sends up to {total} deposits to Crossref (
						{plan?.submissionHost}) for {plan?.community.title}, one at a time, then
						reads Crossref's submission logs for up to two hours. Items that fail a
						check are skipped, not sent.
					</p>
					{plan?.warnings.map((warning) => (
						<Callout key={warning} intent={Intent.WARNING} className="callout">
							{warning}
						</Callout>
					))}
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

import archiver from 'archiver';
import { Op } from 'sequelize';
import { PassThrough } from 'stream';

import { env } from 'server/env';
import { getOrStartExportTask } from 'server/export/queries';
import { Collection, Community, Export, FtpTarget, Pub, Release, WorkerTask } from 'server/models';
import { getCollectionPubsInCollection } from 'server/utils/collectionQueries';
import { assetsClient, exportsClient } from 'server/utils/s3';
import { uploadFileViaSftp } from 'server/utils/sftp';
import { updateWorkerTask } from 'server/workerTask/queries';
import { aes256Decrypt } from 'utils/crypto';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const waitForExportUrl = async (
	pubId: string,
	format: string,
	historyKey: number,
	timeoutMs = 120_000,
): Promise<string | null> => {
	// Prefer an export that matches the latest release's exact historyKey.
	const exactMatch = await Export.findOne({
		where: { pubId, format, historyKey, url: { [Op.ne]: null } },
	});
	if (exactMatch?.url) return exactMatch.url;

	// Trigger generation for the exact historyKey (one attempt only).
	const result = await getOrStartExportTask({ pubId, format, historyKey });
	if (result.url) return result.url;

	if (result.taskId) {
		// Poll until the export task finishes.
		const start = Date.now();
		while (Date.now() - start < timeoutMs) {
			// biome-ignore lint/performance/noAwaitInLoops: intentional polling loop
			await sleep(3000);
			const exp = await Export.findOne({
				where: { pubId, format, historyKey, url: { [Op.ne]: null } },
			});
			if (exp?.url) return exp.url;
			const task = await WorkerTask.findByPk(result.taskId, {
				attributes: ['isProcessing', 'error'],
			});
			if (!task || task.error) break;
			if (!task.isProcessing) break;
		}
	}

	// Generation didn't produce a result — fall back to the most recent
	// completed export for this pub+format regardless of historyKey. This
	// covers the case where the export was generated from the draft view at a
	// historyKey that differs from the release's.
	const fallback = await Export.findOne({
		where: { pubId, format, url: { [Op.ne]: null } },
		order: [['createdAt', 'DESC']],
	});
	return fallback?.url ?? null;
};

export const collectionExportTask = async ({
	collectionId,
	communityId,
	ftpTargetId,
	workerTaskId,
}: {
	collectionId: string;
	communityId: string;
	ftpTargetId?: string | null;
	workerTaskId?: string;
}) => {
	const [collection, community] = await Promise.all([
		Collection.findByPk(collectionId, { attributes: ['id', 'slug', 'title'] }),
		Community.findByPk(communityId, { attributes: ['id', 'subdomain'] }),
	]);

	if (!collection || !community) {
		throw new Error(`Collection or community not found`);
	}

	const collectionPubs = await getCollectionPubsInCollection(collectionId);
	const pubIds = collectionPubs.map((cp) => cp.pubId);

	const pubs = await Pub.findAll({
		where: { id: pubIds },
		include: [
			{
				model: Release,
				as: 'releases',
				attributes: ['historyKey', 'createdAt'],
				separate: true,
				order: [['createdAt', 'DESC']],
			},
		],
		attributes: ['id', 'slug'],
	});

	const pubsWithReleases = pubs.filter((p) => p.releases && p.releases.length > 0);

	const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
	const zipName = `${community.subdomain}-${collection.slug}-${timestamp}.zip`;

	const archiveStream = archiver('zip', { zlib: { level: 6 } });
	const chunks: Buffer[] = [];

	archiveStream.on('data', (chunk: Buffer) => chunks.push(chunk));

	const archiveFinished = new Promise<void>((resolve, reject) => {
		archiveStream.on('end', resolve);
		archiveStream.on('error', reject);
	});

	const fetchFile = async (url: string, name: string) => {
		const key = new URL(url).pathname.slice(1);
		const stream = await assetsClient.downloadFile(key);
		archiveStream.append(stream, { name });
	};

	const pubOutcomes = await Promise.allSettled(
		pubsWithReleases.map(async (pub) => {
			const { historyKey } = pub.releases![0];

			const [pdfUrl, jatsUrl] = await Promise.all([
				waitForExportUrl(pub.id, 'pdf', historyKey),
				waitForExportUrl(pub.id, 'jats', historyKey),
			]);

			const fileResults = await Promise.allSettled([
				pdfUrl
					? fetchFile(pdfUrl, `${pub.slug}/${pub.slug}.pdf`)
					: Promise.reject(new Error('no pdf export')),
				jatsUrl
					? fetchFile(jatsUrl, `${pub.slug}/${pub.slug}.xml`)
					: Promise.reject(new Error('no jats export')),
			]);

			fileResults.forEach((r, i) => {
				if (r.status === 'rejected') {
					const label = i === 0 ? 'PDF' : 'JATS XML';
					console.error(
						`[collectionExport] Failed to fetch ${label} for ${pub.slug}:`,
						r.reason,
					);
				}
			});

			const missingFormats = fileResults.flatMap((r, i) =>
				r.status === 'rejected' ? [i === 0 ? 'PDF' : 'JATS XML'] : [],
			);

			return {
				slug: pub.slug,
				filesAdded: fileResults.filter((r) => r.status === 'fulfilled').length,
				missingFormats,
			};
		}),
	);

	const skippedPubs: string[] = [];
	const partialPubs: { slug: string; missingFormats: string[] }[] = [];
	let filesAdded = 0;
	for (const outcome of pubOutcomes) {
		if (outcome.status === 'fulfilled') {
			filesAdded += outcome.value.filesAdded;
			if (outcome.value.filesAdded === 0) {
				skippedPubs.push(outcome.value.slug);
			} else if (outcome.value.missingFormats.length > 0) {
				partialPubs.push({
					slug: outcome.value.slug,
					missingFormats: outcome.value.missingFormats,
				});
			}
		}
	}

	archiveStream.finalize();
	await archiveFinished;

	if (filesAdded === 0) {
		const reason =
			pubsWithReleases.length === 0
				? 'This collection has no published pubs to export.'
				: 'No files could be added to the archive — all pub exports were missing or failed to download.';
		throw new Error(reason);
	}

	const zipBuffer = Buffer.concat(chunks);
	const s3Key = `exports/collections/${collectionId}/${zipName}`;

	const passthrough = new PassThrough();
	passthrough.end(zipBuffer);
	await exportsClient.uploadFileSplit(s3Key, passthrough, { queueSize: 4 });

	const downloadUrl = await exportsClient.getPresignedUrl(s3Key);

	let ftpUploaded = false;
	if (ftpTargetId) {
		const ftpTarget = await FtpTarget.findByPk(ftpTargetId);
		if (
			ftpTarget?.host &&
			ftpTarget.username &&
			ftpTarget.password &&
			ftpTarget.passwordInitVec
		) {
			const password = aes256Decrypt(
				ftpTarget.password,
				env.AES_ENCRYPTION_KEY!,
				ftpTarget.passwordInitVec,
			);
			const baseDir = ftpTarget.filePath?.replace(/\/$/, '') ?? '';
			const remotePath = baseDir ? `${baseDir}/${zipName}` : zipName;
			try {
				await uploadFileViaSftp(
					{
						host: ftpTarget.host,
						port: ftpTarget.port ?? undefined,
						username: ftpTarget.username,
						password,
					},
					remotePath,
					zipBuffer,
				);
				ftpUploaded = true;
			} catch (err) {
				console.error('[collectionExport] FTP upload failed:', err);
			}
		}
	}

	if (workerTaskId) {
		await updateWorkerTask({
			id: workerTaskId,
			body: { output: { downloadUrl, ftpUploaded, skippedPubs, partialPubs } },
		});
	}

	return { downloadUrl, ftpUploaded, skippedPubs };
};

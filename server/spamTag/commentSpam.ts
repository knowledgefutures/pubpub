import type { DocJson, NewAccountLinkCommentTriggerSource, UserSpamTagFields } from 'types';

import { type Mark, Node } from 'prosemirror-model';

import { editorSchema } from 'client/components/Editor';
import { SpamTag, User } from 'server/models';
import { contextFromUser, notify } from 'server/spamTag/notifications';
import { upsertSpamTag } from 'server/spamTag/userQueries';

const DEFAULT_NEW_ACCOUNT_LINK_COMMENT_WINDOW_MINUTES = 10;

const parsedWindowMinutes = parseInt(
	process.env.NEW_ACCOUNT_LINK_COMMENT_WINDOW_MINUTES ||
		DEFAULT_NEW_ACCOUNT_LINK_COMMENT_WINDOW_MINUTES.toString(),
	10,
);

const IS_WINDOW_MINUTES_VALID = Number.isFinite(parsedWindowMinutes) && parsedWindowMinutes > 0;

const NEW_ACCOUNT_LINK_COMMENT_WINDOW_MINUTES = IS_WINDOW_MINUTES_VALID
	? parsedWindowMinutes
	: DEFAULT_NEW_ACCOUNT_LINK_COMMENT_WINDOW_MINUTES;

const NEW_ACCOUNT_LINK_COMMENT_WINDOW_MS = NEW_ACCOUNT_LINK_COMMENT_WINDOW_MINUTES * 60 * 1000;
const URL_REGEX = /\b(?:https?:\/\/|www\.)[^\s<]+/gi;

type AutoBanNewAccountLinkCommentOptions = {
	userId: string;
	text: string;
	content: DocJson;
	source: NewAccountLinkCommentTriggerSource;
};

export const extractUrlsFromString = (value: string | null | undefined): string[] | null => {
	if (!value) {
		return null;
	}

	const matchedUrl = value.matchAll(URL_REGEX);
	if (!matchedUrl) {
		return null;
	}

	return [...matchedUrl].map((match) => match[0]);
};

const hasValidContentShape = (value: unknown): value is DocJson => {
	if (!value || typeof value !== 'object') {
		return false;
	}

	const content = value as { type?: unknown };
	return typeof content.type === 'string';
};

export const extractLinksFromContent = (content: DocJson | null | undefined): string[] | null => {
	if (!hasValidContentShape(content)) {
		return null;
	}

	try {
		const contentTree = Node.fromJSON(editorSchema, content);
		const links: Mark[] = [];

		contentTree.descendants((node) => {
			node.marks.forEach((mark) => {
				if (mark.type.name === 'link') {
					// don't push relative urls
					if (mark.attrs.href.startsWith('/')) {
						return;
					}
					links.push(mark);
				}
			});
		});

		const hrefs = links
			.map((link) => link.attrs.href)
			.filter((href) => typeof href === 'string' && href.length);
		if (hrefs.length === 0) {
			return null;
		}

		return hrefs;
	} catch {
		return null;
	}
};

export const extractFirstLinkFromContent = (content: DocJson): string | null => {
	const links = extractLinksFromContent(content);
	if (!links) {
		return null;
	}
	return links[0];
};

const getAccountAgeMs = (createdAt: Date | null | undefined): number => {
	if (!(createdAt instanceof Date)) {
		return Number.POSITIVE_INFINITY;
	}

	return Date.now() - createdAt.getTime();
};

const buildTriggerFields = (
	linkValue: string,
	source: NewAccountLinkCommentTriggerSource,
	accountAgeMs: number,
): UserSpamTagFields => {
	return {
		newAccountLinkCommentTriggers: [
			{
				source,
				value: linkValue,
				accountAgeMinutes: Math.max(0, Math.floor(accountAgeMs / (60 * 1000))),
				triggeredAt: new Date().toISOString(),
			},
		],
	};
};

export const autoBanForNewAccountLinkComment = async (
	options: AutoBanNewAccountLinkCommentOptions,
): Promise<boolean> => {
	const { userId, text, content, source } = options;

	const user = await User.findOne({
		where: { id: userId },
		include: [{ model: SpamTag, as: 'spamTag' }],
	});

	const accountAgeMs = getAccountAgeMs(user?.createdAt);
	const shouldSkipAutoBan = !user || accountAgeMs > NEW_ACCOUNT_LINK_COMMENT_WINDOW_MS;

	if (shouldSkipAutoBan) {
		return false;
	}

	const linkFromTree = extractFirstLinkFromContent(content);
	const linkFromText = extractUrlsFromString(text);

	const firstLink = linkFromTree?.[0] || linkFromText?.[0];

	if (!firstLink) {
		return false;
	}

	const previousStatus = user.spamTag?.status ?? null;

	const fields = buildTriggerFields(firstLink, source, accountAgeMs);

	const { spamTag, user: taggedUser } = await upsertSpamTag({
		userId,
		status: 'confirmed-spam',
		fields,
	});

	const shouldNotify = previousStatus !== 'confirmed-spam' && process.env.NODE_ENV !== 'test';

	if (shouldNotify) {
		await notify(
			'new-account-link-comment-ban',
			contextFromUser(taggedUser, {
				previousStatus,
				spamFields: spamTag.fields as UserSpamTagFields,
			}),
		);
	}

	return true;
};

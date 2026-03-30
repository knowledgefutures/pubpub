import type { DocJson } from 'types';

import { extractFirstLinkFromContent, extractUrlsFromString } from './commentSpam';

export const containsLink = (
	doc: DocJson | null | undefined,
	text: string | null | undefined,
): boolean => {
	if (!doc && !text) return false;
	if (doc) {
		return extractFirstLinkFromContent(doc) !== null;
	}

	if (text) {
		return extractUrlsFromString(text) !== null;
	}

	return false;
};

// these are template phrases that show up in spam comments that try to look like genuine engagement.
// only meaningful as a spam signal when the comment also contains a link.
const commentSpamTemplates = [
	'this blog post was very helpful',
	'this article was very helpful',
	'this post was very helpful',
	'i found the analysis',
	'i found this article',
	'top-tier and highly relevant',
	'maintains such a high level of professionalism',
	'delivering actionable data',
	'delivering actionable insights',
	'very informative article',
	'very informative post',
	'very informative blog',
	'great article',
	'great blog post',
	'really appreciate this content',
	'this is really informative',
	'this is really helpful',
	'thanks for sharing this',
	'amazing content',
	'wonderful article',
	'excellent article',
	'i really enjoyed reading this',
	'keep up the good work',
	'very well written',
	'this is exactly what i was looking for',
];

export const matchesCommentSpamTemplate = (text: string | null | undefined): string[] => {
	if (!text) return [];
	const lower = text.toLowerCase();
	return commentSpamTemplates.filter((template) => lower.includes(template));
};

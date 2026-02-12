export const uploadScamKeywords = [
	'robux',
	'roblox',
	'insta-likes',
	'instagram-likes',
	'free-followers',
	'v-bucks',
	'vbucks',
	'fortnite-hack',
	'free-robux',
	'tiktok-followers',
	'hack-generator',
] as const;

export const isSuspiciousUploadKey = (keyOrFilename: string): boolean => {
	const extraSuspiciousKeywords = process.env.EXTRA_SUSPICIOUS_KEYWORDS?.split(',') ?? [];
	const lower = keyOrFilename.toLowerCase();
	return [...uploadScamKeywords, ...extraSuspiciousKeywords].some((kw) => lower.includes(kw));
};

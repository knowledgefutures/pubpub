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
	const lower = keyOrFilename.toLowerCase();
	return uploadScamKeywords.some((kw) => lower.includes(kw));
};

export const getCookieOptions = () => ({
	expires: 365 * 1000,
	// If we're on pubpub.org or x.pubpub.org, make the cookie valid for [y.]pubpub.org
	...(window.location.host.includes('pubpub.org') && { domain: '.pubpub.org' }),
	...(window.location.host.includes('duqduq.org') && { domain: '.duqduq.org' }),
});

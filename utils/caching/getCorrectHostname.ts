import { isDuqDuq } from 'utils/environment';

/**
 * Returns the correct hostname based on the provided subdomain and domain. If the environment is
 * DuqDuq, it returns `${subdomain}.duqduq.org`. Else, it returns the domain if it's there,
 * otherwise `${subdomain}.pubpub.org`.
 *
 * @param subdomain - The subdomain to be used in the hostname.
 * @param domain - The optional domain to be used in the hostname.
 * @returns The correct hostname based on the provided subdomain and domain.
 */
export const getCorrectHostname = (subdomain: string, domain?: string | null) =>
	isDuqDuq() ? `${subdomain}.duqduq.org` : (domain ?? `${subdomain}.pubpub.org`);

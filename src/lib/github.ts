export interface GithubRepo {
    name: string;
    html_url: string;
    description: string | null;
    language: string | null;
    stargazers_count: number;
    homepage: string | null;
}

export interface GithubEvent {
    type: string;
    repoName: string;
    created_at: string;
    commitMessage: string | null;
}

interface CacheEntry<T> {
    timestamp: number;
    data: T;
}

const GITHUB_USERNAME = 'caleheinzz25';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

const cache = new Map<string, CacheEntry<unknown>>();

/**
 * Get cached data or null if expired/missing
 */
function getFromCache<T>(key: string): T | null {
    const entry = cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
        cache.delete(key);
        return null;
    }
    return entry.data;
}

/**
 * Set data in cache
 */
function setInCache<T>(key: string, data: T): void {
    cache.set(key, { timestamp: Date.now(), data });
}

/**
 * Fetch with authorization header
 */
async function fetchWithAuth(url: string, token: string): Promise<Response> {
    return fetch(url, {
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Astro-Portfolio-Builder'
        }
    });
}

/**
 * Get pinned/top repos for the user, sorted by pushed_at desc
 */
export async function getPinnedRepos(token: string | undefined): Promise<GithubRepo[]> {
    if (!token) {
        console.warn('\x1b[33m⚠ GITHUB_ACCESS_TOKEN not set - Projects section will be empty\x1b[0m');
        return [];
    }

    const cacheKey = 'pinned_repos';
    const cached = getFromCache<GithubRepo[]>(cacheKey);
    if (cached) {
        console.log('\x1b[32m✔ GitHub repos loaded from cache\x1b[0m');
        return cached;
    }

    try {
        const url = `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=pushed&per_page=30&direction=desc`;
        const response = await fetchWithAuth(url, token);

        if (response.status === 401 || response.status === 403) {
            console.warn(`\x1b[33m⚠ GitHub API returned ${response.status} - check your token\x1b[0m`);
            return [];
        }

        if (!response.ok) {
            console.warn(`\x1b[33m⚠ GitHub API error: ${response.status}\x1b[0m`);
            return [];
        }

        const repos = await response.json();

        const mapped: GithubRepo[] = repos.map((repo: any) => ({
            name: repo.name,
            html_url: repo.html_url,
            description: repo.description,
            language: repo.language,
            stargazers_count: repo.stargazers_count,
            homepage: repo.homepage || null
        }));

        setInCache(cacheKey, mapped);
        console.log('\x1b[32m✔ GitHub repos fetched successfully\x1b[0m');
        return mapped;
    } catch (error) {
        console.warn('\x1b[33m⚠ Failed to fetch GitHub repos:\x1b[0m', error);
        return [];
    }
}

/**
 * Get recent user events (PushEvent and CreateEvent only)
 */
export async function getUserEvents(token: string | undefined): Promise<GithubEvent[]> {
    if (!token) {
        console.warn('\x1b[33m⚠ GITHUB_ACCESS_TOKEN not set - Activity section will be empty\x1b[0m');
        return [];
    }

    const cacheKey = 'user_events';
    const cached = getFromCache<GithubEvent[]>(cacheKey);
    if (cached) {
        console.log('\x1b[32m✔ GitHub events loaded from cache\x1b[0m');
        return cached;
    }

    try {
        const url = `https://api.github.com/users/${GITHUB_USERNAME}/events?per_page=100`;
        const response = await fetchWithAuth(url, token);

        if (response.status === 401 || response.status === 403) {
            console.warn(`\x1b[33m⚠ GitHub API returned ${response.status} - check your token\x1b[0m`);
            return [];
        }

        if (!response.ok) {
            console.warn(`\x1b[33m⚠ GitHub API error: ${response.status}\x1b[0m`);
            return [];
        }

        const events = await response.json();

        const mapped: GithubEvent[] = events
            .filter((event: any) =>
                event.type === 'PushEvent' || event.type === 'CreateEvent'
            )
            .slice(0, 20)
            .map((event: any) => {
                let commitMessage: string | null = null;
                if (event.type === 'PushEvent' && event.payload?.commits?.length > 0) {
                    const msg = event.payload.commits[0].message || '';
                    commitMessage = msg.split('\n')[0]; // First line only
                } else if (event.type === 'CreateEvent') {
                    commitMessage = `Created ${event.payload?.ref_type || 'repository'}${event.payload?.ref ? `: ${event.payload.ref}` : ''}`;
                }

                return {
                    type: event.type,
                    repoName: event.repo?.name?.replace(`${GITHUB_USERNAME}/`, '') || event.repo?.name || 'unknown',
                    created_at: event.created_at,
                    commitMessage
                };
            });

        setInCache(cacheKey, mapped);
        console.log('\x1b[32m✔ GitHub events fetched successfully\x1b[0m');
        return mapped;
    } catch (error) {
        console.warn('\x1b[33m⚠ Failed to fetch GitHub events:\x1b[0m', error);
        return [];
    }
}

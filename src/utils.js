// Pure helpers — date math, GitHub fetch, bucketing.

export function dateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function buildDays(endDate, n) {
  const out = [];
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(end.getDate() - i);
    out.push(dateKey(d));
  }
  return out;
}

export function relativeTime(iso) {
  const ms = Date.now() - new Date(iso).getTime();
  const seconds = Math.round(ms / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);
  const months = Math.round(days / 30);
  const years = Math.round(days / 365);

  const fmt = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  if (Math.abs(seconds) < 60) return fmt.format(-seconds, 'second');
  if (Math.abs(minutes) < 60) return fmt.format(-minutes, 'minute');
  if (Math.abs(hours) < 24) return fmt.format(-hours, 'hour');
  if (Math.abs(days) < 30) return fmt.format(-days, 'day');
  if (Math.abs(months) < 12) return fmt.format(-months, 'month');
  return fmt.format(-years, 'year');
}

// Activity-level buckets. The 5 buckets give a usable contrast ramp
// without too many gradations to read at a glance.
export function bucketOf(count) {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 7) return 3;
  return 4;
}

// Fetch top-N owned, non-fork, non-archived repos for a user, sorted by
// most-recent push. Anonymous GitHub API; 60 req/hr/IP rate limit.
export async function fetchRepos(username, count = 6) {
  const url = `https://api.github.com/users/${username}/repos?type=owner&sort=pushed&per_page=30`;
  const r = await fetch(url, {
    headers: { Accept: 'application/vnd.github+json' }
  });
  if (!r.ok) throw new Error(`Repos API ${r.status}`);
  const data = await r.json();
  return data
    .filter((repo) => !repo.fork && !repo.archived)
    .slice(0, count);
}

// Fetch commits in the last N days ending at the repo's last push.
// Paginates through Link headers. Returns a { day: count } map.
export async function fetchRepoCommits(repo, days = 24) {
  const pushedAt = new Date(repo.pushed_at);
  const since = new Date(pushedAt);
  since.setDate(since.getDate() - days + 1);
  since.setHours(0, 0, 0, 0);

  let url = `https://api.github.com/repos/${repo.full_name}/commits?since=${encodeURIComponent(since.toISOString())}&until=${encodeURIComponent(pushedAt.toISOString())}&per_page=100`;

  const commits = [];
  while (url && commits.length < 500) {
    const r = await fetch(url, {
      headers: { Accept: 'application/vnd.github+json' }
    });
    if (!r.ok) throw new Error(`Commits API ${r.status} for ${repo.full_name}`);
    const page = await r.json();
    commits.push(...page);
    const link = r.headers.get('Link');
    const match = link && link.match(/<([^>]+)>;\s*rel="next"/);
    url = match ? match[1] : null;
  }

  const counts = {};
  for (const c of commits) {
    const iso = c.commit?.committer?.date || c.commit?.author?.date;
    if (!iso) continue;
    const key = dateKey(new Date(iso));
    counts[key] = (counts[key] || 0) + 1;
  }

  return {
    name: repo.name,
    fullName: repo.full_name,
    htmlUrl: repo.html_url,
    pushedAt: repo.pushed_at,
    counts
  };
}

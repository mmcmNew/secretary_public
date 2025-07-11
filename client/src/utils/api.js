export default async function api(url, method = 'GET', data = null) {
  const options = { method };
  if (data !== null) {
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify(data);
  }
  const res = await fetch(url, options);
  if (!res.ok) throw new Error('Request failed');
  return res.json();
}

export async function clearAllCache() {
  // no-op placeholder for previous cache clearing
}

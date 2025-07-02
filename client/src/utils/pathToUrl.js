export default function pathToUrl(path) {
  const parts = path.replace(/\\/g, '/').split('/');
  const [category, date_folder, filename] = parts;
  const params = new URLSearchParams({ category, date_folder, filename });
  return `/journals/file?${params.toString()}`;
}

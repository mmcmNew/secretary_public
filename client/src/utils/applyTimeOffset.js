export default function applyTimeOffset(dateInput, offset) {
  if (!dateInput && dateInput !== 0) return null; // allow 0? but not necessary
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return null;
  const offsetHours = Number(offset) || 0;
  if (offsetHours !== 0) {
    date.setHours(date.getHours() + offsetHours);
    if (isNaN(date.getTime())) return null;
  }
  return date.toISOString();
}

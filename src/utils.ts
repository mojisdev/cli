export function slugify(val: string): string {
  return val.normalize("NFD")
    .replace(/[\u0300-\u036F]/g, "")
    .replace(/\(.+\)/g, "")
    .trim()
    .replace("&", "")
    .replace(/[\W_]+/g, "-").toLowerCase();
}

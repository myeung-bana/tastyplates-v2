export async function fetchContentGuidelines() {
  const apiUrl = process.env.NEXT_PUBLIC_WP_API_URL || "http://localhost/tastyplates";
  const res = await fetch(`${apiUrl}/wp-json/v1/content-guidelines`);
  if (!res.ok) throw new Error("Failed to fetch Content Guidelines");
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return { title: data.title, content: data.content };
}

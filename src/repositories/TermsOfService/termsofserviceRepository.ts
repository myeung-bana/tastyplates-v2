export async function fetchTermsOfService() {
  const apiUrl = process.env.NEXT_PUBLIC_WP_API_URL || "http://localhost/tastyplates";
  const res = await fetch(`${apiUrl}/wp-json/v1/terms-of-service`);
  if (!res.ok) throw new Error("Failed to fetch Terms of Service");
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return { title: data.title, content: data.content };
}

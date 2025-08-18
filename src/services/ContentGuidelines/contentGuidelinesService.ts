import { fetchContentGuidelines } from "@/repositories/ContentGuidelines/contentGuidelinesRepository";

export async function getContentGuidelines() {
  return await fetchContentGuidelines();
}

import { TermsOfServiceRepo } from "@/repositories/interface/user/termsOfService";
import HttpMethods from "../requests";

const request = new HttpMethods();

export class TermsOfServiceRepository implements TermsOfServiceRepo {
  async fetchTermsOfService() {
    const res: Response = await request.GET('/wp-json/v1/terms-of-service');
    if (!res.ok) throw new Error("Failed to fetch Terms of Service");
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return { title: data.title, content: data.content };
  }
}

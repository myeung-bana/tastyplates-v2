import { ContentGuidelinesRepo } from "@/repositories/interface/user/contentGuidelines";
import HttpMethods from "../requests";

const request = new HttpMethods();

export class ContentGuidelinesRepository implements ContentGuidelinesRepo {
  async fetchContentGuidelines() {
    return request.GET('/wp-json/v1/content-guidelines');
  }
};

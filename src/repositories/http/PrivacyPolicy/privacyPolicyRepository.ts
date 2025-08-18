import { PrivacyPolicyRepo } from "@/repositories/interface/user/privacyPolicy";
import HttpMethods from "../requests";

const request = new HttpMethods();

export class PrivacyPolicyRepository implements PrivacyPolicyRepo {
  async fetchPrivacyPolicy() {
    return request.GET('/wp-json/v1/privacy-policy');
  }
};
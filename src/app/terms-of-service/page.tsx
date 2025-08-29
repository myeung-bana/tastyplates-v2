// "use client";
// import { Suspense, useEffect, useState } from "react";
// import Navbar from "@/components/Navbar";
// import Footer from "@/components/Footer";
// import { TermsOfServiceService } from "@/services/TermsOfService/termsOfServiceService";

// const termsOfServiceService = new TermsOfServiceService();

// export default function TermsOfService() {
//   const [terms, setTerms] = useState<{ title: string; content: string } | null>(null);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const cached = localStorage.getItem("termsOfService");
//     const expiry = localStorage.getItem("termsOfServiceExpiry");

//     if (cached && expiry && Date.now() < parseInt(expiry)) {
//       setTerms(JSON.parse(cached));
//     }

//     async function fetchTerms() {
//       try {
//         const data = await termsOfServiceService.getTermsOfService();
//         const newData = { title: data.title, content: data.content };

//         localStorage.setItem("termsOfService", JSON.stringify(newData));
//         localStorage.setItem("termsOfServiceExpiry", (Date.now() + 5 * 60 * 1000).toString());

//         setTerms(newData);
//       } catch (err: any) {
//         setError(err.message || "Unknown error");
//       }
//     }

//     fetchTerms();
//   }, []);

//   return (
//     <>
//       <Suspense fallback={<div></div>}>
//         <Navbar />
//       </Suspense>
//       <main className="min-h-screen flex flex-col justify-between bg-white gap-[12px]">
//         <div className="pt-24 px-4 flex justify-center">
//           <h1 className="text-[32px] font-bold text-center text-[#31343F] mb-8 max-w-xl w-full">
//             {terms?.title || "Terms of Service"}
//           </h1>
//         </div>

//         <div className="flex-1 flex items-center justify-center px-4 pb-8">
//           <div className="w-full max-w-xl">
//             <div className="text-[#31343F] flex flex-col gap-3 p-0">
//               {error ? (
//                 <div className="text-center py-8 text-red-500">{error}</div>
//               ) : terms ? (
//                 <section>
//                   <div
//                     className="prose prose-xs max-w-none text-[#31343F]"
//                     dangerouslySetInnerHTML={{ __html: terms.content }}
//                   />
//                 </section>
//               ) : null}
//             </div>
//           </div>
//         </div>

//         <Footer />
//       </main>
//     </>
//   );
// }


import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function TermsOfService() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen flex flex-col justify-between bg-white gap-[12px]">
        <div className="pt-24 px-4 flex justify-center">
          <h1 className="text-[32px] font-bold text-center text-[#31343F] mb-8 max-w-3xl w-full">
            Terms of Service
          </h1>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 pb-8">
          <div className="w-full max-w-3xl">
            <section className="prose prose-sm max-w-none text-[#31343F]">
              <p><strong>Last Updated:</strong> August 15, 2024</p>

              <p>
                These Terms of Service (which, together with the Business Terms below, are the “Terms”)
                are effective immediately for users accessing or using the Service without an Account
                or those registering Accounts on or after July 10, 2024 and will become effective
                August 31, 2024 for users with pre-existing Accounts.
              </p>

              <p className="font-bold">
                PLEASE NOTE: THESE TERMS INCLUDE DISPUTE RESOLUTION PROVISIONS (SEE SECTION 13) THAT,
                WITH LIMITED EXCEPTIONS, REQUIRE THAT (1) CLAIMS YOU BRING AGAINST Tasty Plates BE RESOLVED
                BY BINDING, INDIVIDUAL ARBITRATION, AND (2) YOU WAIVE YOUR RIGHT TO BRING OR PARTICIPATE
                IN ANY CLASS, GROUP, OR REPRESENTATIVE ACTION OR PROCEEDING.
              </p>

              <p>
                These Terms govern your access to and use of our products and services, including those offered
                through our websites, events, communications (e.g., emails, phone calls, and texts) and mobile
                applications (collectively, the “Service”). By accessing or using the Service, you are agreeing
                to these Terms, which form a legally binding contract with:
                <br />
                <strong>Tasty Plates Co. Ltd, Edmonton, Canada.</strong>
              </p>

              <hr className="my-6" />

              {/* ----------------- SECTION 1 ----------------- */}
              <h2>1. DEFINITIONS</h2>
              <h3>A. Parties</h3>
              <p>
                “You” and “your” refer to you, as a user of the Service. A “user” is someone who accesses or
                in any way uses the Service. “We,” “us,” and “our” refer to Tasty Plates and its subsidiaries.
              </p>

              <h3>B. Content</h3>
              <p>
                “Content” means text, images, photos, audio, video, and all other forms of data or communication.
                “Your Content” means Content that you submit or transmit to, through, or in connection with the
                Service, such as ratings, reviews, photos, videos, compliments, invitations, check-ins, votes,
                friending and following activity, direct messages, and information that you contribute to your
                user profile or suggest for a business page. “User Content” means Content that users submit or
                transmit to, through, or in connection with the Service. “Tasty Plates Content” means Content
                that we create and make available in connection with the Service. “Third Party Content” means
                Content that originates from parties other than Tasty Plates or its users, which is made available
                in connection with the Service. “Service Content” means all of the Content that is made available
                in connection with the Service, including Your Content, User Content, Tasty Plates Content,
                and Third Party Content.
              </p>

              <h3>C. Sites and Accounts</h3>
              <p>
                “Consumer Site” means Tasty Plate’s consumer website (<a href="https://www.tastyplates.com">www.tastyplates.com</a>)
                and related domains and mobile applications. “Consumer Account” means the account you create to
                access or use the Consumer Site. “Business Account” means the account you create to access or use
                the Tasty Plates for Business Owners website and mobile applications. “Account” means any Consumer
                Account or Business Account.
              </p>

              <hr className="my-6" />

              {/* ----------------- SECTION 2 ----------------- */}
              <h2>2. CHANGES TO THE TERMS</h2>
              <p>
                We may modify the Terms from time to time. You understand and agree that your access to or use of
                the Service is governed by the Terms effective at the time of your access to or use of the Service.
                If we make material changes to these Terms, we will notify you by email, by posting notice on the
                Service, and/or by other method prior to the effective date of the changes. We will also indicate
                at the top of this page the date that such changes were last made. You should revisit these Terms
                on a regular basis as revised versions will be binding on you. You understand and agree that your
                continued access to or use of the Service after the effective date of changes to the Terms
                represents your acceptance of such changes.
              </p>

              <hr className="my-6" />

              {/* ----------------- SECTION 3 ----------------- */}
              <h2>3. TRANSLATION</h2>
              <p>
                We may translate these Terms into other languages for your convenience. Nevertheless, the English
                version governs your relationship with Tasty Plates, and any inconsistencies among the different
                versions will be resolved in favor of the English version.
              </p>

              <hr className="my-6" />

              {/* ----------------- SECTION 4 ----------------- */}
              <h2>4. USING THE SERVICE</h2>
              <h3>A. Eligibility</h3>
              <p>
                To access or use the Service, you must have the requisite power and authority to enter into these Terms.
                You may not access or use the Service if you are a competitor of Tasty Plates or if we have previously
                banned you from the Service or closed your Account.
              </p>

              <h3>B. Permission to Use the Service</h3>
              <p>
                We grant you permission to use the Service subject to these Terms. Your use of the Service is at your
                own risk, including the risk that you might be exposed to Content that is offensive, indecent, inaccurate,
                objectionable, incomplete, fails to provide adequate warning about potential risks or hazards, or is
                otherwise inappropriate.
              </p>

              <h3>C. Service Availability</h3>
              <p>
                The Service may be modified, updated, interrupted, suspended or discontinued at any time without
                notice or liability.
              </p>

              <h3>D. Accounts</h3>
              <p>
                You must create an Account and provide certain information about yourself in order to use some of the
                features that are offered through the Service. You are responsible for maintaining the confidentiality
                of your Account password. You are also responsible for all activities that occur in connection with
                your Account. You agree to notify us immediately of any unauthorized use of your Account. We reserve
                the right to close your Account at any time for any or no reason.
              </p>

              <p>
                Your Consumer Account is for your personal, non-commercial use only, and you may not create or use
                a Consumer Account for anyone other than yourself. We ask that you provide complete and accurate
                information about yourself when creating an Account in order to bolster your credibility as a contributor
                to the Service. You may not impersonate someone else, provide an email address other than your own,
                create multiple Accounts, or transfer your Consumer Account to another person without Tasty Plates’s
                prior approval.
              </p>

              <h3>E. Communications from Tasty Plates and Others</h3>
              <p>
                By accessing or using the Service, you consent to receive communications from other users and
                Tasty Plates through the Service, or through any other means such as emails, push notifications,
                text messages (including SMS and MMS), and phone calls. These communications may promote Tasty Plates
                or businesses listed on Tasty Plates, and may be initiated by Tasty Plates, businesses listed on Tasty Plates,
                or other users. You further understand that communications may be sent using an automatic telephone dialing
                system, and that you may be charged by your phone carrier for certain communications such as SMS messages
                or phone calls. You agree to notify us immediately if the phone number(s) you have provided to us have been
                changed or disconnected. Please note that any communications, including phone calls, with Tasty Plates or
                made through the Service may be monitored and recorded for quality purposes.
              </p>

              <hr className="my-6" />

              {/* ----------------- SECTION 5 ----------------- */}
              <h2>5. CONTENT</h2>
              <h3>A. Responsibility for Your Content.</h3>
              <p>
                You alone are responsible for Your Content, and once posted to Tasty Plates, it cannot always be withdrawn. You assume all risks associated with Your Content, including anyone’s reliance on its quality, accuracy, or reliability, and any risks associated with personal information you disclose. You represent that you own or have the necessary permissions to use and authorize the use of Your Content as described herein. You may not imply that Your Content is in any way sponsored or endorsed by Tasty Plates.You may expose yourself to liability if, for example, Your Content contains material that is false, intentionally misleading, or defamatory; violates any third-party right, including any copyright, trademark, service mark, patent, trade secret, moral right, privacy right, right of publicity, or any other intellectual property or proprietary right; contains material that is unlawful, including illegal hate speech or pornography; exploits or otherwise harms minors; violates or advocates the violation of any law or regulation; or violates these Terms.
              </p>

              <h3>B. Our Right to Use Your Content.</h3>
              <p>
                We may use Your Content in a number of different ways, including by publicly displaying it, reformatting it, incorporating it into advertisements and other works, creating derivative works from it, promoting it, distributing it, and allowing others to do the same in connection with their own websites and media platforms (“<b>Other Media</b>”). As such, you hereby irrevocably grant us world-wide, perpetual, non-exclusive, royalty-free, assignable, sublicensable, transferable rights to use Your Content for any purpose. Please note that you also irrevocably grant the users of the Service and any Other Media the right to access Your Content in connection with their use of the Service and any Other Media. Finally, you irrevocably waive, and cause to be waived, against Tasty Plates and its users any claims and assertions of moral rights or attribution with respect to Your Content. By “<b>use</b>” we mean use, copy, publicly perform and display, reproduce, distribute, modify, translate, remove, analyze, commercialize, and prepare derivative works of Your Content.
              </p>

              <h3>C. Ownership.</h3>
              <p>
                As between you and Tasty Plates, you own Your Content. We own the Tasty Plates Content, including but not limited to visual interfaces, interactive features, graphics, design, compilation (including, but not limited to, our selection, coordination, aggregation, and arrangement of User Content and other Service Content), computer code, products, software, aggregate star ratings, and all other elements and components of the Service excluding Your Content, User Content and Third Party Content. We also own the copyrights, trademarks, service marks, trade names, trade secrets, and other intellectual and proprietary rights throughout the world associated with the Tasty Plates Content and the Service, which are protected by copyright, trade dress, patent, trademark, and trade secret laws and all other applicable intellectual and proprietary rights and laws. As such, you may not sell, license, copy, publish, modify, reproduce, distribute, create derivative works or adaptations of, publicly display or in any way use or exploit any of the Tasty Plates Content in whole or in part except as expressly authorized by us. Except as expressly and unambiguously provided herein, we do not grant you any express or implied rights, and all rights in and to the Service and the Tasty Plates Content are retained by us.
              </p>

              <h3>D. Advertising.</h3>
              <p>
                Tasty Plates and its licensees may publicly display advertisements, paid content, and other information nearby or in association with Your Content. You are not entitled to any compensation for such advertisements. The manner, mode and extent of such advertising are subject to change without specific notice to you.
              </p>

              <h3>E. Other.</h3>
              <p>
                User Content (including any that may have been created by users employed or contracted by Tasty Plates) does not necessarily reflect the opinion of Tasty Plates. Except as required by law, we have no obligation to retain or provide you with copies of Your Content, and we do not guarantee any confidentiality with respect to Your Content. Except in accordance with Tasty Plates’s Verified License program, Tasty Plates does not attempt to verify any licenses a local business or its representatives may have, and consumers should inquire about any such licenses with the business directly. Businesses whose licenses have been verified by Tasty Plates will have a “Verified License” badge displayed on their Tasty Plates business page.
              </p>

              <h3>F. Content Moderation.</h3>
              <p>
                Except as required by law, we reserve the right to screen, remove, edit, or reinstate User Content at our sole discretion for any reason or no reason, and without notice to you. For example, we may remove a review if we believe that it violates our Content Guidelines.
              </p>

              <hr className="my-6" />

              {/* ----------------- SECTION 6 ----------------- */}
              <h2>6. REPRESENTATIONS AND WARRANTIES</h2>
              <p>
                We are under no obligation to enforce the Terms on your behalf against another user. While we encourage you to let us know if you believe another user has violated the Terms, we reserve the right to investigate and take appropriate action at our sole discretion.
              </p>
              <h3>A. You represent and warrant that:</h3>
              <p>i. You have read and understood our Content Guidelines;</p>
              <p>ii. You have read and understood our Privacy Policy. If you use the Service outside of the United States of America, you consent to having your personal data transferred to and processed in the United States of America; and</p>

              <h3>B. You also represent and warrant that you will not, and will not assist, encourage, or enable others to use the Service to:</h3>
              <p>i. Violate our Terms, including the Content Guidelines and Terms and Conditions;</p>
              <p>ii. Post any fake or defamatory review, trade reviews with others, or compensate someone or be compensated to post, refrain from posting, or remove a review;</p>
              <p>iii. Violate any third party’s rights, including any breach of confidence, copyright, trademark, patent, trade secret, moral right, privacy right, right of publicity, or any other intellectual property or proprietary right;</p>
              <p>iv. Threaten, stalk, harm, or harass others, or promote bigotry or discrimination;</p>
              <p>v. Promote a business or other commercial venture or event, or otherwise use the Service for commercial purposes, except in connection with a Business Account in accordance with the Business Terms;</p>
              <p>vi. Send bulk emails, surveys, or other mass messaging, whether commercial in nature or not; engage in keyword spamming, or otherwise attempt to manipulate the Service’s search results, review Recommendation Software (as defined in the Business Terms below), or any third party website;</p>
              <p>vii. Solicit personal information from minors, or submit or transmit pornography;</p>
              <p>viii. Violate any applicable law;</p>
              <p>ix. Modify, adapt, appropriate, reproduce, distribute, translate, create derivative works or adaptations of, publicly display, sell, trade, or in any way exploit the Service or Service Content (other than Your Content), except as expressly authorized by Tasty Plates;</p>
              <p>x. Use any robot, spider, Service search/retrieval application, or other automated device, process or means to access, retrieve, copy, scrape, or index any portion of the Service or any Service Content, except as expressly permitted by Tasty Plates (for example, as described at www.Tasty Plates.com/robots.txt);</p>
              <p>xi. Reverse engineer any portion of the Service, unless applicable law prohibits this restriction, in which case you agree to provide us with 30 days’ prior written notice;</p>
              <p>xii. Remove or modify any copyright, trademark, or other proprietary rights notice that appears on any portion of the Service or on any materials printed or copied from the Service;</p>
              <p>xiii. Record, process, or mine information about users;</p>
              <p>xiv. Access, retrieve or index any portion of the Service for purposes of constructing or populating a searchable database of business reviews;</p>
              <p>xv. Reformat or frame any portion of the Service;</p>
              <p>xvi. Take any action that imposes, or may impose, in our sole discretion, an unreasonable or disproportionately large load on Tasty Plates’s technology infrastructure or otherwise make excessive traffic demands of the Service;</p>
              <p>xvii. Attempt to gain unauthorized access to the Service, Accounts, computer systems or networks connected to the Service through hacking, password mining or any other means;</p>
              <p>xviii. Use the Service or any Service Content to transmit any computer viruses, worms, defects, Trojan horses, malicious code, spyware, malware or other items of a destructive or harmful nature;</p>
              <p>xix. Use any device, software or routine that interferes with the proper working of the Service, or otherwise attempt to interfere with the proper working of the Service;</p>
              <p>xx. Use the Service to violate the security of any computer network, crack passwords or security encryption codes; disrupt or interfere with the security of, or otherwise cause harm to, the Service or Service Content; or</p>
              <p>xxi. Remove, circumvent, disable, damage or otherwise interfere with any security-related features of the Service, features that prevent or restrict the use or copying of Service Content, or features that enforce limitations on the use of the Service.</p>

              <hr className="my-6" />

              {/* ----------------- SECTION 7 ----------------- */}
              <h2>7. ADDITIONAL POLICIES AND TERMS</h2>
              <h3>A. Copyright and Trademark Disputes.</h3>
              <p>
                You agree to follow our Infringement Policy by notifying us about copyright and trademark disputes concerning User Content. You agree we may forward any notification sent pursuant to our Infringement Policy to the user who submitted the User Content at issue.
              </p>

              <h3>B. Additional Terms.</h3>
              <p>
                Your use of the Service is subject to any and all additional terms, policies, rules, or guidelines that we may post on or link to from the Service (the “Additional Terms”). All such Additional Terms are hereby incorporated by reference into, and made a part of, these Terms. If you have a Business Account, the Business Terms provided below apply to you.
              </p>

              <hr className="my-6" />

              {/* ----------------- SECTION 8 ----------------- */}
              <h2>8. SUGGESTIONS AND IMPROVEMENTS</h2>
              <p>
                By sending us any ideas, suggestions, documents or proposals (“Feedback”), you agree that (i) your Feedback does not contain any third party confidential or proprietary information, (ii) we are under no obligation of confidentiality, express or implied, with respect to the Feedback, (iii) we may have something similar to the Feedback already under consideration or in development, (iv) we have no obligation to review, consider, or implement the Feedback, or to return to you all or part of the Feedback, and (v) you grant us an irrevocable, non-exclusive, royalty-free, perpetual, worldwide, assignable, sublicensable, transferable license to use, modify, prepare derivative works of, publish, distribute and sublicense the Feedback, and you irrevocably waive, and cause to be waived, against Tasty Plates and its users any claims and assertions of any moral rights contained in such Feedback.
              </p>

              <hr className="my-6" />

              {/* ----------------- SECTION 9 ----------------- */}
              <h2>9. THIRD PARTY CONTENT AND SERVICES</h2>
              <h3>A. The Service may host Third Party Content, or include links to other websites or applications (each, a “Third Party Service”).</h3>
              <p>
                We do not control or endorse any Third Party Content or Third Party Service. You agree that we are not responsible for the availability, accuracy, or content of any such Third Party Content or Third Party Service. Your use of and reliance on any Third Party Content or Third Party Service is at your own risk.
              </p>
              <p>
                Some of the services made available through the Service and Third Party Services may be subject to additional third party terms of service, privacy policies, licensing terms and disclosures, and other terms, conditions, and policies, including without limitation the ones posted <a href="#">here</a>. It is your responsibility to familiarize yourself with any such applicable third party terms.
              </p>

              <hr className="my-6" />

              {/* ----------------- SECTION 10 ----------------- */}
              <h2>10. INDEMNITY</h2>
              <p>
                You agree to indemnify, defend, and hold harmless Tasty Plates, its parents, subsidiaries, affiliates, any related companies, suppliers, licensors and partners, and the officers, directors, employees, agents, contractors and representatives of each of them (collectively, the “Tasty Plates Entities”) from and against any and all third party claims, actions, demands, losses, damages, costs, liabilities and expenses (including but not limited to attorneys’ fees and court costs) arising out of or relating to: (i) your access to or use of the Service, including Your Content, (ii) your violation of the Terms, (iii) your breach of your representations and warranties provided under these Terms, (iv) any products or services purchased or obtained by you in connection with the Service, (v) your products or services, or the marketing or provision thereof to end users, or (vi) the infringement by you, or any third party using your Account, of any intellectual property or other right of any person or entity. Tasty Plates reserves the right, at your expense, to assume the exclusive defense and control of any matter for which you are required to indemnify us and you agree to cooperate with our defense of these claims. You agree not to settle any such matter without the prior written consent of Tasty Plates. Tasty Plates will use reasonable efforts to notify you of any such claim, action or proceeding upon becoming aware of it.
              </p>

              <hr className="my-6" />

              {/* ----------------- SECTION 11 ----------------- */}
              <h2>11. DISCLAIMERS AND LIMITATIONS OF LIABILITY</h2>
              <p>
                PLEASE READ THIS SECTION CAREFULLY SINCE IT LIMITS THE LIABILITY OF THE Tasty Plates ENTITIES TO YOU. EACH OF THE SUBSECTIONS BELOW ONLY APPLIES UP TO THE MAXIMUM EXTENT PERMITTED UNDER APPLICABLE LAW. NOTHING HEREIN IS INTENDED TO LIMIT ANY RIGHTS YOU MAY HAVE WHICH MAY NOT BE LAWFULLY LIMITED. BY ACCESSING OR USING THE SERVICE, YOU REPRESENT THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO THESE TERMS, INCLUDING THIS SECTION. YOU ARE GIVING UP SUBSTANTIAL LEGAL RIGHTS BY AGREEING TO THESE TERMS.
              </p>
              <h3>A.</h3>
              <p>
                THE SERVICE AND SERVICE CONTENT ARE MADE AVAILABLE TO YOU ON AN “AS IS”, “WITH ALL FAULTS” AND “AS AVAILABLE” BASIS, WITH THE EXPRESS UNDERSTANDING THAT THE Tasty Plates ENTITIES MAY NOT MONITOR, CONTROL, OR VET USER CONTENT OR THIRD PARTY CONTENT. AS SUCH, YOUR USE OF THE SERVICE IS AT YOUR OWN DISCRETION AND RISK. THE Tasty Plates ENTITIES MAKE NO CLAIMS OR PROMISES ABOUT THE QUALITY, COMPLETENESS, ACCURACY, OR RELIABILITY OF THE SERVICE, ITS SAFETY OR SECURITY, INCLUDING WITHOUT LIMITATION THE SECURITY OF YOUR DATA, OR THE SERVICE CONTENT. ACCORDINGLY, THE Tasty Plates ENTITIES ARE NOT LIABLE TO YOU FOR ANY PERSONAL INJURY, LOSS OR DAMAGE THAT MIGHT ARISE, FOR EXAMPLE, FROM THE SERVICE’S INOPERABILITY, DEPLETION OF BATTERY POWER OR OTHER IMPAIRMENT OF DEVICES USED TO ACCESS THE SERVICE, SERVICE UNAVAILABILITY, SECURITY VULNERABILITIES OR FROM YOUR RELIANCE ON THE QUALITY, ACCURACY, OR RELIABILITY OF THE BUSINESS LISTINGS, RATINGS, REVIEWS (INCLUDING THEIR CONTENT OR OMISSION OF CONTENT, ORDER, AND DISPLAY), METRICS OR OTHER CONTENT FOUND ON, USED ON, OR MADE AVAILABLE THROUGH THE SERVICE.
              </p>

              <h3>B.</h3>
              <p>
                THE Tasty Plates ENTITIES MAKE NO CLAIMS OR PROMISES WITH RESPECT TO ANY THIRD PARTY, SUCH AS THE BUSINESSES OR ADVERTISERS LISTED ON THE SERVICE OR THAT OFFER GOODS OR SERVICES THROUGH THE SERVICE, OR THE SERVICE’S USERS. ACCORDINGLY, THE Tasty Plates ENTITIES ARE NOT LIABLE TO YOU FOR ANY PERSONAL INJURY, LOSS OR DAMAGE THAT MIGHT ARISE FROM ANY SUCH THIRD PARTY’S ACTIONS OR OMISSIONS, INCLUDING, FOR EXAMPLE, IF ANOTHER USER OR BUSINESS MISUSES YOUR CONTENT, IDENTITY OR PERSONAL INFORMATION, OR IF YOU HAVE A NEGATIVE EXPERIENCE WITH ONE OF THE BUSINESSES OR ADVERTISERS LISTED OR FEATURED ON THE SERVICE. YOUR PURCHASE AND USE OF PRODUCTS OR SERVICES OFFERED BY THIRD PARTIES THROUGH THE SERVICE IS AT YOUR OWN DISCRETION AND RISK.
              </p>

              <h3>C.</h3>
              <p>
                YOUR SOLE AND EXCLUSIVE RIGHT AND REMEDY IN CASE OF DISSATISFACTION WITH THE SERVICE, RELATED SERVICES, OR ANY OTHER GRIEVANCE SHALL BE YOUR TERMINATION AND DISCONTINUATION OF ACCESS TO, OR USE OF THE SERVICE.
              </p>

              <h3>D.</h3>
              <p>
                THE Tasty Plates ENTITIES’ MAXIMUM AGGREGATE LIABILITY TO YOU FOR LOSSES OR DAMAGES THAT YOU SUFFER IN CONNECTION WITH THE SERVICE OR THESE TERMS IS LIMITED TO THE GREATER OF (i) THE AMOUNT PAID, IF ANY, BY YOU TO THE Tasty Plates ENTITIES IN CONNECTION WITH THE SERVICE IN THE 12 MONTHS PRIOR TO THE ACTION GIVING RISE TO LIABILITY, OR (ii) $100.
              </p>

              <h3>E.</h3>
              <p>
                THE Tasty Plates ENTITIES’ LIABILITY SHALL BE LIMITED TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE Tasty Plates ENTITIES WILL NOT BE LIABLE FOR ANY (i) INDIRECT, SPECIAL, INCIDENTAL, PUNITIVE, EXEMPLARY, RELIANCE, OR CONSEQUENTIAL DAMAGES, (ii) LOSS OF PROFITS OR REVENUE, (iii) BUSINESS INTERRUPTION, (iv) REPUTATIONAL HARM, (v) LOSS OF INFORMATION OR DATA; OR (vi) LIABILITY WITH RESPECT TO A CONSUMER ALERT POSTED ON ANY Tasty Plates BUSINESS PAGES FOR YOUR BUSINESS. THE WAIVERS AND LIMITATIONS SPECIFIED IN THIS SECTION 12 WILL SURVIVE AND APPLY REGARDLESS OF THE FORM OF ACTION, WHETHER IN CONTRACT, TORT (INCLUDING NEGLIGENCE), STRICT LIABILITY OR OTHERWISE.
              </p>

              <hr className="my-6" />

              {/* ----------------- SECTION 12 ----------------- */}
              <h2>12. TERMINATION</h2>
              <h3>A.</h3>
              <p>
                You may terminate the Terms at any time by closing your Account, discontinuing any access to or use of the Service, and providing Tasty Plates with a notice of termination.
              </p>
              <h3>B.</h3>
              <p>
                We may close your Account, suspend your ability to use certain portions of the Service, terminate any license or permission granted to you hereunder, and/or ban you altogether from the Service for any or no reason, and without notice or liability of any kind. Any such action could prevent you from accessing your Account, the Service, Your Content, Service Content, or any other related information.
              </p>
              <h3>C.</h3>
              <p>
                In the event of any termination of these Terms, whether by you or us, the Terms of Service will continue in full force and effect.
              </p>

              <hr className="my-6" />

              {/* ----------------- SECTION 13 ----------------- */}
              <h2>13. GENERAL TERMS</h2>
              <h3>A.</h3>
              <p>
                We reserve the right to modify, update, or discontinue the Service at our sole discretion, at any time, for any or no reason, and without notice or liability.
              </p>
              <h3>B.</h3>
              <p>
                Except as otherwise stated in Section 10 above, nothing herein is intended, nor will be deemed, to confer rights or remedies upon any third party.
              </p>
              <h3>C.</h3>
              <p>
                The Terms contain the entire agreement between you and us regarding the use of the Service, and supersede any prior agreement between you and us on such subject matter. The parties acknowledge that no reliance is placed on any representation made but not expressly contained in these Terms.
              </p>
              <h3>D.</h3>
              <p>
                Any failure on Tasty Plates’s part to exercise or enforce any right or provision of the Terms does not constitute a waiver of such right or provision. The failure of either party to exercise in any respect any right provided for herein shall not be deemed a waiver of any further rights hereunder. The Terms may not be waived, except pursuant to a writing executed by Tasty Plates.
              </p>
              <h3>E.</h3>
              <p>
                If any provision of the Terms is found to be unenforceable or invalid by an arbitrator or court of competent jurisdiction, then only that provision shall be modified to reflect the parties’ intention or eliminated to the minimum extent necessary so that the Terms shall otherwise remain in full force and effect and enforceable.
              </p>
              <h3>F.</h3>
              <p>
                The Terms, and any rights or obligations hereunder, are not assignable, transferable or sublicensable by you except with Tasty Plates’s prior written consent, but may be assigned or transferred by us without restriction. Any attempted assignment by you shall violate these Terms and be void.
              </p>
              <h3>G.</h3>
              <p>
                You agree that no joint venture, partnership, employment, agency, special or fiduciary relationship exists between you and Tasty Plates as a result of these Terms or your use of the Service.
              </p>
              <h3>H.</h3>
              <p>
                The section titles in the Terms are for convenience only and have no legal or contractual effect.
              </p>
            </section>
          </div>
        </div>

        <Footer />
      </main>
    </>
  );
}
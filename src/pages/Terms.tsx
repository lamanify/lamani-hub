import PublicTopBar from "@/components/PublicTopBar";
import PublicFooter from "@/components/PublicFooter";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <PublicTopBar />
      
      <main className="py-20 sm:py-24">
        <div className="container mx-auto px-6 max-w-[800px]">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-black">
              Terms of <span className="text-primary">Service</span>
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              <strong>Effective Date:</strong> October 10, 2025
            </p>
          </div>

          {/* ToS Content */}
          <div className="space-y-8">
            <p className="leading-relaxed text-gray-700">
              These Terms of Service ("Terms") constitute a legally binding agreement between Lamanify Sdn Bhd (Company Registration No: 202501003839 (1605252-U)), operating the LamaniHub platform ("LamaniHub," "we," "us," or "our"), a company based in Malaysia, and you, the customer or the entity you represent ("Customer," "you," or "your"). These Terms govern your access to and use of the LamaniHub CRM software and related services (collectively, the "Service" or "Platform").
            </p>
            <p className="leading-relaxed text-gray-700">
              <strong>BY CLICKING "I AGREE" OR BY ACCESSING OR USING THE SERVICE, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS. IF YOU DO NOT AGREE TO THESE TERMS, YOU MAY NOT ACCESS OR USE THE SERVICE.</strong>
            </p>

            <section>
              <h2 className="text-2xl font-medium text-black mt-8 pb-2 border-b border-[#ececec]">
                1. Definitions
              </h2>
              <ul className="mt-4 space-y-2 text-gray-700 pl-2">
                <li><strong>Authorized User:</strong> Any individual who is an employee, agent, or contractor of the Customer and who has been authorized by the Customer to use the Service in accordance with these Terms.</li>
                <li><strong>Customer Data:</strong> All electronic data, text, messages, or other materials submitted to the Service by the Customer or its Authorized Users in connection with the Customer's use of the Service.</li>
                <li><strong>Documentation:</strong> Any online or printed documentation, specifications, or user manuals provided by LamaniHub relating to the use of the Service.</li>
                <li><strong>Intellectual Property Rights (IPR):</strong> All intellectual property and proprietary rights, including copyrights, patents, trademarks, and trade secrets, wherever in the world enforceable.</li>
                <li><strong>Service:</strong> The LamaniHub CRM Software as a Service platform, including any updates, modifications, and enhancements thereto, accessed via the internet.</li>
                <li><strong>Subscription Term:</strong> The initial period for which the Customer agrees to subscribe to the Service, as specified in the Order Form, and any subsequent renewal periods.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-black mt-8 pb-2 border-b border-[#ececec]">
                2. License Grant and Use of Service
              </h2>
              <h3 className="text-lg font-medium text-black mt-6">2.1 License Grant</h3>
              <p className="mt-2 leading-relaxed text-gray-700">
                Subject to the terms and conditions of this Agreement and your payment of the applicable fees, LamaniHub grants you a limited, non-exclusive, non-transferable, non-sublicensable right to access and use the Service during the Subscription Term, solely for your internal business operations by your Authorized Users.
              </p>
              <h3 className="text-lg font-medium text-black mt-6">2.2 Authorized Users</h3>
              <p className="mt-2 leading-relaxed text-gray-700">
                The Customer shall ensure that all Authorized Users comply with these Terms. The Customer is responsible for all actions and omissions of its Authorized Users. Access credentials (e.g., usernames and passwords) may not be shared or transferred between individuals.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-black mt-8 pb-2 border-b border-[#ececec]">
                3. Subscription, Fees, and Payment
              </h2>
              <h3 className="text-lg font-medium text-black mt-6">3.1 Fees and Payment</h3>
              <p className="mt-2 leading-relaxed text-gray-700">
                The Customer agrees to pay the subscription fees and any other charges applicable to your selected plan, as set forth in the Order Form or the current pricing schedule published on the LamaniHub website. Fees are billed in advance for the Subscription Term (e.g., monthly or annually) and are non-refundable.
              </p>
              <h3 className="text-lg font-medium text-black mt-6">3.2 Taxes</h3>
              <p className="mt-2 leading-relaxed text-gray-700">
                All fees are exclusive of any taxes, duties, and levies, including but not limited to Sales and Service Tax (SST) in Malaysia, which shall be added to the invoice where applicable. The Customer shall be responsible for payment of all such taxes.
              </p>
              <h3 className="text-lg font-medium text-black mt-6">3.3 Auto-Renewal</h3>
              <p className="mt-2 leading-relaxed text-gray-700">
                Unless otherwise specified in your Order Form, your subscription will automatically renew for a renewal period equal to the immediately preceding Subscription Term, unless either party gives the other written notice (email sufficient) of non-renewal at least thirty (30) days before the end of the current term.
              </p>
              <h3 className="text-lg font-medium text-black mt-6">3.4 Late Payments</h3>
              <p className="mt-2 leading-relaxed text-gray-700">
                If any amount due is not paid by the due date, LamaniHub may, without limiting our other rights and remedies, suspend your access to the Service until such amounts are paid in full. Late payments may be subject to interest at a rate of 1.5% per month, or the maximum rate permitted by Malaysian law, whichever is lower.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-black mt-8 pb-2 border-b border-[#ececec]">
                4. Customer Data Ownership and Use
              </h2>
              <h3 className="text-lg font-medium text-black mt-6">4.1 Ownership of Customer Data</h3>
              <p className="mt-2 leading-relaxed text-gray-700">
                The Customer retains all right, title, and interest in and to the Customer Data. LamaniHub receives only the right to process Customer Data solely as necessary to provide the Service to you and as permitted by the Privacy Policy.
              </p>
              <h3 className="text-lg font-medium text-black mt-6">4.2 Data Responsibility</h3>
              <p className="mt-2 leading-relaxed text-gray-700">
                The Customer is solely responsible for the accuracy, quality, integrity, legality, reliability, and Intellectual Property Rights of all Customer Data. The Customer must comply with all applicable laws, including the Personal Data Protection Act 2010 (PDPA) of Malaysia, when collecting, using, and transferring Customer Data within the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-black mt-8 pb-2 border-b border-[#ececec]">
                5. Customer Obligations and Acceptable Use
              </h2>
              <p className="mt-4 leading-relaxed text-gray-700">
                The Customer shall not, and shall ensure that its Authorized Users do not:
              </p>
              <ul className="mt-4 space-y-2 text-gray-700 pl-2">
                <li>Use the Service for any unlawful purpose or in violation of any applicable Malaysian or international laws, including the PDPA 2010.</li>
                <li>Transmit or store infringing, obscene, libelous, or otherwise unlawful or tortious material, or material harmful to children.</li>
                <li>Transmit or store material containing viruses, malware, or other harmful computer code, files, scripts, agents, or programs.</li>
                <li>Interfere with or disrupt the integrity or performance of the Service or third-party data contained therein.</li>
                <li>Attempt to gain unauthorized access to the Service or its related systems or networks.</li>
                <li>Reverse engineer, decompile, disassemble, or otherwise attempt to derive the source code of the Service.</li>
                <li>Use the Service to build a competitive product or service.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-black mt-8 pb-2 border-b border-[#ececec]">
                6. Intellectual Property Rights
              </h2>
              <h3 className="text-lg font-medium text-black mt-6">6.1 LamaniHub IPR</h3>
              <p className="mt-2 leading-relaxed text-gray-700">
                The Service, the Software, the Documentation, and all related Intellectual Property Rights are the sole and exclusive property of LamaniHub. These Terms grant you only a limited right to use the Service, and do not convey any rights of ownership in or related to the Service or LamaniHub's Intellectual Property Rights.
              </p>
              <h3 className="text-lg font-medium text-black mt-6">6.2 Feedback</h3>
              <p className="mt-2 leading-relaxed text-gray-700">
                If you provide LamaniHub with any feedback, suggestions, or comments regarding the Service, you grant LamaniHub a perpetual, irrevocable, worldwide, royalty-free license to use and exploit such feedback for any purpose.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-black mt-8 pb-2 border-b border-[#ececec]">
                7. Warranties and Disclaimers
              </h2>
              <h3 className="text-lg font-medium text-black mt-6">7.1 Limited Warranty</h3>
              <p className="mt-2 leading-relaxed text-gray-700">
                LamaniHub warrants that, during the Subscription Term, the Service will perform substantially in accordance with the Documentation.
              </p>
              <h3 className="text-lg font-medium text-black mt-6">7.2 Disclaimer</h3>
              <p className="mt-2 leading-relaxed text-gray-700">
                EXCEPT FOR THE LIMITED WARRANTY IN SECTION 7.1, LAMANIHUB MAKES NO WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, STATUTORY OR OTHERWISE, AND SPECIFICALLY DISCLAIMS ALL IMPLIED WARRANTIES, INCLUDING ANY WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT, TO THE MAXIMUM EXTENT PERMITTED BY MALAYSIAN LAW. THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE." LAMANIHUB DOES NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF HARMFUL COMPONENTS.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-black mt-8 pb-2 border-b border-[#ececec]">
                8. Limitation of Liability
              </h2>
              <p className="mt-4 leading-relaxed text-gray-700">
                TO THE MAXIMUM EXTENT PERMITTED BY THE LAWS OF MALAYSIA, IN NO EVENT SHALL LAMANIHUB BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, PUNITIVE, OR EXEMPLARY DAMAGES (INCLUDING, WITHOUT LIMITATION, DAMAGES FOR LOSS OF PROFITS, LOSS OF DATA, OR LOSS OF BUSINESS), ARISING OUT OF OR IN CONNECTION WITH THESE TERMS OR THE USE OR INABILITY TO USE THE SERVICE.
              </p>
              <p className="mt-4 leading-relaxed text-gray-700">
                LAMANIHUB'S TOTAL CUMULATIVE LIABILITY, ARISING OUT OF OR RELATING TO THESE TERMS, WHETHER IN CONTRACT, TORT, OR OTHERWISE, SHALL NOT EXCEED THE TOTAL FEES PAID BY THE CUSTOMER TO LAMANIHUB FOR THE USE OF THE SERVICE DURING THE TWELVE (12) MONTHS IMMEDIATELY PRECEDING THE EVENT GIVING RISE TO THE CLAIM.
              </p>
              <p className="mt-4 leading-relaxed text-gray-700">
                The limitations of liability in this Section shall not apply to damages arising from: (a) death or personal injury caused by LamaniHub's negligence; (b) fraud or fraudulent misrepresentation; or (c) liability which cannot be lawfully excluded or limited under the Contracts Act 1950 of Malaysia.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-black mt-8 pb-2 border-b border-[#ececec]">
                9. Term and Termination
              </h2>
              <h3 className="text-lg font-medium text-black mt-6">9.1 Term</h3>
              <p className="mt-2 leading-relaxed text-gray-700">
                These Terms commence on the Effective Date and remain in effect until the expiration or termination of your Subscription Term.
              </p>
              <h3 className="text-lg font-medium text-black mt-6">9.2 Termination for Cause</h3>
              <p className="mt-2 leading-relaxed text-gray-700">
                Either party may terminate these Terms and any Subscription Term immediately upon written notice if the other party materially breaches any term of this Agreement and fails to cure such breach within thirty (30) days after receipt of written notice thereof. LamaniHub may also terminate immediately if the Customer fails to pay any amounts due within fifteen (15) days after written notice.
              </p>
              <h3 className="text-lg font-medium text-black mt-6">9.3 Effect of Termination</h3>
              <p className="mt-2 leading-relaxed text-gray-700">
                Upon any termination or expiration of these Terms:
              </p>
              <ul className="mt-4 space-y-2 text-gray-700 pl-2">
                <li>Your right to access and use the Service shall immediately cease.</li>
                <li>The Customer shall immediately pay all unpaid fees accrued up to the date of termination.</li>
                <li>LamaniHub will provide the Customer with access to the Customer Data for export for a period of up to thirty (30) days, after which LamaniHub will delete or anonymize the Customer Data in accordance with the Privacy Policy.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-black mt-8 pb-2 border-b border-[#ececec]">
                10. Governing Law and Dispute Resolution
              </h2>
              <h3 className="text-lg font-medium text-black mt-6">10.1 Governing Law</h3>
              <p className="mt-2 leading-relaxed text-gray-700">
                This Agreement shall be governed by and construed in accordance with the laws of Malaysia, without regard to its conflict of law principles. This includes, but is not limited to, the Contracts Act 1950, which governs the enforceability and interpretation of these Terms.
              </p>
              <h3 className="text-lg font-medium text-black mt-6">10.2 Jurisdiction</h3>
              <p className="mt-2 leading-relaxed text-gray-700">
                The parties irrevocably agree that the courts of Kuala Lumpur, Malaysia shall have exclusive jurisdiction to settle any dispute or claim arising out of or in connection with these Terms or its subject matter or formation.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-black mt-8 pb-2 border-b border-[#ececec]">
                11. General Provisions
              </h2>
              <h3 className="text-lg font-medium text-black mt-6">11.1 Parent Company Identification</h3>
              <p className="mt-2 leading-relaxed text-gray-700">
                LamaniHub is a platform operated by Lamanify Sdn Bhd (Company Registration No: 202501003839 (1605252-U)), and any references to "LamaniHub," "we," "us," or "our" in this Agreement shall be understood to refer to Lamanify Sdn Bhd.
              </p>
              <h3 className="text-lg font-medium text-black mt-6">11.2 Force Majeure</h3>
              <p className="mt-2 leading-relaxed text-gray-700">
                Neither party shall be liable for any failure or delay in performance under this Agreement due to causes beyond its reasonable control, including, but not limited to, acts of God, war, terrorism, civil disturbances, epidemics, governmental restrictions, or natural disasters.
              </p>
              <h3 className="text-lg font-medium text-black mt-6">11.3 Entire Agreement</h3>
              <p className="mt-2 leading-relaxed text-gray-700">
                These Terms, together with any applicable Order Forms and the Privacy Policy, constitute the entire agreement between the parties concerning your use of the Service and supersedes all prior agreements, proposals, or representations, whether written or oral.
              </p>
              <h3 className="text-lg font-medium text-black mt-6">11.4 Notices</h3>
              <p className="mt-2 leading-relaxed text-gray-700">
                All legal notices under this Agreement shall be sent to the following addresses:
              </p>
              <p className="mt-4 leading-relaxed text-gray-700">
                <strong>If to LamaniHub / Lamanify Sdn Bhd:</strong><br />
                Level 23-1, Premier Suite, One Mont Kiara, No, 1 Jalan Kiara, Mont Kiara, 50480 Kuala Lumpur.<br />
                Email: <a href="mailto:support@lamanihub.com" className="text-primary underline">support@lamanihub.com</a>
              </p>
              <p className="mt-4 leading-relaxed text-gray-700">
                <strong>If to Customer:</strong><br />
                To the address or email address provided during account registration.
              </p>
            </section>
          </div>
        </div>
      </main>
      
      <PublicFooter />
    </div>
  );
}

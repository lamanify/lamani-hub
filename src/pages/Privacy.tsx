import PublicTopBar from "@/components/PublicTopBar";
import PublicFooter from "@/components/PublicFooter";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <PublicTopBar />
      
      <main className="py-20 sm:py-24">
        <div className="container mx-auto px-6 max-w-[800px]">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-black">
              Privacy <span className="text-primary">Policy</span>
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              <strong>Effective Date:</strong> October 10, 2025
            </p>
          </div>

          {/* Policy Content */}
          <div className="space-y-8">
            <p className="leading-relaxed text-gray-700">
              LamaniHub, a CRM SaaS company based in Malaysia ("LamaniHub," "we," "us," or "our"), is committed to protecting the privacy of your data. This Privacy Policy describes how we collect, use, process, and disclose your information, including Personal Data, in connection with your access to and use of our CRM services and website.
            </p>

            <section>
              <h2 className="text-2xl font-medium text-black mt-8 pb-2 border-b border-[#ececec]">
                1. Contact Details
              </h2>
              <p className="mt-4 leading-relaxed text-gray-700">
                If you have questions or concerns about this Privacy Policy or our data practices, please contact us using the details below:
              </p>
              <ul className="mt-4 space-y-2 text-gray-700 pl-2">
                <li><strong>Data Protection Officer (DPO)</strong></li>
                <li><strong>Email:</strong> <a href="mailto:support@lamanihub.com" className="text-primary underline">support@lamanihub.com</a></li>
                <li><strong>Phone:</strong> <a href="tel:+601156706510" className="text-primary underline">+6011-5670 6510</a></li>
                <li><strong>Address:</strong> Level 23-1, Premier Suite, One Mont Kiara, No, 1 Jalan Kiara, Mont Kiara, 50480 Kuala Lumpur, Malaysia</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-black mt-8 pb-2 border-b border-[#ececec]">
                2. Our Role: Data Controller vs. Data Processor
              </h2>
              <p className="mt-4 leading-relaxed text-gray-700">
                For the purpose of providing our SaaS CRM solution, it is important to distinguish between two roles:
              </p>
              <h3 className="text-lg font-medium text-black mt-6">
                A. Data Controller (LamaniHub controls the purpose of the data):
              </h3>
              <p className="mt-2 leading-relaxed text-gray-700">
                We act as the Data Controller when we collect and process Personal Data directly from our users (e.g., you, the subscriber, or your employees) to manage your LamaniHub account, billing, service communication, and website usage.
              </p>
              <h3 className="text-lg font-medium text-black mt-6">
                B. Data Processor (LamaniHub processes data on your behalf):
              </h3>
              <p className="mt-2 leading-relaxed text-gray-700">
                We act as the Data Processor when we handle the data that you, as our customer, upload or input into the LamaniHub CRM (e.g., your customers' names, contact details, sales history, etc.). In this scenario, you (our customer) are the Data Controller, and you retain all responsibility for complying with relevant data protection laws concerning that Customer Data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-black mt-8 pb-2 border-b border-[#ececec]">
                3. Information We Collect
              </h2>
              <h3 className="text-lg font-medium text-black mt-6">
                A. Data Collected About Our Users (When LamaniHub is the Data Controller)
              </h3>
              <p className="mt-2 leading-relaxed text-gray-700">
                We collect the following types of information directly from you when you sign up for or use our Service:
              </p>
              <ul className="mt-4 space-y-2 text-gray-700 pl-2">
                <li><strong>Account Information:</strong> Name, email address, company name, job title, phone number, and password (hashed).</li>
                <li><strong>Billing and Payment Data:</strong> Billing address and payment information (processed by a secure third-party payment processor; we do not store full credit card details).</li>
                <li><strong>Usage Data:</strong> Information about how you use the Service, including access dates and times, features used, pages viewed, time spent on pages, and referring URLs.</li>
                <li><strong>Device and Connection Data:</strong> IP address, device type, operating system, browser type, and location data derived from the IP address.</li>
              </ul>
              <h3 className="text-lg font-medium text-black mt-6">
                B. Customer Data (When LamaniHub is the Data Processor)
              </h3>
              <p className="mt-2 leading-relaxed text-gray-700">
                This refers to any data that you upload, input, or create within your LamaniHub CRM instance, which pertains to your own customers, leads, or contacts.
              </p>
              <ul className="mt-4 space-y-2 text-gray-700 pl-2">
                <li><strong>Customer Contact Information:</strong> Names, emails, phone numbers, addresses, and organizational details of your clients.</li>
                <li><strong>Sales and Business Data:</strong> Sales pipeline information, deal value, interaction history, support tickets, and other business records specific to your operations.</li>
              </ul>
              <p className="mt-4 leading-relaxed text-gray-700">
                We only process this Customer Data according to your instructions and the terms of our agreement with you.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-black mt-8 pb-2 border-b border-[#ececec]">
                4. How We Use the Information (LamaniHub as Controller)
              </h2>
              <p className="mt-4 leading-relaxed text-gray-700">
                We use the Personal Data we collect about our users for the following purposes:
              </p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full border-collapse border border-[#ececec]">
                  <thead>
                    <tr className="bg-[hsl(220,20%,97%)]">
                      <th className="px-4 py-3 text-left font-medium text-black border-b border-[#ececec]">Purpose</th>
                      <th className="px-4 py-3 text-left font-medium text-black border-b border-[#ececec]">Legal Basis (General Principles)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-4 py-3 text-gray-700 border-b border-[#ececec]">Provide and Maintain the Service</td>
                      <td className="px-4 py-3 text-gray-700 border-b border-[#ececec]">Necessary for the performance of the contract.</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-gray-700 border-b border-[#ececec]">Process Transactions</td>
                      <td className="px-4 py-3 text-gray-700 border-b border-[#ececec]">Necessary for the performance of the contract and legal obligations.</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-gray-700 border-b border-[#ececec]">Service Improvement and Development</td>
                      <td className="px-4 py-3 text-gray-700 border-b border-[#ececec]">Our legitimate interest in improving the Service's performance, usability, and features.</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-gray-700 border-b border-[#ececec]">Communication</td>
                      <td className="px-4 py-3 text-gray-700 border-b border-[#ececec]">To send account updates, service alerts, technical notices, and security messages.</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-gray-700 border-b border-[#ececec]">Marketing and Promotions</td>
                      <td className="px-4 py-3 text-gray-700 border-b border-[#ececec]">Based on your consent (where required by law) or our legitimate interest in informing you about related services.</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-gray-700 border-b border-[#ececec]">Security and Compliance</td>
                      <td className="px-4 py-3 text-gray-700 border-b border-[#ececec]">Necessary for compliance with legal obligations and our legitimate interest in protecting the Service.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-black mt-8 pb-2 border-b border-[#ececec]">
                5. Sharing and Disclosure of Information
              </h2>
              <p className="mt-4 leading-relaxed text-gray-700">
                We may share or disclose your Personal Data in the following limited circumstances:
              </p>
              <ul className="mt-4 space-y-2 text-gray-700 pl-2">
                <li><strong>Third-Party Vendors:</strong> We use third-party service providers (e.g., hosting, data storage, payment processing, analytics) to perform services on our behalf. These parties are contractually obligated to process data only on our instruction and to maintain adequate security measures.</li>
                <li><strong>Legal Requirements:</strong> If required by law, court order, or governmental authority (including in compliance with Malaysian laws like the Personal Data Protection Act 2010), we may disclose your Personal Data.</li>
                <li><strong>Business Transfers:</strong> In connection with any merger, sale of company assets, financing, or acquisition of all or a portion of our business.</li>
                <li><strong>With Your Consent:</strong> We may share Personal Data with third parties when we have your explicit consent to do so.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-black mt-8 pb-2 border-b border-[#ececec]">
                6. Data Security and International Transfer
              </h2>
              <ul className="mt-4 space-y-2 text-gray-700 pl-2">
                <li><strong>Security:</strong> We implement appropriate technical and organizational security measures, including encryption, access controls, and regular security audits, designed to protect the integrity and security of the information we process.</li>
                <li><strong>International Data Transfer:</strong> As a cloud-based service, your data may be transferred to, and stored at, a destination outside of Malaysia. By using the Service, you consent to your data being transferred to other jurisdictions that may not have the same data protection laws as Malaysia. We ensure that any such transfer complies with Malaysian law and that appropriate safeguards are in place.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-black mt-8 pb-2 border-b border-[#ececec]">
                7. Data Retention
              </h2>
              <p className="mt-4 leading-relaxed text-gray-700">
                We will retain your Personal Data only for as long as necessary to provide you with the Service and for legitimate and essential business purposes, such as maintaining the performance of the Service, complying with legal obligations, and resolving disputes.
              </p>
              <p className="mt-4 leading-relaxed text-gray-700">
                Upon termination of your account, we will delete or anonymize your Personal Data and Customer Data in accordance with our retention policy, unless legally required to retain it for a longer period.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-black mt-8 pb-2 border-b border-[#ececec]">
                8. Your Data Protection Rights
              </h2>
              <p className="mt-4 leading-relaxed text-gray-700">
                Depending on your location and the legal framework, you may have the following rights regarding the Personal Data we hold about you (where LamaniHub is the Data Controller):
              </p>
              <ul className="mt-4 space-y-2 text-gray-700 pl-2">
                <li><strong>Right to Access:</strong> The right to request copies of your Personal Data.</li>
                <li><strong>Right to Correction (Rectification):</strong> The right to request that we correct any information you believe is inaccurate or incomplete.</li>
                <li><strong>Right to Erasure (Deletion):</strong> The right to request that we delete your Personal Data, under certain conditions.</li>
                <li><strong>Right to Restrict Processing:</strong> The right to request that we restrict the processing of your Personal Data, under certain conditions.</li>
                <li><strong>Right to Object to Processing:</strong> The right to object to our processing of your Personal Data, under certain conditions, particularly direct marketing.</li>
              </ul>
              <p className="mt-4 leading-relaxed text-gray-700">
                To exercise these rights, please contact us at <a href="mailto:support@lamanihub.com" className="text-primary underline">support@lamanihub.com</a>. We will respond to your request within the time frames required by applicable law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-black mt-8 pb-2 border-b border-[#ececec]">
                9. Cookies and Tracking Technologies
              </h2>
              <p className="mt-4 leading-relaxed text-gray-700">
                We use cookies and similar tracking technologies (like web beacons and pixels) to track activity on our Service and hold certain information. Cookies are used to:
              </p>
              <ul className="mt-4 space-y-2 text-gray-700 pl-2">
                <li>Operate and maintain the Service (strictly necessary cookies).</li>
                <li>Analyze usage patterns to improve the Service (analytics cookies).</li>
                <li>Remember your preferences (functionality cookies).</li>
              </ul>
              <p className="mt-4 leading-relaxed text-gray-700">
                You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-black mt-8 pb-2 border-b border-[#ececec]">
                10. Children's Privacy
              </h2>
              <p className="mt-4 leading-relaxed text-gray-700">
                Our Service is not directed to individuals under the age of 18. We do not knowingly collect Personal Data from children. If you become aware that a child has provided us with Personal Data, please contact us, and we will take steps to delete such information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-black mt-8 pb-2 border-b border-[#ececec]">
                11. Changes to This Privacy Policy
              </h2>
              <p className="mt-4 leading-relaxed text-gray-700">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Effective Date" at the top of this policy. We encourage you to review this policy periodically for any changes.
              </p>
            </section>
          </div>
        </div>
      </main>
      
      <PublicFooter />
    </div>
  );
}

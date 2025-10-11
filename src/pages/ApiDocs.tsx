import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Copy, Check } from "lucide-react";
import PublicTopBar from "@/components/PublicTopBar";
import PublicFooter from "@/components/PublicFooter";
import { Button } from "@/components/ui/button";

export default function ApiDocs() {
  const [activeSection, setActiveSection] = useState("introduction");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Handle scroll spy for active section
  useEffect(() => {
    const handleScroll = () => {
      const sections = ["introduction", "authentication", "endpoint", "request-body", "responses"];
      const scrollPosition = window.scrollY + 200;

      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const curlCode = `curl -X POST \\
  'https://gjnnqeqlxxoiajgklevz.supabase.co/functions/v1/lead-intake' \\
  --header 'x-api-key: <YOUR_API_KEY>' \\
  --header 'Content-Type: application/json' \\
  --data-raw '{
    "name": "Jane Smith",
    "email": "jane.smith@example.com",
    "phone": "0123456789",
    "source": "Website Form",
    "consent": true
  }'`;

  const jsCode = `const addLead = async (leadData) => {
  const apiUrl = 'https://gjnnqeqlxxoiajgklevz.supabase.co/functions/v1/lead-intake';
  const apiKey = 'your_api_key';

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify(leadData)
    });

    if (!response.ok) {
      throw new Error('API Error');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to add lead:', error);
  }
};`;

  return (
    <div className="min-h-screen bg-background">
      <PublicTopBar />

      <div className="flex">
        {/* Left Sidebar: Navigation */}
        <aside className="hidden lg:block w-64 bg-secondary border-r border-border fixed top-0 left-0 h-full pt-20 overflow-y-auto">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-foreground">LamaniHub API</h1>
            <p className="text-sm text-muted-foreground mt-1">Lead Intake Guide</p>
          </div>
          <nav className="mt-4 px-4 pb-8">
            <ul className="space-y-2">
              <li>
                <a
                  href="#introduction"
                  className={`block px-4 py-2 rounded-md text-sm transition-colors ${
                    activeSection === "introduction"
                      ? "bg-muted text-foreground font-semibold"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Introduction
                </a>
              </li>
              <li>
                <a
                  href="#authentication"
                  className={`block px-4 py-2 rounded-md text-sm transition-colors ${
                    activeSection === "authentication"
                      ? "bg-muted text-foreground font-semibold"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Authentication
                </a>
              </li>
              <li>
                <span className="block px-4 pt-4 pb-2 text-xs font-semibold text-muted-foreground uppercase">
                  Leads API
                </span>
              </li>
              <li>
                <a
                  href="#endpoint"
                  className={`block px-4 py-2 rounded-md text-sm transition-colors ${
                    activeSection === "endpoint"
                      ? "bg-muted text-foreground font-semibold"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Endpoint
                </a>
              </li>
              <li>
                <a
                  href="#request-body"
                  className={`block px-4 py-2 rounded-md text-sm transition-colors ${
                    activeSection === "request-body"
                      ? "bg-muted text-foreground font-semibold"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Request Body
                </a>
              </li>
              <li>
                <a
                  href="#responses"
                  className={`block px-4 py-2 rounded-md text-sm transition-colors ${
                    activeSection === "responses"
                      ? "bg-muted text-foreground font-semibold"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Responses
                </a>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 lg:pl-64">
          <div className="flex flex-col lg:flex-row">
            {/* Documentation Content */}
            <main className="w-full lg:w-1/2 p-6 md:p-10 lg:p-12 pt-24 space-y-12">
              <section id="introduction">
                <h2 className="text-3xl font-bold text-foreground border-b border-border pb-2">
                  Introduction
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  Welcome to the LamaniHub CRM API documentation. This guide will walk you through
                  programmatically adding new leads to your LamaniHub account.
                </p>
                <p className="mt-4 text-muted-foreground">
                  The Lead Intake API allows you to send lead data from your applications (like web
                  forms, backend services, or third-party integrations) directly into your LamaniHub
                  CRM. The process is straightforward: you make a secure HTTP POST request to our
                  endpoint with the lead's information.
                </p>
              </section>

              <section id="authentication">
                <h2 className="text-3xl font-bold text-foreground border-b border-border pb-2">
                  Authentication
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Authentication is handled via an API key. You must include your unique API key in
                  the <code className="bg-muted text-sm font-semibold px-2 py-1 rounded-md">x-api-key</code>{" "}
                  header of your request.
                </p>
                <p className="mt-4 text-muted-foreground">
                  You can generate and manage your API keys from the{" "}
                  <Link to="/settings" className="text-primary hover:underline font-semibold">
                    Settings → API
                  </Link>{" "}
                  section of your LamaniHub dashboard.
                </p>
                <div className="mt-4 bg-muted p-4 rounded-lg">
                  <p className="font-mono text-sm text-foreground">
                    <span className="font-semibold">Header:</span> x-api-key: &lt;YOUR_API_KEY&gt;
                  </p>
                </div>
              </section>

              <section id="endpoint">
                <h2 className="text-3xl font-bold text-foreground border-b border-border pb-2">
                  Endpoint
                </h2>
                <p className="mt-4 text-muted-foreground">
                  To create a new lead, send a{" "}
                  <code className="bg-green-100 text-green-800 font-bold px-2 py-1 rounded-md text-sm">
                    POST
                  </code>{" "}
                  request to the following URL:
                </p>
                <div className="mt-4 bg-slate-900 text-white p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  https://gjnnqeqlxxoiajgklevz.supabase.co/functions/v1/lead-intake
                </div>
              </section>

              <section id="request-body">
                <h2 className="text-3xl font-bold text-foreground border-b border-border pb-2">
                  Request Body
                </h2>
                <p className="mt-4 text-muted-foreground">
                  The body of your POST request must be a JSON object containing the lead's
                  information. Here are the available fields:
                </p>
                <div className="mt-6 overflow-x-auto">
                  <table className="min-w-full bg-card rounded-lg shadow-sm border border-border">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left font-semibold p-3 text-foreground">Field</th>
                        <th className="text-left font-semibold p-3 text-foreground">Type</th>
                        <th className="text-left font-semibold p-3 text-foreground">Required</th>
                        <th className="text-left font-semibold p-3 text-foreground">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr>
                        <td className="p-3 font-mono text-sm text-foreground">name</td>
                        <td className="p-3 font-mono text-sm text-muted-foreground">String</td>
                        <td className="p-3">
                          <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">
                            Yes
                          </span>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          The full name of the lead.
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-sm text-foreground">email</td>
                        <td className="p-3 font-mono text-sm text-muted-foreground">String</td>
                        <td className="p-3">
                          <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">
                            Yes
                          </span>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          The primary email address of the lead.
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-sm text-foreground">phone</td>
                        <td className="p-3 font-mono text-sm text-muted-foreground">String</td>
                        <td className="p-3">
                          <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">
                            Yes
                          </span>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          Malaysian phone number (will be normalized to +60 format).
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-sm text-foreground">source</td>
                        <td className="p-3 font-mono text-sm text-muted-foreground">String</td>
                        <td className="p-3">
                          <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded-full">
                            No
                          </span>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          Lead source (e.g., "Website Form", "Facebook Ad").
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-sm text-foreground">consent</td>
                        <td className="p-3 font-mono text-sm text-muted-foreground">Boolean</td>
                        <td className="p-3">
                          <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded-full">
                            No
                          </span>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          PDPA consent status (true/false).
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 p-4 bg-blue-50 border-l-4 border-primary rounded">
                  <p className="text-sm text-foreground">
                    <strong>Custom Fields:</strong> You can also include any custom fields as
                    key-value pairs. LamaniHub will automatically detect and create these fields.
                  </p>
                </div>
              </section>

              <section id="responses">
                <h2 className="text-3xl font-bold text-foreground border-b border-border pb-2">
                  Responses
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Here's a breakdown of the possible responses you can receive from the API.
                </p>
                <h3 className="text-xl font-semibold mt-6 text-foreground">
                  ✅ Success (201 Created)
                </h3>
                <p className="mt-2 text-muted-foreground">
                  A successful request will return a <code className="bg-muted px-2 py-1 rounded">201 Created</code> status
                  code and a JSON object confirming the lead creation.
                </p>
                <h3 className="text-xl font-semibold mt-6 text-foreground">❌ Errors</h3>
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full bg-card rounded-lg shadow-sm border border-border">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left font-semibold p-3 text-foreground">Status Code</th>
                        <th className="text-left font-semibold p-3 text-foreground">Meaning</th>
                        <th className="text-left font-semibold p-3 text-foreground">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr>
                        <td className="p-3">
                          <code className="bg-yellow-100 text-yellow-800 font-bold px-2 py-1 rounded-md">
                            400
                          </code>
                        </td>
                        <td className="p-3 font-semibold text-foreground">Bad Request</td>
                        <td className="p-3 text-sm text-muted-foreground">
                          The request body is missing required fields or is malformed.
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3">
                          <code className="bg-orange-100 text-orange-800 font-bold px-2 py-1 rounded-md">
                            401
                          </code>
                        </td>
                        <td className="p-3 font-semibold text-foreground">Unauthorized</td>
                        <td className="p-3 text-sm text-muted-foreground">
                          The API key is missing, invalid, or expired.
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3">
                          <code className="bg-red-100 text-red-800 font-bold px-2 py-1 rounded-md">
                            409
                          </code>
                        </td>
                        <td className="p-3 font-semibold text-foreground">Duplicate Lead</td>
                        <td className="p-3 text-sm text-muted-foreground">
                          A lead with this phone or email already exists.
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3">
                          <code className="bg-red-100 text-red-800 font-bold px-2 py-1 rounded-md">
                            429
                          </code>
                        </td>
                        <td className="p-3 font-semibold text-foreground">Too Many Requests</td>
                        <td className="p-3 text-sm text-muted-foreground">
                          You have exceeded the API rate limit.
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3">
                          <code className="bg-red-100 text-red-800 font-bold px-2 py-1 rounded-md">
                            500
                          </code>
                        </td>
                        <td className="p-3 font-semibold text-foreground">
                          Internal Server Error
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          An unexpected error occurred on our end.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            </main>

            {/* Right Side: Code Examples */}
            <aside className="hidden lg:block lg:w-1/2 p-6 md:p-10 lg:p-12 pt-24">
              <div className="sticky top-24 space-y-8">
                {/* cURL Example */}
                <div>
                  <h3 className="font-semibold text-foreground mb-2">cURL Example</h3>
                  <div className="bg-slate-900 rounded-xl shadow-lg">
                    <div className="flex items-center justify-between text-sm text-slate-400 px-4 py-2 border-b border-slate-700">
                      <span>Terminal</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(curlCode, "curl")}
                        className="h-8 text-slate-400 hover:text-white"
                      >
                        {copiedCode === "curl" ? (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                    <pre className="p-4 text-sm overflow-x-auto text-slate-300">
                      <code>{curlCode}</code>
                    </pre>
                  </div>
                </div>

                {/* JavaScript Example */}
                <div>
                  <h3 className="font-semibold text-foreground mb-2">JavaScript Example</h3>
                  <div className="bg-slate-900 rounded-xl shadow-lg">
                    <div className="flex items-center justify-between text-sm text-slate-400 px-4 py-2 border-b border-slate-700">
                      <span>fetch.js</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(jsCode, "js")}
                        className="h-8 text-slate-400 hover:text-white"
                      >
                        {copiedCode === "js" ? (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                    <pre className="p-4 text-sm overflow-x-auto text-slate-300">
                      <code>{jsCode}</code>
                    </pre>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}

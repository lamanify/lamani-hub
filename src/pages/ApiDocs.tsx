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
        <aside className="hidden lg:block w-56 bg-secondary border-r border-border fixed top-0 left-0 h-full pt-20 overflow-y-auto">
          <div className="p-4">
            <h1 className="text-xl font-bold text-foreground">LamaniHub API</h1>
            <p className="text-xs text-muted-foreground mt-1">Lead Intake Guide</p>
          </div>
          <nav className="mt-2 px-3 pb-6">
            <ul className="space-y-1">
              <li>
                <a
                  href="#introduction"
                  className={`block px-3 py-1.5 rounded-md text-xs transition-colors ${
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
                  className={`block px-3 py-1.5 rounded-md text-xs transition-colors ${
                    activeSection === "authentication"
                      ? "bg-muted text-foreground font-semibold"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Authentication
                </a>
              </li>
              <li>
                <span className="block px-3 pt-3 pb-1 text-[10px] font-semibold text-muted-foreground uppercase">
                  Leads API
                </span>
              </li>
              <li>
                <a
                  href="#endpoint"
                  className={`block px-3 py-1.5 rounded-md text-xs transition-colors ${
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
                  className={`block px-3 py-1.5 rounded-md text-xs transition-colors ${
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
                  className={`block px-3 py-1.5 rounded-md text-xs transition-colors ${
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
        <div className="flex-1 lg:pl-56">
          <div className="flex flex-col lg:flex-row">
            {/* Documentation Content */}
            <main className="w-full lg:w-1/2 p-4 md:p-6 lg:p-8 pt-20 space-y-8">
              <section id="introduction">
                <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2">
                  Introduction
                </h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  Welcome to the LamaniHub CRM API documentation. This guide will walk you through
                  programmatically adding new leads to your LamaniHub account.
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                  The Lead Intake API allows you to send lead data from your applications (like web
                  forms, backend services, or third-party integrations) directly into your LamaniHub
                  CRM. The process is straightforward: you make a secure HTTP POST request to our
                  endpoint with the lead's information.
                </p>
              </section>

              <section id="authentication">
                <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2">
                  Authentication
                </h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  Authentication is handled via an API key. You must include your unique API key in
                  the <code className="bg-muted text-xs font-semibold px-1.5 py-0.5 rounded">x-api-key</code>{" "}
                  header of your request.
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                  You can generate and manage your API keys from the{" "}
                  <Link to="/settings" className="text-primary hover:underline font-semibold">
                    Settings → API
                  </Link>{" "}
                  section of your LamaniHub dashboard.
                </p>
                <div className="mt-3 bg-muted p-3 rounded-lg">
                  <p className="font-mono text-xs text-foreground">
                    <span className="font-semibold">Header:</span> x-api-key: &lt;YOUR_API_KEY&gt;
                  </p>
                </div>
              </section>

              <section id="endpoint">
                <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2">
                  Endpoint
                </h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  To create a new lead, send a{" "}
                  <code className="bg-green-100 text-green-800 font-bold px-1.5 py-0.5 rounded text-xs">
                    POST
                  </code>{" "}
                  request to the following URL:
                </p>
                <div className="mt-3 bg-slate-900 text-white p-3 rounded-lg font-mono text-xs break-all">
                  https://gjnnqeqlxxoiajgklevz.supabase.co/functions/v1/lead-intake
                </div>
              </section>

              <section id="request-body">
                <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2">
                  Request Body
                </h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  The body of your POST request must be a JSON object containing the lead's
                  information. Here are the available fields:
                </p>
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full bg-card rounded-lg shadow-sm border border-border text-xs">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left font-semibold p-2 text-foreground">Field</th>
                        <th className="text-left font-semibold p-2 text-foreground">Type</th>
                        <th className="text-left font-semibold p-2 text-foreground">Required</th>
                        <th className="text-left font-semibold p-2 text-foreground">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr>
                        <td className="p-2 font-mono text-xs text-foreground">name</td>
                        <td className="p-2 font-mono text-xs text-muted-foreground">String</td>
                        <td className="p-2">
                          <span className="bg-green-100 text-green-800 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                            Yes
                          </span>
                        </td>
                        <td className="p-2 text-xs text-muted-foreground">
                          Full name of the lead.
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 font-mono text-xs text-foreground">email</td>
                        <td className="p-2 font-mono text-xs text-muted-foreground">String</td>
                        <td className="p-2">
                          <span className="bg-green-100 text-green-800 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                            Yes
                          </span>
                        </td>
                        <td className="p-2 text-xs text-muted-foreground">
                          Email address of the lead.
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 font-mono text-xs text-foreground">phone</td>
                        <td className="p-2 font-mono text-xs text-muted-foreground">String</td>
                        <td className="p-2">
                          <span className="bg-green-100 text-green-800 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                            Yes
                          </span>
                        </td>
                        <td className="p-2 text-xs text-muted-foreground">
                          Malaysian phone (normalized to +60).
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 font-mono text-xs text-foreground">source</td>
                        <td className="p-2 font-mono text-xs text-muted-foreground">String</td>
                        <td className="p-2">
                          <span className="bg-yellow-100 text-yellow-800 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                            No
                          </span>
                        </td>
                        <td className="p-2 text-xs text-muted-foreground">
                          Lead source (e.g., "Website Form").
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 font-mono text-xs text-foreground">consent</td>
                        <td className="p-2 font-mono text-xs text-muted-foreground">Boolean</td>
                        <td className="p-2">
                          <span className="bg-yellow-100 text-yellow-800 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                            No
                          </span>
                        </td>
                        <td className="p-2 text-xs text-muted-foreground">
                          PDPA consent status.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 p-3 bg-blue-50 border-l-4 border-primary rounded">
                  <p className="text-xs text-foreground">
                    <strong>Custom Fields:</strong> You can also include any custom fields as
                    key-value pairs. LamaniHub will automatically detect and create these fields.
                  </p>
                </div>
              </section>

              <section id="responses">
                <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2">
                  Responses
                </h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  Here's a breakdown of the possible responses you can receive from the API.
                </p>
                <h3 className="text-lg font-semibold mt-4 text-foreground">
                  ✅ Success (201 Created)
                </h3>
                <p className="mt-2 text-xs text-muted-foreground">
                  A successful request will return a <code className="bg-muted px-1.5 py-0.5 rounded text-xs">201 Created</code> status
                  code and a JSON object confirming the lead creation.
                </p>
                <h3 className="text-lg font-semibold mt-4 text-foreground">❌ Errors</h3>
                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-full bg-card rounded-lg shadow-sm border border-border text-xs">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left font-semibold p-2 text-foreground">Status</th>
                        <th className="text-left font-semibold p-2 text-foreground">Meaning</th>
                        <th className="text-left font-semibold p-2 text-foreground">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr>
                        <td className="p-2">
                          <code className="bg-yellow-100 text-yellow-800 font-bold px-1.5 py-0.5 rounded text-xs">
                            400
                          </code>
                        </td>
                        <td className="p-2 font-semibold text-foreground text-xs">Bad Request</td>
                        <td className="p-2 text-xs text-muted-foreground">
                          Missing required fields or malformed.
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2">
                          <code className="bg-orange-100 text-orange-800 font-bold px-1.5 py-0.5 rounded text-xs">
                            401
                          </code>
                        </td>
                        <td className="p-2 font-semibold text-foreground text-xs">Unauthorized</td>
                        <td className="p-2 text-xs text-muted-foreground">
                          API key missing, invalid, or expired.
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2">
                          <code className="bg-red-100 text-red-800 font-bold px-1.5 py-0.5 rounded text-xs">
                            409
                          </code>
                        </td>
                        <td className="p-2 font-semibold text-foreground text-xs">Duplicate</td>
                        <td className="p-2 text-xs text-muted-foreground">
                          Lead with this phone/email exists.
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2">
                          <code className="bg-red-100 text-red-800 font-bold px-1.5 py-0.5 rounded text-xs">
                            429
                          </code>
                        </td>
                        <td className="p-2 font-semibold text-foreground text-xs">Rate Limit</td>
                        <td className="p-2 text-xs text-muted-foreground">
                          Exceeded API rate limit.
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2">
                          <code className="bg-red-100 text-red-800 font-bold px-1.5 py-0.5 rounded text-xs">
                            500
                          </code>
                        </td>
                        <td className="p-2 font-semibold text-foreground text-xs">
                          Server Error
                        </td>
                        <td className="p-2 text-xs text-muted-foreground">
                          Unexpected error occurred.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            </main>

            {/* Right Side: Code Examples */}
            <aside className="hidden lg:block lg:w-1/2 p-4 md:p-6 lg:p-8 pt-20">
              <div className="sticky top-20 space-y-6">
                {/* cURL Example */}
                <div>
                  <h3 className="font-semibold text-foreground mb-2 text-sm">cURL Example</h3>
                  <div className="bg-slate-900 rounded-lg shadow-lg">
                    <div className="flex items-center justify-between text-xs text-slate-400 px-3 py-1.5 border-b border-slate-700">
                      <span>Terminal</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(curlCode, "curl")}
                        className="h-6 text-xs text-slate-400 hover:text-white px-2"
                      >
                        {copiedCode === "curl" ? (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                    <pre className="p-3 text-[11px] overflow-x-auto text-slate-300 leading-relaxed">
                      <code>{curlCode}</code>
                    </pre>
                  </div>
                </div>

                {/* JavaScript Example */}
                <div>
                  <h3 className="font-semibold text-foreground mb-2 text-sm">JavaScript Example</h3>
                  <div className="bg-slate-900 rounded-lg shadow-lg">
                    <div className="flex items-center justify-between text-xs text-slate-400 px-3 py-1.5 border-b border-slate-700">
                      <span>fetch.js</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(jsCode, "js")}
                        className="h-6 text-xs text-slate-400 hover:text-white px-2"
                      >
                        {copiedCode === "js" ? (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                    <pre className="p-3 text-[11px] overflow-x-auto text-slate-300 leading-relaxed">
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

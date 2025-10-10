import { useState } from "react";
import { Link } from "react-router-dom";
import PublicTopBar from "@/components/PublicTopBar";

const HelpCenter = () => {
  const [activeTab, setActiveTab] = useState('getting-started');
  
  const tabs = [
    { id: 'getting-started', title: 'Getting Started' },
    { id: 'lead-management', title: 'Lead Management' },
    { id: 'billing', title: 'Billing & Subscription' },
    { id: 'settings-security', title: 'Settings & Security' },
    { id: 'custom-property', title: 'Custom Property' },
  ];
  
  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    if (window.innerWidth < 1024) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PublicTopBar />
      
      {/* Header */}
      <header className="bg-black text-white shadow-sm sticky top-0 z-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Documentation</h1>
          </div>
          <span className="text-sm text-gray-300 hidden sm:block">Your guide to mastering the CRM</span>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          
          {/* Tab Navigation (Sidebar on Desktop) */}
          <aside className="lg:col-span-3 mb-8 lg:mb-0">
            <div className="sticky top-24">
              <h2 className="text-lg font-semibold mb-4 text-foreground">Topics</h2>
              <nav className="flex flex-col space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`text-left p-3 rounded-md font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary text-white'
                        : 'text-muted-foreground hover:bg-primary hover:text-white'
                    }`}
                  >
                    {tab.title}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Tab Content */}
          <div className="lg:col-span-9 space-y-8">
            
            {/* Getting Started Tab */}
            {activeTab === 'getting-started' && (
              <section className="space-y-6">
                <h2 className="text-3xl font-bold border-b pb-2 text-foreground">Getting Started</h2>
                <div className="bg-card p-6 rounded-lg shadow-sm">
                  <h3 className="text-xl font-semibold mb-3">1. Signing Up</h3>
                  <p className="mb-4 text-muted-foreground">Creating your LamaniHub account is the first step. You'll get a 14-day free trial with full access.</p>
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Navigate to the <Link to="/signup" className="text-primary hover:underline">Signup Page</Link>.</li>
                    <li>Fill in your <strong>Clinic Name</strong>, <strong>Email</strong>, and a secure <strong>Password</strong>.</li>
                    <li>Accept the terms and conditions.</li>
                    <li>Click "Start Free Trial". You'll be taken to a brief onboarding tour.</li>
                    <li>After onboarding, you'll land on your main Dashboard.</li>
                  </ol>
                </div>
                <div className="bg-card p-6 rounded-lg shadow-sm">
                  <h3 className="text-xl font-semibold mb-3">2. Logging In & Out</h3>
                  <p className="mb-4 text-muted-foreground">Access your account securely.</p>
                  <ul className="list-disc list-inside space-y-2">
                    <li><strong>To Log In:</strong> Go to the <Link to="/login" className="text-primary hover:underline">Login Page</Link>, enter your credentials, and click "Sign In".</li>
                    <li><strong>To Log Out:</strong> Click your profile avatar in the top-right corner of the dashboard and select "Logout".</li>
                  </ul>
                </div>
                <div className="bg-card p-6 rounded-lg shadow-sm">
                  <h3 className="text-xl font-semibold mb-3">3. The Dashboard</h3>
                  <p className="mb-4 text-muted-foreground">Your dashboard gives you a quick overview of your clinic's activities.</p>
                  <ul className="list-disc list-inside space-y-2">
                    <li><strong>Stats Cards:</strong> At the top, you'll find key metrics like Total Leads, New Leads this Week, and more.</li>
                    <li><strong>Recent Activity:</strong> See a timeline of the latest actions, such as lead creation or updates.</li>
                    <li><strong>Navigation:</strong> Use the sidebar on the left to navigate to different sections like Leads, Settings, and Billing.</li>
                  </ul>
                </div>
              </section>
            )}

            {/* Lead Management Tab */}
            {activeTab === 'lead-management' && (
              <section className="space-y-6">
                <h2 className="text-3xl font-bold border-b pb-2 text-foreground">Lead (Contact) Management</h2>
                <div className="bg-card p-6 rounded-lg shadow-sm">
                  <h3 className="text-xl font-semibold mb-3">Creating a New Lead</h3>
                  <p className="mb-4 text-muted-foreground">Manually add a new patient inquiry or contact to your CRM.</p>
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Navigate to the <strong>Leads</strong> page from the sidebar.</li>
                    <li>Click the <strong>"+ New Lead"</strong> button at the top right.</li>
                    <li>Fill in the required information: Name, Phone, and Email.</li>
                    <li>Select a <strong>Source</strong> (e.g., Walk-in, Referral).</li>
                    <li>Add any optional notes.</li>
                    <li>Confirm you have consent to store their data by checking the box.</li>
                    <li>Click <strong>"Add Lead"</strong> to save.</li>
                  </ol>
                </div>
                <div className="bg-card p-6 rounded-lg shadow-sm">
                  <h3 className="text-xl font-semibold mb-3">Managing Leads</h3>
                  <ul className="list-disc list-inside space-y-3">
                    <li><strong>Viewing Leads:</strong> The Leads page shows all your contacts. On desktop, it's a table. On mobile, it's a list of cards.</li>
                    <li><strong>Searching & Filtering:</strong> Use the search bar to find leads by name, phone, or email. Use the dropdowns to filter by status or source.</li>
                    <li><strong>Viewing Details:</strong> Click on any lead in the table or card to go to their detailed view page.</li>
                    <li><strong>Editing:</strong> On the Lead Detail page, click the "Edit" button to open a modal and update their information.</li>
                    <li><strong>Deleting:</strong> On the Lead Detail page, click the "Delete" button. You'll be asked to confirm this action.</li>
                  </ul>
                </div>
                <div className="bg-card p-6 rounded-lg shadow-sm">
                  <h3 className="text-xl font-semibold mb-3">Importing & Exporting Leads</h3>
                  <ul className="list-disc list-inside space-y-3">
                    <li><strong>Import:</strong> On the Leads page, click "Import". You can download a CSV template, fill it with your data, and upload it. The system will guide you through mapping your file's columns to CRM fields.</li>
                    <li><strong>Export:</strong> Click the "Export" button on the Leads page to download a full CSV file of all your leads, including all core and custom properties. This is useful for backups or compliance.</li>
                  </ul>
                </div>
                <div className="bg-card p-6 rounded-lg shadow-sm">
                  <h3 className="text-xl font-semibold mb-3">WhatsApp Integration</h3>
                  <p className="mb-4 text-muted-foreground">Directly contact your leads via WhatsApp.</p>
                  <ul className="list-disc list-inside space-y-2">
                    <li>On the Leads table, click the WhatsApp icon next to a phone number.</li>
                    <li>On the Lead Detail page, click the "WhatsApp" button.</li>
                    <li>This will open a new tab to WhatsApp Web or the WhatsApp app with a pre-filled message, ready to send. All phone numbers are automatically formatted correctly for this to work.</li>
                  </ul>
                </div>
              </section>
            )}
            
            {/* Billing Tab */}
            {activeTab === 'billing' && (
              <section className="space-y-6">
                <h2 className="text-3xl font-bold border-b pb-2 text-foreground">Billing & Subscription</h2>
                <div className="bg-card p-6 rounded-lg shadow-sm">
                  <h3 className="text-xl font-semibold mb-3">Understanding Your Subscription</h3>
                  <p className="mb-4 text-muted-foreground">Your subscription status determines your access to LamaniHub features.</p>
                  <ul className="list-disc list-inside space-y-3">
                    <li><strong>Trial:</strong> You have full access for 14 days. A banner at the top of your dashboard will show how many days are left.</li>
                    <li><strong>Active:</strong> Your subscription is paid and up-to-date. You have full access.</li>
                    <li><strong>Past Due:</strong> Your last payment failed. You'll see a warning banner. You have a grace period (usually 7 days) to update your payment method before your account is suspended.</li>
                    <li><strong>Suspended/Cancelled:</strong> Your access is restricted. You need to reactivate your subscription to continue. Your data is kept safe for a period before deletion.</li>
                  </ul>
                </div>
                <div className="bg-card p-6 rounded-lg shadow-sm">
                  <h3 className="text-xl font-semibold mb-3">How to Subscribe or Manage Billing</h3>
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Navigate to the <strong>Billing</strong> page from the sidebar.</li>
                    <li>If you are on a trial, click <strong>"Start Subscription"</strong>. This will redirect you to our secure payment portal powered by Stripe.</li>
                    <li>If you are already subscribed, click <strong>"Manage Billing"</strong>. This will take you to the Stripe customer portal where you can:</li>
                    <li className="ml-8">Update your credit card information.</li>
                    <li className="ml-8">View and download past invoices.</li>
                    <li className="ml-8">Cancel your subscription.</li>
                  </ol>
                </div>
                <div className="bg-card p-6 rounded-lg shadow-sm">
                  <h3 className="text-xl font-semibold mb-3">Invoice History</h3>
                  <p className="text-muted-foreground">On the Billing page, you will find a list of all your past invoices. You can download a PDF of any invoice for your records.</p>
                </div>
              </section>
            )}

            {/* Settings & Security Tab */}
            {activeTab === 'settings-security' && (
              <section className="space-y-6">
                <h2 className="text-3xl font-bold border-b pb-2 text-foreground">Settings & Security</h2>
                <div className="bg-card p-6 rounded-lg shadow-sm">
                  <h3 className="text-xl font-semibold mb-3">Managing Your Profile & Clinic</h3>
                  <p className="mb-4 text-muted-foreground">Navigate to <strong>Settings → Clinic Profile</strong> to manage your information.</p>
                  <ul className="list-disc list-inside space-y-2">
                    <li><strong>Clinic Name:</strong> Only users with an 'Admin' role can change the clinic's name.</li>
                    <li><strong>Full Name:</strong> Any user can change their own full name.</li>
                    <li><strong>Email & Role:</strong> Your email and user role are shown here but cannot be changed from this screen.</li>
                  </ul>
                </div>
                <div className="bg-card p-6 rounded-lg shadow-sm">
                  <h3 className="text-xl font-semibold mb-3">PDPA Compliance (DPO)</h3>
                  <p className="mb-4 text-muted-foreground">To comply with Malaysia's Personal Data Protection Act (PDPA), you must appoint a Data Protection Officer (DPO). Go to <strong>Settings → PDPA Compliance</strong>.</p>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Only Admins can fill in the DPO's name, email, and phone number.</li>
                    <li>This information is crucial for compliance and may be used in privacy notices.</li>
                  </ul>
                </div>
                <div className="bg-card p-6 rounded-lg shadow-sm">
                  <h3 className="text-xl font-semibold mb-3">API Access & Integrations</h3>
                  <p className="mb-4 text-muted-foreground">Connect LamaniHub to your website forms or other tools. Go to <strong>Settings → API Access</strong>.</p>
                  <ul className="list-disc list-inside space-y-2">
                    <li><strong>API Key:</strong> This is a secret key that allows other applications to create leads in your account. Keep it safe.</li>
                    <li><strong>View/Copy Key:</strong> You can view and copy your API key from this tab.</li>
                    <li><strong>Regenerate Key:</strong> If your key is ever compromised, an Admin can regenerate it. Be aware that this will break any existing integrations until you update them with the new key.</li>
                  </ul>
                </div>
                <div className="bg-card p-6 rounded-lg shadow-sm">
                  <h3 className="text-xl font-semibold mb-3">Security</h3>
                  <p className="mb-4 text-muted-foreground">Manage your account security under <strong>Settings → Security</strong>.</p>
                  <ul className="list-disc list-inside space-y-2">
                    <li><strong>Change Password:</strong> Update your login password.</li>
                    <li><strong>Active Sessions:</strong> View all the devices currently logged into your account. You can revoke (sign out) any session you don't recognize.</li>
                    <li><strong>Security Log:</strong> See a log of important security-related events like logins, password changes, and session revocations.</li>
                  </ul>
                </div>
              </section>
            )}
            
            {/* Custom Property Tab */}
            {activeTab === 'custom-property' && (
              <section className="space-y-6">
                <h2 className="text-3xl font-bold border-b pb-2 text-foreground">Custom Property</h2>
                <div className="bg-card p-6 rounded-lg shadow-sm">
                  <h3 className="text-xl font-semibold mb-3">What are Custom Properties?</h3>
                  <p className="text-muted-foreground">Custom properties allow you to store extra information about your leads beyond the standard fields (Name, Phone, Email). For example, you could store "Treatment Interest", "Budget", or "Referred By".</p>
                </div>
                <div className="bg-card p-6 rounded-lg shadow-sm">
                  <h3 className="text-xl font-semibold mb-3">Automatic Creation</h3>
                  <p className="mb-4 text-muted-foreground">LamaniHub makes this easy. You don't have to create properties in advance.</p>
                  <ul className="list-disc list-inside space-y-2">
                    <li>When you <strong>import a CSV file</strong> or send data via the <strong>API</strong>, any column/field that isn't a standard field (like 'name' or 'phone') is automatically created as a new custom property.</li>
                    <li>The system intelligently guesses the property type (Text, Number, Date, etc.) based on the data.</li>
                  </ul>
                </div>
                <div className="bg-card p-6 rounded-lg shadow-sm">
                  <h3 className="text-xl font-semibold mb-3">Managing Custom Properties</h3>
                  <p className="mb-4 text-muted-foreground">You can manage all your custom properties by navigating to <strong>Settings → Custom Property</strong>.</p>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Here you'll see a list of all custom properties that have been created for your clinic.</li>
                    <li>You can <strong>edit</strong> a property to change its label, type, and visibility settings.</li>
                    <li>You can toggle whether a property appears in the main leads list or is marked as sensitive.</li>
                    <li>You can also <strong>archive</strong> properties you no longer use. This hides them without deleting the data.</li>
                  </ul>
                </div>
              </section>
            )}

          </div>
        </div>
      </main>
    </div>
  );
};

export default HelpCenter;

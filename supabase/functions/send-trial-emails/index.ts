import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TrialEmailRequest {
  email: string;
  name: string;
  type: "welcome" | "reminder" | "expired";
  daysRemaining?: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, type, daysRemaining }: TrialEmailRequest = await req.json();

    console.log(`Sending ${type} email to ${email}`);

    let subject = "";
    let html = "";

    switch (type) {
      case "welcome":
        subject = "Welcome to LamaniHub - Your 14-Day Trial Starts Now! 🎉";
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #e9204f;">Welcome to LamaniHub CRM!</h1>
            <p>Hi ${name},</p>
            <p>Thank you for starting your free trial with LamaniHub - the CRM built specifically for Malaysian healthcare providers.</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #333; margin-top: 0;">Your Trial Details</h2>
              <p><strong>Duration:</strong> 14 days</p>
              <p><strong>Access:</strong> Full features, no credit card required</p>
              <p><strong>What's included:</strong></p>
              <ul>
                <li>Centralized patient management</li>
                <li>WhatsApp integration</li>
                <li>CSV import/export</li>
                <li>Custom fields</li>
                <li>PDPA compliant audit trails</li>
              </ul>
            </div>

            <h3>Get Started:</h3>
            <ol>
              <li>Log in to your dashboard</li>
              <li>Add your first patient lead</li>
              <li>Try the WhatsApp integration</li>
              <li>Import existing contacts from spreadsheets</li>
            </ol>

            <p style="margin-top: 30px;">
              <a href="${Deno.env.get("VITE_SUPABASE_URL")}/login" 
                 style="background-color: #e9204f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Go to Dashboard
              </a>
            </p>

            <p style="color: #666; font-size: 14px; margin-top: 40px;">
              Need help? Reply to this email or check our documentation.
            </p>

            <p style="color: #999; font-size: 12px; margin-top: 20px;">
              LamaniHub CRM - Streamlining Malaysian Healthcare
            </p>
          </div>
        `;
        break;

      case "reminder":
        subject = `Trial Ending Soon - ${daysRemaining} Days Left to Upgrade`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #e9204f;">Your Trial is Ending Soon</h1>
            <p>Hi ${name},</p>
            <p>Just a friendly reminder that you have <strong>${daysRemaining} days</strong> left in your LamaniHub trial.</p>
            
            <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <p style="margin: 0;"><strong>Trial expires in ${daysRemaining} days</strong></p>
              <p style="margin: 10px 0 0 0; font-size: 14px;">Upgrade now to continue managing your patient relationships seamlessly.</p>
            </div>

            <h3>Why upgrade to LamaniHub?</h3>
            <ul>
              <li>Never lose patient data again</li>
              <li>PDPA compliant with full audit trails</li>
              <li>WhatsApp integration for instant communication</li>
              <li>Only RM 299/month - 70% cheaper than international alternatives</li>
            </ul>

            <p style="margin-top: 30px;">
              <a href="${Deno.env.get("VITE_SUPABASE_URL")}/billing" 
                 style="background-color: #e9204f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Upgrade Now
              </a>
            </p>

            <p style="color: #666; font-size: 14px; margin-top: 40px;">
              Questions about pricing? Reply to this email.
            </p>

            <p style="color: #999; font-size: 12px; margin-top: 20px;">
              LamaniHub CRM - Streamlining Malaysian Healthcare
            </p>
          </div>
        `;
        break;

      case "expired":
        subject = "Your LamaniHub Trial Has Ended";
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #e9204f;">Your Trial Has Ended</h1>
            <p>Hi ${name},</p>
            <p>Your 14-day free trial of LamaniHub has come to an end.</p>
            
            <div style="background-color: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
              <p style="margin: 0;"><strong>Trial Period Ended</strong></p>
              <p style="margin: 10px 0 0 0; font-size: 14px;">Your account is now inactive. Upgrade to restore access to all your data.</p>
            </div>

            <h3>Don't lose your progress:</h3>
            <ul>
              <li>Your data is safely stored and waiting</li>
              <li>Restore full access instantly by upgrading</li>
              <li>Continue managing your patient relationships</li>
            </ul>

            <p style="margin-top: 30px;">
              <a href="${Deno.env.get("VITE_SUPABASE_URL")}/billing" 
                 style="background-color: #e9204f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Upgrade to Continue
              </a>
            </p>

            <p style="color: #666; font-size: 14px; margin-top: 40px;">
              Not ready to upgrade? Your data will be stored for 30 days.
            </p>

            <p style="color: #999; font-size: 12px; margin-top: 20px;">
              LamaniHub CRM - Streamlining Malaysian Healthcare
            </p>
          </div>
        `;
        break;
    }

    const emailResponse = await resend.emails.send({
      from: "LamaniHub <onboarding@resend.dev>",
      to: [email],
      subject,
      html,
    });

    console.log(`Email sent successfully:`, emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending trial email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

import { AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ApiKeyRegenerationBannerProps {
  apiKeyHash: string | null;
  isAdmin: boolean;
}

export function ApiKeyRegenerationBanner({ apiKeyHash, isAdmin }: ApiKeyRegenerationBannerProps) {
  const navigate = useNavigate();

  // Don't show banner if API key hash exists (key is properly set up)
  if (apiKeyHash) return null;

  return (
    <Alert variant="destructive" className="border-orange-500 bg-orange-50 dark:bg-orange-950">
      <AlertCircle className="h-4 w-4 text-orange-600" />
      <AlertTitle className="text-orange-900 dark:text-orange-100">
        API Key Security Update Required
      </AlertTitle>
      <AlertDescription className="text-orange-800 dark:text-orange-200">
        <p className="mb-3">
          For enhanced security, we've migrated to encrypted API keys using bcrypt hashing. Your API key needs to be regenerated to continue using API integrations.
        </p>
        {isAdmin ? (
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/settings?tab=api")}
              className="bg-white hover:bg-orange-50 text-orange-900 border-orange-300"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Go to API Settings
            </Button>
          </div>
        ) : (
          <p className="text-sm italic">
            Please contact your clinic administrator to regenerate the API key.
          </p>
        )}
      </AlertDescription>
    </Alert>
  );
}

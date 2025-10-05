import { Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

export default function SuperAdminBadge() {
  const { role } = useAuth();

  if (role !== 'super_admin') {
    return null;
  }

  return (
    <Badge variant="destructive" className="text-xs">
      <Shield className="h-3 w-3 mr-1" />
      Super Admin
    </Badge>
  );
}

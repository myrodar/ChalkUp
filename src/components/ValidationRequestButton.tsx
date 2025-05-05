import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { UserCheck } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { Boulder } from '@/types';
import ValidationQRModal from './ValidationQRModal';
import { useAuth } from '@/App';

interface ValidationRequestButtonProps {
  boulder: Boulder;
  attemptCount: number;
}

const ValidationRequestButton = ({ boulder, attemptCount }: ValidationRequestButtonProps) => {
  const [showQRModal, setShowQRModal] = useState(false);
  const { t } = useTranslation();
  const { session } = useAuth();

  if (!session?.user?.id) return null;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="mt-2 w-full flex items-center gap-2"
        onClick={() => setShowQRModal(true)}
      >
        <UserCheck className="h-4 w-4" />
        {t('requestValidation')}
      </Button>

      <ValidationQRModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        boulder={boulder}
        attemptCount={attemptCount}
        userId={session.user.id}
      />
    </>
  );
};

export default ValidationRequestButton;

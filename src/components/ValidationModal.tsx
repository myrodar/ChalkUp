import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, User, Mountain } from 'lucide-react';
import { useValidation } from '@/contexts/ValidationContext';
import { useTranslation } from '@/hooks/use-translation';

const ValidationModal = () => {
  const { incomingRequest, showValidationModal, respondToValidation, closeValidationModal } = useValidation();
  const { t } = useTranslation();

  if (!incomingRequest) return null;

  return (
    <Dialog open={showValidationModal} onOpenChange={closeValidationModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('validationRequest')}</DialogTitle>
          <DialogDescription>
            {t('validationRequestDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-4 p-3 rounded-lg border">
            <User className="h-10 w-10 text-primary" />
            <div>
              <p className="font-medium">{incomingRequest.climberName}</p>
              <p className="text-sm text-muted-foreground">{t('requestingValidation')}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-3 rounded-lg border">
            <Mountain className="h-10 w-10 text-primary" />
            <div>
              <p className="font-medium">{incomingRequest.boulderName}</p>
              <div className="flex items-center mt-1">
                <span
                  className="inline-block w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: incomingRequest.boulderColor }}
                />
                <span className="text-sm text-muted-foreground">
                  {incomingRequest.boulderColor}
                </span>
              </div>
              {incomingRequest.attemptCount && (
                <div className="mt-1 text-sm bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
                  {t('attempts')}: <span className="font-medium">{incomingRequest.attemptCount}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex sm:justify-between">
          <Button
            variant="destructive"
            onClick={() => respondToValidation(incomingRequest.id, false)}
            className="flex items-center gap-2"
          >
            <XCircle className="h-4 w-4" />
            {t('reject')}
          </Button>
          <Button
            variant="default"
            onClick={() => respondToValidation(incomingRequest.id, true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4" />
            {t('validate')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ValidationModal;

import { Dialog, DialogContent, DialogOverlay } from "@/components/ui/dialog";
import { ProfileCompletion } from "./ProfileCompletion";


/* eslint-disable @typescript-eslint/no-explicit-any */

interface ProfileCompletionModalProps {
  isOpen: boolean;
  onClose?: () => void;
  user: any;
  accountType: "INDIVIDUAL" | "ORGANIZATION" | "CONTRACTOR" | "HARDWARE";
  userType?: "CUSTOMER" | "CONTRACTOR" | "FUNDI" | "PROFESSIONAL" | "HARDWARE";
  onComplete: (data: any) => void;
}

export function ProfileCompletionModal({
  isOpen,
  onClose,
  user,
  accountType,
  userType,
  onComplete
}: ProfileCompletionModalProps) {
  const handleRedirectClose = () => {
    if (onClose) {
      onClose();
    }
    window.location.href = "http://localhost:8080";
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleRedirectClose} >
      <DialogOverlay className="!bg-transparent !opacity-0 pointer-events-none" style={{ backgroundColor: 'transparent', opacity: 0 }} />
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-hide p-0 border-0 bg-transparent shadow-none sm:max-w-4xl focus:outline-none [&>button]:hidden">
        <div className="bg-gray-100 rounded-lg overflow-hidden w-full">
          <ProfileCompletion
            user={user}
            accountType={accountType}
            userType={userType}
            onComplete={onComplete}
            onCancel={handleRedirectClose}
            isModal={true}
          />
        </div>

      </DialogContent>
    </Dialog>
  );
}

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ProfileCompletion } from "./ProfileCompletion";


/* eslint-disable @typescript-eslint/no-explicit-any */

interface ProfileCompletionModalProps {
  isOpen: boolean;
  onClose?: () => void;
  user: any;
  accountType: "INDIVIDUAL" | "ORGANIZATION" | "CONTRACTOR" | "HARDWARE";
  user_type?: "CUSTOMER" | "CONTRACTOR" | "FUNDI" | "PROFESSIONAL" | "HARDWARE";
  onComplete: (data: any) => void;
}

export function ProfileCompletionModal({
  isOpen,
  onClose,
  user,
  accountType,
  user_type,
  onComplete
}: ProfileCompletionModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-hide p-0 border-0 bg-transparent shadow-none sm:max-w-4xl focus:outline-none [&>button]:hidden">
        <div className="bg-white rounded-lg overflow-hidden w-full">
          <ProfileCompletion
            user={user}
            accountType={accountType}
            user_type={user_type}
            onComplete={onComplete}
            onCancel={onClose}
            isModal={true}
          />
        </div>

      </DialogContent>
    </Dialog>
  );
}

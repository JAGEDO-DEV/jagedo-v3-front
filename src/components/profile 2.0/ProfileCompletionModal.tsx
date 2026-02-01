import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ProfileCompletion } from "./ProfileCompletion";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface ProfileCompletionModalProps {
  isOpen: boolean;
  onClose?: () => void;
  user: any;
  accountType: "INDIVIDUAL" | "ORGANIZATION" | "CONTRACTOR" | "HARDWARE";
  onComplete: (data: any) => void;
}

export function ProfileCompletionModal({
  isOpen,
  onClose,
  user,
  accountType,
  onComplete
}: ProfileCompletionModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 border-0 bg-transparent shadow-none sm:max-w-4xl focus:outline-none [&>button]:hidden">
         <div className="bg-white rounded-lg overflow-hidden w-full">
            <ProfileCompletion 
                user={user} 
                accountType={accountType} 
                onComplete={onComplete} 
                onCancel={onClose}
                isModal={true} 
            />
         </div>
         
      </DialogContent>
    </Dialog>
  );
}

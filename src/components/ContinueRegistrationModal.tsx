"use client";
import { useRouter } from 'next/navigation';
import CustomModal from './ui/Modal/Modal';

interface ContinueRegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onClearAndShowSignup: () => void;
}

export default function ContinueRegistrationModal({
    isOpen,
    onClose,
    onClearAndShowSignup
}: ContinueRegistrationModalProps) {
    const router = useRouter();

    const handleContinue = () => {
        // Always continue from onboarding1 regardless of lastStep
        router.push('/onboarding');
        onClose();
    };

    const handleCancel = () => {
        localStorage.removeItem('registrationData');
        onClearAndShowSignup();
    };

    return (
        <CustomModal
            isOpen={isOpen}
            setIsOpen={onClose}
            header="Continue Registration"
            content={
                <div className="text-center">
                    <p className="text-base text-gray-700 mb-4">
                        You have an unfinished changes. Would you like to continue?
                    </p>
                </div>
            }
            hasFooter={true}
            footer={
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <button
                        onClick={handleContinue}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-xl font-medium"
                    >
                        Continue Registration
                    </button>
                    <button
                        onClick={handleCancel}
                        className="text-gray-700 hover:text-gray-900 underline font-medium"
                    >
                        Start New Registration
                    </button>
                </div>
            }
        />
    );
}

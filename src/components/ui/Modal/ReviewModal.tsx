import { cn } from "@/lib/utils";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { useState } from "react";
import { MdClose } from "react-icons/md";
export default function CustomModal(props: any) {
  const {
    isOpen,
    setIsOpen,
    header,
    content,
    hasFooter = false,
    footer,
    onOpenChange,
    onConfirm,
    loading = false,
  } = props;

  return (
    <>
      <Modal
        isOpen={isOpen}
        // onOpenChange={onOpenChange}
        onOpenChange={(open) => {
          if (!loading) {
            if (onOpenChange) onOpenChange(open);
            setIsOpen(open);
          }
        }}
        classNames={{
          body: "py-4 md:py-6 bg-transparent text-xs md:text-base",
          backdrop: "bg-black/20 backdrop-opacity-10",
          base: "border-[#292f46] text-[#31343F] bg-[#FCFCFC] rounded-2xl",
          header: cn(
            "border-b-[1px] border-[#CACACA] !p-4 md:!px-6 !text-sm md:!text-lg"
          ),
          footer: "!pt-0",
          closeButton: "hidden",
        }}
        placement="center"
        closeButton={false}
      // disableAnimation
      >
        <ModalContent>
          <ModalHeader className="flex flex-col text-center gap-1 justify-center border-b border-[#CACACA] text-xl">
            {header}
          </ModalHeader>
          <button
            // onClick={() => setIsOpen(!isOpen)}
            onClick={() => {
              if (!loading) setIsOpen(false);
            }}
            className="absolute top-5 right-5"
          >
            <MdClose className="size-4 md:size-6" />
          </button>
          <ModalBody>
            <p>{content}</p>
          </ModalBody>
          <ModalFooter>
            {!hasFooter ? (
              <>
                <button
                  onClick={() => {
                    if (!loading) setIsOpen(false);
                  }}
                  disabled={loading}
                  className={cn(
                    "border border-[#222121] text-[#222121] text-sm md:text-base rounded-xl text-center justify-center w-full py-3 px-6",
                    loading && "opacity-50 cursor-not-allowed"
                  )}
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className={cn(
                    "bg-[#E36B00] text-white text-sm md:text-base rounded-xl text-center justify-center w-full py-3 px-6",
                    loading && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {loading && (
                    <svg
                      className="animate-spin w-5 h-5 text-white inline-block mr-2"
                      viewBox="0 0 100 100"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle
                        cx="50"
                        cy="50"
                        r="35"
                        stroke="currentColor"
                        strokeWidth="10"
                        strokeDasharray="164"
                        strokeDashoffset="40"
                      />
                    </svg>
                  )}
                  Confirm
                </button>
              </>
            ) : (
              <>{footer}</>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

import { cn } from "@/lib/utils";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
export default function CustomModal(props: any) {
  const {
    isOpen,
    setIsOpen,
    header,
    content,
    hasFooter = false,
    footer,
    onOpenChange
  } = props;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        classNames={{
          // body: "py-6",
          // backdrop: "bg-[#292f46]/50 backdrop-opacity-40",
          // base: "border-[#292f46] text-[#a8b0d3]",
          // header: "border-b-[1px] border-[#292f46]",
          // footer: "border-t-[1px] border-[#292f46]",
          closeButton: "hidden",
        }}
        closeButton={false}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col text-center gap-1 justify-center border-b border-[#CACACA] text-xl">
            {header}
          </ModalHeader>
          <ModalBody>
            <p>{content}</p>
          </ModalBody>
          <ModalFooter>
            {!hasFooter ? (
              <button
                onClick={setIsOpen}
                className={cn(
                  "bg-[#E36B00] rounded-xl text-center justify-center w-full py-3 px-6"
                )}
              >
                Done
              </button>
            ) : (
              <>{footer}</>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

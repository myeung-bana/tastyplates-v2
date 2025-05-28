import { cn } from "@/lib/utils";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
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
  } = props;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        classNames={{
          body: "py-4 md:py-6 bg-transparent text-xs md:text-base",
          backdrop: "bg-black/20 backdrop-opacity-10",
          base: "border-[#292f46] text-[#31343F] bg-[#FCFCFC] rounded-2xl",
          header: cn(
            "border-b-[1px] border-[#CACACA] !p-4 md:!px-6 !text-sm md:!text-lg"
          ),
          footer: "!p-4 !pt-0 !justify-center",
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
            onClick={() => setIsOpen(!isOpen)}
            className="absolute top-5 right-5"
          >
            <MdClose className="size-4 md:size-6" />
          </button>
          <ModalBody>
            <p>{content}</p>
          </ModalBody>
          <ModalFooter>
            {!hasFooter ? (
              <button
                onClick={setIsOpen}
                className={cn(
                  "bg-[#E36B00] text-white text-sm md:text-base rounded-xl text-center justify-center w-full py-3 px-6"
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

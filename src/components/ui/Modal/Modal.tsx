import { cn } from "@/lib/utils";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { MdClose } from "react-icons/md";
import { useRouter } from "next/navigation";
import { HOME } from "@/constants/pages";

export default function CustomModal(props: any) {
  const {
    isOpen,
    setIsOpen,
    header,
    content,
    hasFooter = false,
    footer,
    footerClass = "",
    onOpenChange,
    classNames,
    baseClass = "",
    headerClass = "",
    contentClass = "",
    hasCustomCloseButton = false,
    closeButtonClass = "",
    backdropClass = "",
    wrapperClass = "",
    customButton,
    hasTrigger = false,
    trigger,
  } = props;

  const {onOpen} = useDisclosure();
  const router = useRouter();

  return (
    <>
      {hasTrigger &&
        <div onClick={onOpen}>
          {trigger}
        </div>
      }
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        classNames={{
          body: cn("py-4 md:py-6 bg-transparent text-xs md:text-base", contentClass),
          backdrop: cn("bg-black/[14%] backdrop-opacity-[14%]", backdropClass),
          base: cn("border-[#292f46] text-[#31343F] bg-[#FCFCFC] rounded-2xl", baseClass),
          header: cn(
            "border-b-[1px] border-[#CACACA] !p-4 md:!px-6 !text-sm md:!text-lg flex flex-col text-center gap-1 justify-center border-b border-[#CACACA] text-xl",
            headerClass
          ),
          footer: cn("!pt-0", footerClass),
          closeButton: "hidden",
          wrapper: wrapperClass,
        }}
        placement="center"
        closeButton={false}
        disableAnimation
        isDismissable={true}
        isKeyboardDismissDisabled={false}
      >
        <ModalContent>
          <ModalHeader>
            {header}
          </ModalHeader>
          {hasCustomCloseButton ? (
            <>
              {customButton}
            </>
          ) : (
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={cn("absolute top-5 right-5", closeButtonClass)}
            >
              <MdClose className="size-5 md:size-6" />
            </button>
          )}
          <ModalBody>
            {content}
          </ModalBody>
          <ModalFooter>
            {!hasFooter ? (
              <button
                onClick={() => router.push(HOME)}
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

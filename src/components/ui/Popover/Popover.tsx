import { cn } from "@/lib/utils";
import {Popover, PopoverTrigger, PopoverContent} from "@heroui/popover";
import { useState } from "react";
import { ReactNode } from "react";

interface CustomPopoverProps {
  align?: string;
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
  onClose?: () => void;
  trigger: ReactNode;
  content: ReactNode;
}

export default function CustomPopover(props: CustomPopoverProps) {
  const [localIsOpen, setLocalIsOpen] = useState(props.isOpen);
  const isOpen = props.isOpen !== undefined ? props.isOpen : localIsOpen;
  const setIsOpen = props.setIsOpen || setLocalIsOpen;

  return (
    <Popover
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      placement={props.align as unknown as any}
      classNames={{
        content: cn("flex"),
      }}
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      onClose={props.onClose}
    >
      <PopoverTrigger>
        {props.trigger}
      </PopoverTrigger>
      <PopoverContent>
        <div onClick={() => setIsOpen(!isOpen)}>
          {props.content}
        </div>
      </PopoverContent>
    </Popover>
  );
}
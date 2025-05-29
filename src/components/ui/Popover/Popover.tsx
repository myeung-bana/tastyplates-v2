import { cn } from "@/lib/utils";
import {Popover, PopoverTrigger, PopoverContent} from "@heroui/popover";
import { useState } from "react";

export default function CustomPopover(props: any) {
  const [isOpen, setIsOpen] = useState(props.isOpen);

  // const handleOpenChange = (open) => {
  //   setIsOpen(open);
  // };

  // const handleClose = () => {
  //   setIsOpen(false);
  // };
  return (
    <Popover
      placement={props.align}
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
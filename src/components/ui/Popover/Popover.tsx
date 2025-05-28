import { cn } from "@/lib/utils";
import {Popover, PopoverTrigger, PopoverContent} from "@heroui/popover";

export default function CustomPopover(props: any) {
  return (
    <Popover
      placement={props.align}
      classNames={{
        content: cn("flex"),
      }}
    >
      <PopoverTrigger>
        {props.trigger}
      </PopoverTrigger>
      <PopoverContent>
          {props.content}
      </PopoverContent>
    </Popover>
  );
}
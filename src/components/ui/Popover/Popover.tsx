import {Popover, PopoverTrigger, PopoverContent} from "@heroui/popover";

export default function CustomPopover(props: any) {
  return (
    <Popover placement={props.align}>
      <PopoverTrigger>
        {props.trigger}
      </PopoverTrigger>
      <PopoverContent>
          {props.content}
      </PopoverContent>
    </Popover>
  );
}
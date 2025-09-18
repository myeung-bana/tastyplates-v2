import {Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { ReactNode } from "react";

interface CustomDropdownProps {
  trigger: ReactNode;
  item: ReactNode;
}

export default function CustomDropdown(props: CustomDropdownProps) {
  return (
    <Dropdown>
      <DropdownTrigger>
        {props.trigger}
      </DropdownTrigger>
      <DropdownMenu aria-label="Static Actions">
          <DropdownItem key="item">{props.item}</DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}
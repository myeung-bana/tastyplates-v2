import {Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";

export default function CustomDropdown(props: Record<string, unknown>) {
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
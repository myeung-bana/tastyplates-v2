import {Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";

export default function CustomDropdown(props: any) {
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
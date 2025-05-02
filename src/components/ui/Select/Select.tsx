import {Select, SelectItem} from "@heroui/select";

const CustomSelect = (props: any) => {
  const defaultProps = {
    onChange: () => {},
    mode: "single",
    // eslint-disable-next-line no-unused-vars
    customOnChange: (name: string, value: string) => {},
  };

  props = { ...defaultProps, ...props };

  return (
    <div translate="no" id={props.id}>
      <Select
      classNames={{
        base: "w-full",
        label: "group-data-[filled=true]:-translate-y-5",
        trigger: "min-h-16",
        listboxWrapper: "max-h-[400px]",
      }}
      items={props.items}
      label=""
      placeholder={props.placeholder}
      // scrollRef={'scrollerRef'}
      selectionMode={props.mode}
      onChange={()=>{}}
    >
      {(item: any) => <SelectItem key={item.key}>{item.label}</SelectItem>}
    </Select>
    </div>
  );
};

export default CustomSelect;

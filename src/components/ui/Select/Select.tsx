import {Select, SelectItem} from "@heroui/select";

const CustomSelect = (props: Record<string, unknown>) => {
  const defaultProps = {
    onChange: () => {},
    mode: "single",
     
    customOnChange: () => {},
  };

  props = { ...defaultProps, ...props };

  const handleChange = (selectedOption: Record<string, unknown>) => {
    if (props.onChange) {
      // Extract the value from the selected option
      const selectedValue = selectedOption.currentKey || selectedOption.target?.value;
      props.onChange(selectedValue);
    }
  };

  return (
    <div translate="no" id={props.id}>
      <Select
        classNames={{
          base: "w-full",
          label: "group-data-[filled=true]:-translate-y-5",
          trigger: `min-h-16 bg-white px-4 ${props.className || ''}`,
          mainWrapper: "bg-white",
          listboxWrapper: "max-h-[400px]",
          listbox: "bg-white p-2",
          value: props.value ? "text-black" : "text-gray-400",
          selectorIcon: "text-black",
          popoverContent: "bg-white",
        }}
        items={props.items}
        placeholder={props.placeholder}
        selectionMode={props.mode}
        selectedKeys={props.value ? [props.value] : undefined}
        onChange={handleChange}
      >
        {(item: Record<string, unknown>) => (
          <SelectItem 
            key={item.key}
            className="hover:bg-gray-100 rounded-lg px-2 py-1 cursor-pointer"
          >
            {item.label}
          </SelectItem>
        )}
      </Select>
    </div>
  );
};

export default CustomSelect;

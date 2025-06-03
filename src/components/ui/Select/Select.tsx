import {Select, SelectItem} from "@heroui/select";

const CustomSelect = (props: any) => {
  const defaultProps = {
    onChange: () => {},
    mode: "single",
    // eslint-disable-next-line no-unused-vars
    customOnChange: (name: string, value: string) => {},
  };

  props = { ...defaultProps, ...props };

  const handleChange = (selectedOption: any) => {
    if (props.onChange) {
      // Extract the value from the selected option
      const selectedValue = selectedOption.currentKey || selectedOption.target?.value;
      console.log("Selected value:", selectedValue);
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
        {(item: any) => (
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

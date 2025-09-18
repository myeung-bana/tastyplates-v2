import {Select, SelectItem} from "@heroui/select";

interface CustomSelectProps {
  id?: string;
  className?: string;
  selectClassName?: string;
  value?: string;
  items?: Array<{ key: string; label: string }>;
  placeholder?: string;
  mode?: "single" | "multiple";
  onChange?: (value: string) => void;
  customOnChange?: () => void;
  disabled?: boolean;
}

const CustomSelect = (props: CustomSelectProps) => {
  const defaultProps = {
    onChange: () => {},
    mode: "single" as const,
    customOnChange: () => {},
  };

  const mergedProps = { ...defaultProps, ...props };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChange = (keys: any) => {
    if (mergedProps.onChange) {
      // Extract the value from the selected keys
      const selectedValue = keys instanceof Set ? Array.from(keys)[0] : keys;
      mergedProps.onChange(String(selectedValue));
    }
  };

  return (
    <div translate="no" id={mergedProps.id}>
      <Select
        classNames={{
          base: "w-full",
          label: "group-data-[filled=true]:-translate-y-5",
          trigger: `min-h-16 bg-white px-4 ${mergedProps.className || ''} ${mergedProps.selectClassName || ''}`,
          mainWrapper: "bg-white",
          listboxWrapper: "max-h-[400px]",
          listbox: "bg-white p-2",
          value: mergedProps.value ? "text-black" : "text-gray-400",
          selectorIcon: "text-black",
          popoverContent: "bg-white",
        }}
        isDisabled={mergedProps.disabled}
        items={mergedProps.items}
        placeholder={mergedProps.placeholder}
        selectionMode={mergedProps.mode}
        selectedKeys={mergedProps.value ? [mergedProps.value] : undefined}
        onSelectionChange={handleChange}
      >
        {(item: { key: string; label: string }) => (
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

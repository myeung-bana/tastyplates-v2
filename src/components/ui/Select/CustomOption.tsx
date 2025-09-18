// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomOption = (props: any) => {
  const { isSelected, isFocused, label, innerRef, innerProps } = props;

  const bgClass = isSelected
    ? "bg-transparent"
    : isFocused
    ? "bg-gray-100"
    : "";

  const textClass = isSelected ? "text-black font-semibold" : "text-gray-900";

  return (
    <div
      ref={innerRef}
      {...innerProps}
      className={`flex items-center gap-2 cursor-pointer px-3 py-2 ${bgClass} ${textClass}`}
    >
      <input
        type="checkbox"
        checked={isSelected}
        readOnly
        className="form-checkbox rounded text-blue-600"
      />
      <label>{label}</label>
    </div>
  );
};

export default CustomOption;

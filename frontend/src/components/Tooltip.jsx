function Tooltip({ label, children, position = "top" }) {
  const positionClasses =
    position === "bottom" ? "top-full mt-2" : "bottom-full mb-2";

  return (
    <span className="relative inline-flex group">
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute left-1/2 z-40 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 ${positionClasses}`}
      >
        {label}
      </span>
    </span>
  );
}

export default Tooltip;

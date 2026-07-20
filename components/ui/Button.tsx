type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
};

export default function Button({
  children,
  onClick,
  type = "button",
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="w-full rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-gray-200"
    >
      {children}
    </button>
  );
}
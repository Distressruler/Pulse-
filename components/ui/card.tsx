type CardProps = {
  children: React.ReactNode;
};

export default function Card({ children }: CardProps) {
  return (
    <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-zinc-900 p-8 shadow-2xl">
      {children}
    </div>
  );
}
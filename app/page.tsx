import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <div className="text-center">
        <h1 className="text-6xl font-bold tracking-tight">Pulse</h1>

        <p className="mt-4 text-lg text-gray-400">
          Every thought has a Pulse.
        </p>

        <Link
          href="/signup"
          className="mt-8 inline-block rounded-full bg-white px-6 py-3 font-semibold text-black transition hover:bg-gray-200"
        >
          Get Started
        </Link>

        <p className="mt-6 text-sm text-gray-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-white hover:underline"
          >
            Sign In
          </Link>
        </p>
      </div>
    </main>
  );
}

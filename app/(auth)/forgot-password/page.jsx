import Link from "next/link";
export default function Page() {
  return (
    <main className="p-10">
      <h1 className="text-2xl">Password recovery</h1>
      <p className="my-4">
        Contact your company Admin to reset your login. For the initial Admin,
        use your deployment’s documented secure recovery process.
      </p>
      <Link href="/login" className="text-cyan-300 underline">
        Back to sign in
      </Link>
    </main>
  );
}

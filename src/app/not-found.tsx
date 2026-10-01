import Link from "next/link";
export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-32 text-center">
      <h1 className="font-display text-5xl">Page not found</h1>
      <Link href="/" className="btn mt-8">Back to home</Link>
    </div>
  );
}

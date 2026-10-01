import Link from "next/link";
export default function NotFound() {
  return (
    <div className="container-x py-32 text-center">
      <h1 className="font-display text-5xl">Page not found</h1>
      <p className="mt-3 text-muted">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <Link href="/shop" className="btn mt-8">Go to the shop</Link>
    </div>
  );
}

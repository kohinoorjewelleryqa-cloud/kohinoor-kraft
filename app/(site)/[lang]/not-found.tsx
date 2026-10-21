import Link from "next/link";
export default function NotFound() {
  return (
    <main className="wrap page narrow" style={{ textAlign: "center", paddingBlock: 80 }}>
      <h1 className="ph1">Page not found · الصفحة غير موجودة</h1>
      <p className="muted">This page doesn&apos;t exist or has moved.</p>
      <p><Link className="btn gold" href="/en">Home</Link> <Link className="btn line" href="/ar">الرئيسية</Link></p>
    </main>
  );
}

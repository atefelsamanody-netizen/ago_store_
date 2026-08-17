"use client";

import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-layout">

      <aside className="admin-sidebar">

        <div className="admin-logo">
          A.GO ADMIN
        </div>

        <nav>

          <Link href="/admin">
            📊 Dashboard
          </Link>

          <Link href="/admin/orders">
            📦 Orders
          </Link>

          <Link href="/admin/products">
            👕 Products
          </Link>

          <Link href="/admin/customers">
            👥 Customers
          </Link>

          <Link href="/admin/coupons">
            🎟 Coupons
          </Link>

          <Link href="/admin/settings">
            ⚙ Settings
          </Link>

        </nav>

      </aside>

      <main className="admin-content">
        {children}
      </main>

    </div>
  );
}
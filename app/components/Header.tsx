"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Header() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const updateCart = () => {
      const cart = JSON.parse(
        localStorage.getItem("cart") || "[]"
      );

      const total = cart.reduce(
        (sum: number, item: any) =>
          sum + (item.qty || 1),
        0
      );

      setCount(total);
    };

    updateCart();

    window.addEventListener("storage", updateCart);

    const interval = setInterval(updateCart, 500);

    return () => {
      clearInterval(interval);
      window.removeEventListener(
        "storage",
        updateCart
      );
    };
  }, []);

  return (
    <header className="header">
      <Link
        href="/"
        className="logo"
      >
        A.GO
      </Link>

      <div className="header-icons">
        <Link href="/favorites">
          ❤️
        </Link>

        <Link
          href="/cart"
          className="cart-icon"
        >
          🛒

          {count > 0 && (
            <span className="cart-count">
              {count}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
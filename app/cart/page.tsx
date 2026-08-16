"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import Image from "next/image";

import Link from "next/link";

export default function CartPage() {

  const router = useRouter();

  const [cart, setCart] = useState<any[]>([]);

  useEffect(() => {

    const storedCart = JSON.parse(

      localStorage.getItem("cart") || "[]"

    );

    setCart(storedCart);

  }, []);

  const removeItem = (index: number) => {

    const updated = [...cart];

    updated.splice(index, 1);

    setCart(updated);

    localStorage.setItem(

      "cart",

      JSON.stringify(updated)

    );

  };

  const increaseQty = (index: number) => {

    const updated = [...cart];

    updated[index].qty =

      (updated[index].qty || 1) + 1;

    setCart(updated);

    localStorage.setItem(

      "cart",

      JSON.stringify(updated)

    );

  };

  const decreaseQty = (index: number) => {

    const updated = [...cart];

    if ((updated[index].qty || 1) > 1) {

      updated[index].qty--;

    }

    setCart(updated);

    localStorage.setItem(

      "cart",

      JSON.stringify(updated)

    );

  };

  const total = cart.reduce((sum, item) => {

    return sum + Number(item.price || 0) * (item.qty || 1);

  }, 0);

  return (

    <main className="cart-page">

      {/* =========================

          TOP NAVIGATION

      ========================= */}

      <header className="cart-header">

        {/* TRACK ORDER - LEFT */}

        <Link

          href="/track"

          className="track-order-link"

        >

          <span className="track-icon">

            ↗

          </span>

          <span>

            TRACK ORDER

          </span>

        </Link>

        {/* AGO */}

        <Link

          href="/products"

          className="cart-logo"

        >

          <span className="ago-a">

            A

          </span>

          <span className="ago-go">

            GO

          </span>

        </Link>

        {/* CART - RIGHT */}

        <Link

          href="/cart"

          className="cart-top-link active"

        >

          <span className="cart-bag-icon">

            🛒

          </span>

          <span>

            CART

          </span>

        </Link>

      </header>

      {/* =========================

          PAGE TITLE

      ========================= */}

      <section className="cart-title-section">

        <h1>

          Shopping Cart

        </h1>

        <span className="cart-title-line" />

      </section>

      {/* =========================

          CART CONTENT

      ========================= */}

      {cart.length === 0 ? (

        <section className="empty-cart">

          <div className="empty-cart-icon">

            🛒

          </div>

          <h2>

            Your cart is empty.

          </h2>

          <p>

            Discover something original from AGO.

          </p>

          <Link

            href="/products"

            className="continue-shopping"

          >

            CONTINUE SHOPPING

          </Link>

        </section>

      ) : (

        <section className="cart-content">

          {/* =========================

              PRODUCTS

          ========================= */}

          <div className="cart-products">

            {cart.map((item, index) => (

              <div

                key={index}

                className="cart-item"

              >

                {/* IMAGE */}

                <div className="cart-image-wrapper">

                  <Image

                    src={

                      item.image ||

                      "/product-01.png"

                    }

                    alt={

                      item.name ||

                      "AGO Product"

                    }

                    width={220}

                    height={220}

                    className="cart-image"

                  />

                </div>

                {/* INFO */}

                <div className="cart-info">

                  <h2>

                    {item.name}

                  </h2>

                  <p>

                    Color :{" "}

                    <strong>

                      {typeof item.color === "string"

                        ? item.color

                        : item.color?.name || "-"}

                    </strong>

                  </p>

                  <p>

                    Size :{" "}

                    <strong>

                      {item.size || "-"}

                    </strong>

                  </p>

                  {item.hiddenMessage && (

                    <p>

                      Hidden Message :{" "}

                      <strong>

                        {item.hiddenMessage

                          .split("/")

                          .pop()}

                      </strong>

                    </p>

                  )}

                  <h3>

                    {item.price} EGP

                  </h3>

                  {/* QUANTITY */}

                  <div className="quantity-row">

                    <span>

                      Quantity

                    </span>

                    <div className="qty-box">

                      <button

                        type="button"

                        onClick={() =>

                          decreaseQty(index)

                        }

                      >

                        −

                      </button>

                      <span>

                        {item.qty || 1}

                      </span>

                      <button

                        type="button"

                        onClick={() =>

                          increaseQty(index)

                        }

                      >

                        +

                      </button>

                    </div>

                  </div>

                  {/* REMOVE */}

                  <button

                    type="button"

                    className="remove-btn"

                    onClick={() =>

                      removeItem(index)

                    }

                  >

                    REMOVE

                  </button>

                </div>

              </div>

            ))}

          </div>

          {/* =========================

              SUMMARY

          ========================= */}

          <aside className="cart-summary">

            <h2>

              ORDER SUMMARY

            </h2>

            <div className="summary-line">

              <span>

                Subtotal

              </span>

              <strong>

                {total} EGP

              </strong>

            </div>

            <div className="summary-line">

              <span>

                Shipping

              </span>

              <strong>

                —

              </strong>

            </div>

            <div className="summary-divider" />

            <div className="summary-final">

              <span>

                TOTAL

              </span>

              <strong>

                {total} EGP

              </strong>

            </div>

            <button

              type="button"

              className="checkout-btn"

              onClick={() =>

                router.push("/checkout")

              }

            >

              CHECKOUT

            </button>

            <Link

              href="/products"

              className="back-shopping"

            >

              ← CONTINUE SHOPPING

            </Link>

          </aside>

        </section>

      )}

      {/* =========================

          STYLES

      ========================= */}

      <style jsx global>{`

        * {

          box-sizing: border-box;

        }

        body {

          margin: 0;

          padding: 0;

          background: #ffffff;

          color: #111111;

        }

        a {

          color: inherit;

          text-decoration: none;

        }

        .cart-page {

          min-height: 100vh;

          width: 100%;

          background: #ffffff;

          color: #111111;

          font-family:

            Inter,

            -apple-system,

            BlinkMacSystemFont,

            "Segoe UI",

            Arial,

            sans-serif;

        }

        /* =========================

           HEADER

        ========================= */

        .cart-header {

          width: 100%;

          height: 82px;

          display: grid;

          grid-template-columns: 1fr auto 1fr;

          align-items: center;

          padding: 0 35px;

          border-bottom: 1px solid #e8e8e8;

          background: #ffffff;

          position: relative;

          z-index: 20;

        }

        .track-order-link,

        .cart-top-link {

          display: flex;

          align-items: center;

          gap: 8px;

          font-size: 10px;

          font-weight: 500;

          letter-spacing: 1.8px;

          color: #111111;

          transition:

            opacity 0.2s ease,

            transform 0.2s ease;

        }

        .track-order-link {

          justify-self: start;

        }

        .cart-top-link {

          justify-self: end;

        }

        .track-order-link:hover,

        .cart-top-link:hover {

          opacity: 0.5;

          transform: translateY(-1px);

        }

        .track-icon {

          width: 22px;

          height: 22px;

          display: flex;

          align-items: center;

          justify-content: center;

          border: 1px solid #111111;

          border-radius: 50%;

          font-size: 12px;

        }

        .cart-bag-icon {

          font-size: 17px;

          line-height: 1;

        }

        .cart-logo {

          display: flex;

          align-items: center;

          font-family:

            "Century Gothic",

            "Avenir Next",

            "Montserrat",

            Arial,

            sans-serif;

          font-size: 39px;

          font-weight: 500;

          letter-spacing: -0.09em;

          line-height: 0.8;

        }

        .ago-a {

          font-weight: 600;

        }

        .ago-go {

          font-weight: 500;

          letter-spacing: -0.105em;

        }

        /* =========================

           TITLE

        ========================= */

        .cart-title-section {

          padding:

            65px 25px

            55px;

          text-align: center;

        }

        .cart-title-section h1 {

          margin: 0;

          font-size: 32px;

          font-weight: 400;

          letter-spacing: -0.5px;

        }

        .cart-title-line {

          display: block;

          width: 42px;

          height: 1px;

          background: #111111;

          margin:

            22px auto 0;

        }

        /* =========================

           CONTENT

        ========================= */

        .cart-content {

          width: 100%;

          max-width: 1250px;

          margin: 0 auto;

          padding:

            0 25px

            90px;

          display: grid;

          grid-template-columns:

            minmax(0, 1fr)

            350px;

          gap: 70px;

        }

        /* =========================

           CART ITEM

        ========================= */

        .cart-item {

          display: grid;

          grid-template-columns:

            190px

            minmax(0, 1fr);

          gap: 28px;

          padding:

            0 0 30px;

          margin-bottom: 30px;

          border-bottom:

            1px solid #e8e8e8;

        }

        .cart-image-wrapper {

          width: 190px;

          height: 190px;

          background: #f6f6f6;

          overflow: hidden;

        }

        .cart-image {

          width: 100%;

          height: 100%;

          object-fit: cover;

          display: block;

        }

        .cart-info h2 {

          margin:

            0 0 13px;

          font-size: 17px;

          font-weight: 500;

        }

        .cart-info p {

          margin:

            5px 0;

          font-size: 11px;

          color: #666666;

          letter-spacing: 0.3px;

        }

        .cart-info strong {

          color: #111111;

          font-weight: 500;

        }

        .cart-info h3 {

          margin:

            16px 0;

          font-size: 14px;

          font-weight: 500;

        }

        /* =========================

           QUANTITY

        ========================= */

        .quantity-row {

          display: flex;

          align-items: center;

          gap: 18px;

          margin-top: 18px;

        }

        .quantity-row > span {

          font-size: 10px;

          letter-spacing: 1px;

          text-transform: uppercase;

          color: #777777;

        }

        .qty-box {

          display: flex;

          align-items: center;

          height: 34px;

          border:

            1px solid #111111;

        }

        .qty-box button {

          width: 34px;

          height: 32px;

          border: 0;

          background: #ffffff;

          color: #111111;

          font-size: 17px;

          cursor: pointer;

        }

        .qty-box button:hover {

          background: #111111;

          color: #ffffff;

        }

        .qty-box span {

          width: 35px;

          text-align: center;

          font-size: 12px;

        }

        /* =========================

           REMOVE

        ========================= */

        .remove-btn {

          margin-top: 20px;

          border: 0;

          padding: 0;

          background: transparent;

          color: #777777;

          font-size: 9px;

          letter-spacing: 1.5px;

          cursor: pointer;

          text-decoration: underline;

          text-underline-offset: 4px;

        }

        .remove-btn:hover {

          color: #111111;

        }

        /* =========================

           SUMMARY

        ========================= */

        .cart-summary {

          align-self: start;

          border:

            1px solid #dddddd;

          padding: 30px;

          position: sticky;

          top: 25px;

          background: #ffffff;

        }

        .cart-summary h2 {

          margin:

            0 0 28px;

          font-size: 13px;

          font-weight: 500;

          letter-spacing: 2px;

        }

        .summary-line {

          display: flex;

          align-items: center;

          justify-content: space-between;

          margin-bottom: 15px;

          font-size: 11px;

          color: #666666;

        }

        .summary-line strong {

          color: #111111;

          font-weight: 500;

        }

        .summary-divider {

          width: 100%;

          height: 1px;

          background: #dddddd;

          margin:

            23px 0;

        }

        .summary-final {

          display: flex;

          justify-content: space-between;

          align-items: center;

          font-size: 12px;

          letter-spacing: 1px;

        }

        .summary-final strong {

          font-size: 16px;

          letter-spacing: 0;

        }

        /* =========================

           CHECKOUT

        ========================= */

        .checkout-btn {

          width: 100%;

          margin-top: 28px;

          height: 52px;

          border: 1px solid #111111;

          background: #111111;

          color: #ffffff;

          font-size: 11px;

          font-weight: 500;

          letter-spacing: 2px;

          cursor: pointer;

          transition:

            background 0.2s ease,

            color 0.2s ease;

        }

        .checkout-btn:hover {

          background: #ffffff;

          color: #111111;

        }

        .back-shopping {

          display: block;

          margin-top: 20px;

          text-align: center;

          font-size: 9px;

          letter-spacing: 1.2px;

          color: #555555;

        }

        .back-shopping:hover {

          color: #111111;

        }

        /* =========================

           EMPTY CART

        ========================= */

        .empty-cart {

          min-height: 55vh;

          display: flex;

          flex-direction: column;

          align-items: center;

          justify-content: center;

          text-align: center;

          padding: 30px;

        }

        .empty-cart-icon {

          font-size: 36px;

          margin-bottom: 20px;

        }

        .empty-cart h2 {

          margin:

            0 0 10px;

          font-size: 17px;

          font-weight: 400;

        }

        .empty-cart p {

          margin:

            0 0 25px;

          color: #777777;

          font-size: 12px;

        }

        .continue-shopping {

          display: inline-flex;

          align-items: center;

          justify-content: center;

          height: 48px;

          padding:

            0 30px;

          background: #111111;

          color: #ffffff;

          font-size: 10px;

          letter-spacing: 1.8px;

        }

        .continue-shopping:hover {

          background: #333333;

        }

        /* =========================

           MOBILE

        ========================= */

        @media (max-width: 750px) {

          .cart-header {

            height: 70px;

            padding: 0 16px;

          }

          .cart-logo {

            font-size: 31px;

          }

          .track-order-link,

          .cart-top-link {

            font-size: 8px;

            letter-spacing: 1px;

            gap: 5px;

          }

          .track-icon {

            width: 19px;

            height: 19px;

            font-size: 10px;

          }

          .cart-bag-icon {

            font-size: 15px;

          }

          .cart-title-section {

            padding:

              45px 20px

              40px;

          }

          .cart-title-section h1 {

            font-size: 25px;

          }

          .cart-content {

            display: block;

            padding:

              0 14px

              60px;

          }

          .cart-item {

            grid-template-columns:

              115px

              minmax(0, 1fr);

            gap: 16px;

          }

          .cart-image-wrapper {

            width: 115px;

            height: 115px;

          }

          .cart-info h2 {

            font-size: 13px;

          }

          .cart-info p {

            font-size: 9px;

          }

          .cart-info h3 {

            font-size: 12px;

          }

          .quantity-row {

            gap: 8px;

          }

          .quantity-row > span {

            font-size: 8px;

          }

          .qty-box {

            height: 29px;

          }

          .qty-box button {

            width: 29px;

            height: 27px;

          }

          .qty-box span {

            width: 28px;

            font-size: 10px;

          }

          .cart-summary {

            position: static;

            margin-top: 35px;

            padding: 23px;

          }

        }

      `}</style>

    </main>

  );

}
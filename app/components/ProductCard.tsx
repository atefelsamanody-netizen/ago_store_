"use client";

import Link from "next/link";
import Image from "next/image";

export default function ProductCard({ product }: any) {
  const image =
    product.images?.[0] ||
    product.image ||
    "/placeholder.png";

  return (
    <div className="product-card">

      {product.discount > 0 && (
        <div className="discount-badge">
          -{product.discount}%
        </div>
      )}

      <div className="product-image">
        <Image
          src={image}
          alt={product.name}
          width={450}
          height={550}
        />
      </div>

      <h3>{product.name}</h3>

      <div className="price-box">
        <span className="price">
          {product.price} EGP
        </span>

        {product.oldPrice > 0 && (
          <span className="old-price">
            {product.oldPrice} EGP
          </span>
        )}
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginTop: 10,
          marginBottom: 15,
        }}
      >
       {product.colors?.map((color: any, index: number) => (

  <span

    key={index}

    style={{

      padding: "4px 10px",

      border: "1px solid #ddd",

      borderRadius: 20,

      fontSize: 12,

      display: "flex",

      alignItems: "center",

      gap: 6,

    }}

  >

    <span

      style={{

        width: 10,

        height: 10,

        borderRadius: "50%",

        background: color.code,

        display: "inline-block",

      }}

    />

    {color.name}

  </span>

))}
      </div>
console.log(product);
console.log(product.slug);
      <Link
        href={`/products/${product.slug}`}
        className="view-btn"
      >
        View Product
      </Link>
    </div>
  );
}
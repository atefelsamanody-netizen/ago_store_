"use client";

import { useEffect, useState } from "react";

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";

import { db } from "@/app/lib/firebase";

import ProductForm from "./ProductForm";

type Product = {
  id: string;

  name?: string;
  slug?: string;

  price?: number;
  oldPrice?: number;
  stock?: number;

  images?: string[];

  sizes?: string[];

  colors?: any[];

  messages?: string[];

  hiddenMessages?: string[];

  featured?: boolean;

  createdAt?: any;
};

export default function ProductsPage() {
  /* =====================================================
     PRODUCTS
  ===================================================== */

  const [products, setProducts] =
    useState<Product[]>([]);

  const [loading, setLoading] =
    useState(true);

  /* =====================================================
     SEARCH
  ===================================================== */

  const [search, setSearch] =
    useState("");

  /* =====================================================
     FORM
  ===================================================== */

  const [formOpen, setFormOpen] =
    useState(false);

  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);

  /* =====================================================
     DELETE
  ===================================================== */

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  /* =====================================================
     LOAD PRODUCTS
  ===================================================== */

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      setLoading(true);

      const productsRef =
        collection(
          db,
          "products"
        );

      /*
       * نحاول أولًا بالترتيب
       * حسب createdAt
       */

      try {
        const q =
          query(
            productsRef,
            orderBy(
              "createdAt",
              "desc"
            )
          );

        const snapshot =
          await getDocs(q);

        const data: Product[] =
          snapshot.docs.map(
            (item) => ({
              id: item.id,
              ...(item.data() as Omit<
                Product,
                "id"
              >),
            })
          );

        setProducts(data);

        return;
      } catch (orderedError) {
        console.warn(
          "ORDERED PRODUCTS LOAD FAILED:",
          orderedError
        );
      }

      /*
       * Fallback بدون orderBy
       */

      const snapshot =
        await getDocs(
          productsRef
        );

      const data: Product[] =
        snapshot.docs.map(
          (item) => ({
            id: item.id,
            ...(item.data() as Omit<
              Product,
              "id"
            >),
          })
        );

      /*
       * ترتيب محلي لو createdAt موجود
       */

      data.sort(
        (a, b) => {

          const aTime =
            a.createdAt?.seconds
              ? a.createdAt.seconds
              : 0;

          const bTime =
            b.createdAt?.seconds
              ? b.createdAt.seconds
              : 0;

          return (
            bTime -
            aTime
          );
        }
      );

      setProducts(data);

    } catch (error) {

      console.error(
        "LOAD PRODUCTS ERROR:",
        error
      );

      setProducts([]);

      alert(
        "حدث خطأ أثناء تحميل المنتجات.\nافتح Console لمعرفة الخطأ."
      );

    } finally {

      setLoading(false);

    }
  }

  /* =====================================================
     SEARCHED PRODUCTS
  ===================================================== */

  const filteredProducts =
    products.filter(
      (product) => {

        const value =
          search
            .toLowerCase()
            .trim();

        if (!value) {
          return true;
        }

        const name =
          (
            product.name ||
            ""
          ).toLowerCase();

        const slug =
          (
            product.slug ||
            ""
          ).toLowerCase();

        return (
          name.includes(value) ||
          slug.includes(value)
        );
      }
    );

  /* =====================================================
     ADD PRODUCT
  ===================================================== */

  function handleAddProduct() {

    setEditingProduct(null);

    setFormOpen(true);

  }

  /* =====================================================
     EDIT PRODUCT
  ===================================================== */

  function handleEditProduct(
    product: Product
  ) {

    setEditingProduct(product);

    setFormOpen(true);

  }

  /* =====================================================
     DELETE PRODUCT
  ===================================================== */

  async function handleDeleteProduct(
    product: Product
  ) {

    if (!product.id) {
      return;
    }

    const confirmed =
      window.confirm(
        `هل أنت متأكد من حذف المنتج "${product.name || "هذا المنتج"}"؟\n\nلا يمكن التراجع عن الحذف.`
      );

    if (!confirmed) {
      return;
    }

    try {

      setDeletingId(
        product.id
      );

      await deleteDoc(
        doc(
          db,
          "products",
          product.id
        )
      );

      /*
       * حذف المنتج من الواجهة
       * بدون إعادة تحميل الصفحة
       */

      setProducts(
        (previous) =>
          previous.filter(
            (item) =>
              item.id !==
              product.id
          )
      );

      alert(
        "تم حذف المنتج بنجاح ✅"
      );

    } catch (error: any) {

      console.error(
        "DELETE PRODUCT ERROR:",
        error
      );

      alert(
        `حدث خطأ أثناء حذف المنتج ❌

${error?.code || ""}

${error?.message || "خطأ غير معروف"}`
      );

    } finally {

      setDeletingId(null);

    }
  }

  /* =====================================================
     CLOSE FORM
  ===================================================== */

  function handleFormClose() {

    if (deletingId) {
      return;
    }

    setFormOpen(false);

    setEditingProduct(null);

  }

  /* =====================================================
     FORM SAVED
  ===================================================== */

  async function handleFormSaved() {

    /*
     * نقفل الفورم
     */

    setFormOpen(false);

    setEditingProduct(null);

    /*
     * نجيب المنتجات من Firebase
     * مرة أخرى
     */

    await loadProducts();

  }

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <main
      className="products-page"
      dir="ltr"
    >

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="products-header">

        <div>

          <h1>
            Products
          </h1>

          <p>
            Manage your A.GO products
          </p>

        </div>

        <button
          type="button"
          className="add-product-btn"
          onClick={
            handleAddProduct
          }
        >
          + Add Product
        </button>

      </div>

      {/* =================================================
          SEARCH
      ================================================= */}

      <div className="products-search">

        <input
          type="text"
          value={search}
          placeholder="Search product..."
          onChange={(event) =>
            setSearch(
              event.target.value
            )
          }
        />

        {search && (
          <button
            type="button"
            onClick={() =>
              setSearch("")
            }
            className="clear-search"
          >
            ×
          </button>
        )}

      </div>

      {/* =================================================
          RESULT COUNT
      ================================================= */}

      {!loading && (
        <div className="result-count">

          {filteredProducts.length}{" "}
          product
          {filteredProducts.length !==
          1
            ? "s"
            : ""}

        </div>
      )}

      {/* =================================================
          PRODUCTS TABLE
      ================================================= */}

      <div className="products-table-wrapper">

        {loading ? (

          <div className="products-loading">

            <div className="loader" />

            <p>
              Loading products...
            </p>

          </div>

        ) : filteredProducts.length ===
          0 ? (

          <div className="products-empty">

            <div className="empty-icon">
              📦
            </div>

            <h3>
              No products found
            </h3>

            {search ? (
              <p>
                No product matches
                your search.
              </p>
            ) : (
              <p>
                No products have
                been added yet.
              </p>
            )}

            {search && (
              <button
                type="button"
                onClick={() =>
                  setSearch("")
                }
                className="show-all-btn"
              >
                Show All Products
              </button>
            )}

          </div>

        ) : (

          <div className="table-scroll">

            <table
              className="products-table"
            >

              <thead>

                <tr>

                  <th>
                    Image
                  </th>

                  <th>
                    Product
                  </th>

                  <th>
                    Price
                  </th>

                  <th>
                    Stock
                  </th>

                  <th>
                    Featured
                  </th>

                  <th>
                    Edit
                  </th>

                  <th>
                    Delete
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredProducts.map(
                  (product) => {

                    const image =
                      Array.isArray(
                        product.images
                      ) &&
                      product.images
                        .length > 0
                        ? product.images[0]
                        : null;

                    return (

                      <tr
                        key={
                          product.id
                        }
                      >

                        {/* IMAGE */}

                        <td>

                          {image ? (

                            <img
                              src={image}
                              alt={
                                product.name ||
                                "Product"
                              }
                              className="product-table-image"
                            />

                          ) : (

                            <div className="no-product-image">
                              No Image
                            </div>

                          )}

                        </td>

                        {/* NAME */}

                        <td>

                          <div className="product-table-name">

                            <strong>
                              {product.name ||
                                "Unnamed Product"}
                            </strong>

                            <span>
                              {product.slug ||
                                "-"}
                            </span>

                          </div>

                        </td>

                        {/* PRICE */}

                        <td>

                          {Number(
                            product.price ||
                              0
                          ).toLocaleString(
                            "en-US"
                          )}{" "}
                          EGP

                        </td>

                        {/* STOCK */}

                        <td>

                          {Number(
                            product.stock ||
                              0
                          ).toLocaleString(
                            "en-US"
                          )}

                        </td>

                        {/* FEATURED */}

                        <td>

                          {product.featured ? (

                            <span className="featured-badge">
                              Yes
                            </span>

                          ) : (

                            <span className="not-featured-badge">
                              No
                            </span>

                          )}

                        </td>

                        {/* EDIT */}

                        <td>

                          <button
                            type="button"
                            className="edit-product-btn"
                            onClick={() =>
                              handleEditProduct(
                                product
                              )
                            }
                            disabled={
                              !!deletingId
                            }
                          >
                            Edit
                          </button>

                        </td>

                        {/* DELETE */}

                        <td>

                          <button
                            type="button"
                            className="delete-product-btn"
                            disabled={
                              deletingId ===
                              product.id
                            }
                            onClick={() =>
                              handleDeleteProduct(
                                product
                              )
                            }
                          >

                            {deletingId ===
                            product.id
                              ? "Deleting..."
                              : "Delete"}

                          </button>

                        </td>

                      </tr>

                    );
                  }
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

      {/* =================================================
          PRODUCT FORM
      ================================================= */}

      <ProductForm
        open={
          formOpen
        }

        onClose={
          handleFormClose
        }

        editProduct={
          editingProduct
        }

        onSaved={
          handleFormSaved
        }
      />

      {/* =================================================
          STYLES
      ================================================= */}

      <style jsx>{`

        * {
          box-sizing: border-box;
        }

        .products-page {
          min-height: 100vh;
          width: 100%;
          padding: 30px;
          background: #f5f5f5;
          color: #111;
          font-family:
            Arial,
            Tahoma,
            sans-serif;
        }

        .products-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 25px;
        }

        .products-header h1 {
          margin: 0 0 5px;
          font-size: 30px;
          font-weight: 800;
        }

        .products-header p {
          margin: 0;
          color: #777;
          font-size: 14px;
        }

        .add-product-btn {
          border: none;
          border-radius: 12px;
          padding: 14px 22px;
          background: #d4af37;
          color: #fff;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
        }

        .add-product-btn:hover {
          opacity: .9;
          transform: translateY(-1px);
        }

        .products-search {
          position: relative;
          width: 100%;
          margin-bottom: 12px;
        }

        .products-search input {
          width: 100%;
          height: 48px;
          border: 1px solid #ddd;
          border-radius: 12px;
          background: #fff;
          padding: 0 45px 0 15px;
          outline: none;
          font-size: 14px;
        }

        .products-search input:focus {
          border-color: #d4af37;
        }

        .clear-search {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          width: 28px;
          height: 28px;
          border: none;
          border-radius: 50%;
          background: #eee;
          cursor: pointer;
          font-size: 18px;
          line-height: 1;
        }

        .result-count {
          color: #777;
          font-size: 12px;
          margin-bottom: 12px;
        }

        .products-table-wrapper {
          width: 100%;
          background: #fff;
          border: 1px solid #e5e5e5;
          border-radius: 18px;
          overflow: hidden;
        }

        .table-scroll {
          width: 100%;
          overflow-x: auto;
        }

        .products-table {
          width: 100%;
          min-width: 850px;
          border-collapse: collapse;
        }

        .products-table th {
          background: #fafafa;
          color: #555;
          font-size: 12px;
          font-weight: 800;
          text-align: left;
          padding: 16px;
          border-bottom: 1px solid #eee;
          white-space: nowrap;
        }

        .products-table td {
          padding: 14px 16px;
          border-bottom: 1px solid #eee;
          vertical-align: middle;
          font-size: 13px;
        }

        .products-table tbody tr:hover {
          background: #fcfcfc;
        }

        .products-table tbody tr:last-child td {
          border-bottom: none;
        }

        .product-table-image {
          width: 70px;
          height: 80px;
          object-fit: cover;
          border-radius: 10px;
          border: 1px solid #eee;
          display: block;
        }

        .no-product-image {
          width: 70px;
          height: 80px;
          border-radius: 10px;
          background: #f2f2f2;
          color: #999;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          font-size: 10px;
        }

        .product-table-name strong {
          display: block;
          margin-bottom: 5px;
          font-size: 14px;
        }

        .product-table-name span {
          display: block;
          color: #999;
          font-size: 11px;
        }

        .featured-badge,
        .not-featured-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 6px 10px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 700;
        }

        .featured-badge {
          background: #111;
          color: #fff;
        }

        .not-featured-badge {
          background: #eee;
          color: #777;
        }

        .edit-product-btn,
        .delete-product-btn {
          border: none;
          border-radius: 9px;
          padding: 9px 13px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .edit-product-btn {
          background: #111;
          color: #fff;
        }

        .edit-product-btn:hover {
          opacity: .85;
        }

        .delete-product-btn {
          background: #f3dddd;
          color: #b42318;
        }

        .delete-product-btn:hover:not(:disabled) {
          background: #b42318;
          color: #fff;
        }

        .edit-product-btn:disabled,
        .delete-product-btn:disabled {
          opacity: .5;
          cursor: not-allowed;
        }

        .products-loading,
        .products-empty {
          min-height: 300px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 30px;
        }

        .products-loading p,
        .products-empty p {
          color: #888;
          font-size: 13px;
        }

        .products-empty h3 {
          margin: 12px 0 5px;
        }

        .empty-icon {
          font-size: 35px;
        }

        .show-all-btn {
          margin-top: 12px;
          border: none;
          border-radius: 10px;
          background: #111;
          color: #fff;
          padding: 10px 16px;
          cursor: pointer;
        }

        .loader {
          width: 38px;
          height: 38px;
          border: 4px solid #eee;
          border-top-color: #111;
          border-radius: 50%;
          animation: spin .8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 700px) {

          .products-page {
            padding: 18px 12px;
          }

          .products-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .add-product-btn {
            width: 100%;
          }

        }

      `}</style>

    </main>
  );
}
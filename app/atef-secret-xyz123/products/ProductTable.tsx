"use client";

type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  images?: string[];
};

type Props = {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
};

export default function ProductTable({
  products,
  onEdit,
  onDelete,
}: Props) {
  return (
    <div className="products-table">
      <table>
        <thead>
          <tr>
            <th>Image</th>
            <th>Name</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Edit</th>
            <th>Delete</th>
          </tr>
        </thead>

        <tbody>
          {products.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ textAlign: "center", padding: 20 }}>
                No Products
              </td>
            </tr>
          ) : (
            products.map((product) => (
              <tr key={product.id}>
                <td>
                  {product.images?.length ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      width={60}
                      height={60}
                      style={{
                        borderRadius: 10,
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    "-"
                  )}
                </td>

                <td>{product.name}</td>

                <td>{product.price} EGP</td>

                <td>{product.stock}</td>

                <td>
                  <button onClick={() => onEdit(product)}>
                    Edit
                  </button>
                </td>

                <td>
                  <button
                    onClick={() => onDelete(product.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
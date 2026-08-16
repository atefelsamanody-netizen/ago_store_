"use client";

type Props = {
  sizes: string[];
  setSizes: React.Dispatch<React.SetStateAction<string[]>>;
};

const allSizes = ["M", "L", "XL", "2XL"];

export default function ProductSizes({
  sizes,
  setSizes,
}: Props) {
  function toggleSize(size: string) {
    if (sizes.includes(size)) {
      setSizes(sizes.filter((s) => s !== size));
    } else {
      setSizes([...sizes, size]);
    }
  }

  return (
    <div style={{ marginTop: 25 }}>
      <h3
        style={{
          color: "#111",
          marginBottom: 12,
        }}
      >
        Sizes
      </h3>

      <div
        style={{
          display: "flex",
          gap: 15,
          flexWrap: "wrap",
        }}
      >
        {allSizes.map((size) => (
          <label
            key={size}
            style={{
              color: "#111",
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={sizes.includes(size)}
              onChange={() => toggleSize(size)}
            />

            {size}
          </label>
        ))}
      </div>
    </div>
  );
}
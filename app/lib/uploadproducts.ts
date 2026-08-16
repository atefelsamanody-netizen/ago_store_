import { products } from "@/app/data/products";
import { db } from "@/app/lib/firebase";

import {
  collection,
  doc,
  setDoc,
} from "firebase/firestore";

export async function uploadProducts() {
  for (const product of products) {
    await setDoc(
      doc(collection(db, "products"), product.slug),
      product
    );
  }

  console.log("Done");
}

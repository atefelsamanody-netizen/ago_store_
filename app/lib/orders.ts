import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "./firebase";

export async function createOrder(
  orderData: any
) {
  try {
    const orderRef = await addDoc(
      collection(db, "orders"),
      {
        ...orderData,

        createdAt: serverTimestamp(),

        /*
         * orderId يتم وضعه بعد إنشاء الوثيقة
         */
        orderId: null,

        /*
         * PAYMENT
         */
        paymentStatus:
          orderData.paymentStatus ||
          "pending",

        paymentMethod:
          orderData.paymentMethod ??
          null,

        paymentScreenshot: null,

        paymentScreenshotUrl: null,

        paymentSubmittedAt: null,

        paymentReviewedAt: null,

        paymentReviewedBy: null,

        paymentRejectReason: null,

        /*
         * مهم:
         * نحافظ على status القادم من Checkout.
         *
         * Checkout يرسل:
         * status: "new"
         *
         * لذلك لا نبدله إلى awaiting_payment.
         */
        status:
          orderData.status ||
          "new",
      }
    );

    /*
     * نفس Firestore document ID
     * يتم تخزينه داخل orderId
     */
    await updateDoc(
      doc(
        db,
        "orders",
        orderRef.id
      ),
      {
        orderId: orderRef.id,
      }
    );

    return orderRef.id;
  } catch (error) {
    console.error(
      "Error adding order:",
      error
    );

    throw error;
  }
}
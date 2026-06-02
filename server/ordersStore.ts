import { createERPNextDocument, listERPNextDocuments } from "./erpnextAuth.js";

export type BookOrder = {
  email: string;
  name: string;
  bookTitle: string;
  quantity: number;
  deliveryAddress?: string;
  phone?: string;
  timestamp?: string;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Create a book order in ERPNext
 */
export async function createBookOrder(order: BookOrder): Promise<void> {
  try {
    const timestamp = new Date().toISOString();

    await createERPNextDocument("Book Order", {
      email: normalizeEmail(order.email),
      customer_name: order.name,
      book_title: order.bookTitle,
      quantity: order.quantity,
      delivery_address: order.deliveryAddress || "",
      phone: order.phone || "",
      order_date: timestamp,
      docstatus: 0,
    });
  } catch (error) {
    console.error("Failed to create book order in ERPNext:", error);
    throw error;
  }
}

/**
 * Get orders for a specific email or all orders
 */
export async function getOrders(email?: string): Promise<BookOrder[]> {
  try {
    const filters = email ? { email: normalizeEmail(email) } : {};

    const result = await listERPNextDocuments("Book Order", filters, [
      "email",
      "customer_name",
      "book_title",
      "quantity",
      "delivery_address",
      "phone",
      "order_date",
    ]);

    const orders: BookOrder[] = [];
    if (result.data && Array.isArray(result.data)) {
      for (const doc of result.data) {
        const data = doc as any;
        orders.push({
          email: data.email || "",
          name: data.customer_name || "",
          bookTitle: data.book_title || "",
          quantity: parseInt(String(data.quantity || "1"), 10),
          deliveryAddress: data.delivery_address || "",
          phone: data.phone || "",
          timestamp: data.order_date || "",
        });
      }
    }

    return orders;
  } catch (error) {
    console.error("Failed to get book orders from ERPNext:", error);
    throw error;
  }
}

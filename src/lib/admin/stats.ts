import { listLeads } from "./leads-admin";
import { listOrders } from "./orders-admin";

/** Yon menyudagi belgilar: ko'rib chiqilmagan to'langan bronlar va yangi murojaatlar. */
export async function navCounts(): Promise<{ orders: number; leads: number }> {
  const [orders, leads] = await Promise.all([listOrders(), listLeads()]);
  return {
    orders: orders.filter((o) => o.status === "paid" && !o.handled).length,
    leads: leads.filter((l) => l.state === "new").length,
  };
}

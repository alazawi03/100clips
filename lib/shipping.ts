import type { Order } from "@/lib/data/types";

/*
 * Where a physical product is, for the Shipping page. 100clips doesn't run deliveries: the brand sends
 * the product and taps "Sent", the creator taps "Received", and when it has to come back the brand's
 * driver picks it up and the brand taps "Picked up". Products the creator keeps leave the page once received.
 */

export type ShippingStage = "send" | "way" | "with" | "done";

export const SHIPPING_STAGES: ShippingStage[] = ["send", "way", "with", "done"];

/** The stage of an order's product, or undefined when it isn't on the Shipping page. */
export function shippingStage(order: Order, { physical, returns }: { physical: boolean; returns: boolean }): ShippingStage | undefined {
  if (!physical || order.status === "pending" || order.status === "declined" || order.status === "cancelled") return;
  const s = order.shipping;
  if (s?.returnedAt) return "done";
  if (s?.receivedAt) return returns ? "with" : undefined;
  if (s?.sentAt) return "way";
  if (order.status === "in_progress") return "send";
}

/** Within a stage: what has waited longest first; finished pickups newest first. Ready-to-pick-up before the rest. */
export function compareInStage(stage: ShippingStage, a: Order, b: Order): number {
  const at = (o: Order) => {
    if (stage === "send") return o.createdAt;
    if (stage === "way") return o.shipping?.sentAt ?? "";
    if (stage === "with") return o.shipping?.receivedAt ?? "";
    return o.shipping?.returnedAt ?? "";
  };
  if (stage === "done") return at(b).localeCompare(at(a));
  if (stage === "with" && (a.status === "approved") !== (b.status === "approved")) return a.status === "approved" ? -1 : 1;
  return at(a).localeCompare(at(b));
}

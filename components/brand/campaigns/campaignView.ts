import { DEMO_TODAY, products } from "@/lib/data/account";
import { getClip } from "@/lib/data/clips";
import { getCreator } from "@/lib/data/creators";
import { conversations } from "@/lib/data/messages";
import type { Campaign, Clip, Order, OrderShipping, OrderStatus } from "@/lib/data/types";
import type { I18n } from "@/lib/i18n/server";
import { actionWaitingDays, currentStep, isLate, nextAction, stepsFor, waitingFor, type NextAction, type OrderStep, type Waiting } from "@/lib/orderFlow";

/** Everything an order card on the campaign page shows, already worked out on the server. */
export type OrderCardView = {
  id: string;
  creatorId: string;
  brandId: string;
  name: string;
  handle: string;
  /** "TikTok video × 1, Instagram Reel × 2" */
  itemsLabel: string;
  amount: number;
  status: OrderStatus;
  revisionRequested: boolean;
  steps: OrderStep[];
  step: OrderStep;
  action?: NextAction;
  /** Days the action has been waiting on the brand. */
  actionDays?: number;
  waiting: Waiting;
  late: boolean;
  due?: string;
  clip?: Clip;
  conversationId?: string;
  unread: number;
  lastMessages: Array<{ from: "brand" | "creator"; text: string; at: string }>;
  physical: boolean;
  returns: boolean;
  shipping?: OrderShipping;
  note?: string;
  rating?: number;
};

/** The campaign's one product, and how it reaches creators. */
export function productOf(campaign: Campaign) {
  const product = products.find((p) => p.id === campaign.productIds?.[0]);
  const physical = product?.details.type === "physical";
  const logistics = product ? campaign.logistics?.[product.id] : undefined;
  const returns = logistics?.type === "physical" && logistics.after === "return";
  return { product, physical, returns };
}

/** Next action and lateness for any order (campaign or direct offer), for lists. */
export function orderFlags(order: Order, campaign: Campaign | undefined) {
  const { physical, returns } = campaign ? productOf(campaign) : { physical: false, returns: false };
  const action = nextAction(order, { physical, returns });
  const steps = stepsFor(physical);
  return {
    action,
    actionDays: action && actionWaitingDays(order, action, DEMO_TODAY),
    late: isLate(order, campaign?.deadline, DEMO_TODAY),
    steps,
    stepIndex: steps.indexOf(currentStep(order, physical)),
  };
}

export function orderCardView(order: Order, campaign: Campaign, i18n: I18n): OrderCardView {
  const { t, f } = i18n;
  const { physical, returns } = productOf(campaign);
  const creator = getCreator(order.creatorId)!;
  const action = nextAction(order, { physical, returns });
  // The chat with this creator for this brand (or any chat with them).
  const conversation =
    conversations.find((c) => c.creatorId === order.creatorId && c.brandId === order.brandId);
  return {
    id: order.id,
    creatorId: creator.id,
    brandId: order.brandId,
    name: f.pick(creator.name),
    handle: creator.handle,
    itemsLabel: order.items.map((i) => t(`formats.${i.format}`)).join(t("common.separator")),
    amount: order.amount,
    status: order.status,
    revisionRequested: !!order.revisionRequested,
    steps: stepsFor(physical),
    step: currentStep(order, physical),
    action,
    actionDays: action && actionWaitingDays(order, action, DEMO_TODAY),
    waiting: waitingFor(order, physical),
    late: isLate(order, campaign.deadline, DEMO_TODAY),
    due: campaign.deadline,
    clip: order.clipId ? getClip(order.clipId) : undefined,
    conversationId: conversation?.id,
    unread: conversation?.unread ?? 0,
    lastMessages: (conversation?.messages ?? []).slice(-2).map(({ from, text, at }) => ({ from, text, at })),
    physical,
    returns,
    shipping: order.shipping,
    note: order.note,
    rating: order.rating,
  };
}

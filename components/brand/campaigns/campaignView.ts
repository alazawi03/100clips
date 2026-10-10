import { DEMO_NOW, DEMO_TODAY, products } from "@/lib/data/account";
import { getClip } from "@/lib/data/clips";
import { getCreator } from "@/lib/data/creators";
import { conversations } from "@/lib/data/messages";
import { platformOf, type AdCode, type AdPlatform, type Campaign, type Clip, type ClipVersion, type DeclineReason, type Order, type OrderShipping, type OrderStatus } from "@/lib/data/types";
import { brandPaid } from "@/lib/fees";
import type { I18n } from "@/lib/i18n/server";
import { actionWaitingDays, clipVersions, currentStep, isLate, nextAction, offerHoursLeft, revisionUsed, stepsFor, waitingFor, type NextAction, type OrderStep, type Waiting } from "@/lib/orderFlow";

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
  /** Pending only: hours left for the creator to accept. */
  hoursLeft?: number;
  declineReason?: DeclineReason;
  declineNote?: string;
  /** What comes back to the balance if the order ends without work: everything paid, fee included. */
  refund: number;
  /** Every uploaded version of the clip, oldest first. */
  versions: ClipVersion[];
  revisionsLeft: number;
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
  /** The clip's platform when it can carry an ad code (TikTok, Instagram), and the code if the creator added one. */
  adPlatform?: AdPlatform;
  adCode?: AdCode;
  today: string;
};

/** TikTok and Instagram clips can come with a Spark / Partnership Ads code. */
export function adPlatformOf(order: Order): AdPlatform | undefined {
  return order.items[0] && platformOf[order.items[0].format];
}

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
    amount: brandPaid(order),
    status: order.status,
    revisionRequested: !!order.revisionRequested,
    hoursLeft: order.status === "pending" ? offerHoursLeft(order, DEMO_NOW) : undefined,
    declineReason: order.declineReason,
    declineNote: order.declineNote,
    refund: brandPaid(order),
    versions: clipVersions(order, order.clipId ? getClip(order.clipId) : undefined),
    revisionsLeft: revisionUsed(order) ? 0 : 1,
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
    adPlatform: adPlatformOf(order),
    adCode: order.adCode,
    today: DEMO_TODAY,
  };
}

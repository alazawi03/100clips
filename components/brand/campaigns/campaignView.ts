import type { InviteCreator } from "@/components/brand/campaigns/CreatorPicker";
import { clipOf, type Workspace } from "@/lib/data/live";
import { allLists, creatorsIn } from "@/lib/data/lists";
import { platformOf, type Creator, type AdCode, type AdPlatform, type Campaign, type Clip, type ClipVersion, type DeclineReason, type Order, type OrderShipping, type OrderStatus, type ShipTo } from "@/lib/data/types";
import { brandPaid } from "@/lib/fees";
import type { I18n } from "@/lib/i18n/server";
import { actionWaitingDays, clipVersions, currentStep, isLate, nextAction, offerHoursLeft, revisionUsed, stepsFor, waitingFor, type NextAction, type OrderStep, type Waiting } from "@/lib/orderFlow";
import { nowIso, today } from "@/lib/today";

/** Everything an order card on the campaign page shows, already worked out on the server. */
export type OrderCardView = {
  id: string;
  creatorId: string;
  brandId: string;
  name: string;
  handle: string;
  photo?: string;
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
  /** Chat isn't on the backend yet: no conversation for real orders. */
  conversationId?: string;
  unread: number;
  lastMessages: Array<{ from: "brand" | "creator"; text: string; at: string }>;
  physical: boolean;
  returns: boolean;
  shipping?: OrderShipping;
  /** Where to send the product, once the creator accepted. */
  shipTo?: ShipTo;
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
export function productOf(campaign: Campaign, ws: Pick<Workspace, "product">) {
  const product = ws.product(campaign.productIds?.[0]);
  const physical = product?.details.type === "physical";
  const logistics = product ? campaign.logistics?.[product.id] : undefined;
  const returns = logistics?.type === "physical" && logistics.after === "return";
  return { product, physical, returns };
}

/** This order's due date: its own (moved by 100clips), else the campaign's. */
const dueOf = (order: Order, campaign: Campaign | undefined) => order.deadline ?? campaign?.deadline;

/** Next action and lateness for any order, for lists. */
export function orderFlags(order: Order, campaign: Campaign | undefined, ws: Pick<Workspace, "product">) {
  const { physical, returns } = campaign ? productOf(campaign, ws) : { physical: false, returns: false };
  const action = nextAction(order, { physical, returns });
  const steps = stepsFor(physical);
  const day = today();
  return {
    action,
    actionDays: action && actionWaitingDays(order, action, day),
    late: isLate(order, dueOf(order, campaign), day),
    steps,
    stepIndex: steps.indexOf(currentStep(order, physical)),
  };
}

export function orderCardView(order: Order, campaign: Campaign, i18n: I18n, ws: Pick<Workspace, "product" | "creator" | "brand">): OrderCardView {
  const { t, f } = i18n;
  const { physical, returns } = productOf(campaign, ws);
  const creator = ws.creator(order.creatorId)!;
  const action = nextAction(order, { physical, returns });
  const day = today();
  const clip = clipOf(order, ws);
  return {
    id: order.id,
    creatorId: creator.id,
    brandId: order.brandId,
    name: f.pick(creator.name),
    handle: creator.handle,
    photo: creator.photo,
    itemsLabel: order.items.map((i) => t(`formats.${i.format}`)).join(t("common.separator")),
    amount: brandPaid(order),
    status: order.status,
    revisionRequested: !!order.revisionRequested,
    hoursLeft: order.status === "pending" ? offerHoursLeft(order, nowIso()) : undefined,
    declineReason: order.declineReason,
    declineNote: order.declineNote,
    refund: brandPaid(order),
    versions: clipVersions(order, clip),
    revisionsLeft: revisionUsed(order) ? 0 : 1,
    steps: stepsFor(physical),
    step: currentStep(order, physical),
    action,
    actionDays: action && actionWaitingDays(order, action, day),
    waiting: waitingFor(order, physical),
    late: isLate(order, dueOf(order, campaign), day),
    due: dueOf(order, campaign),
    clip,
    conversationId: undefined,
    unread: 0,
    lastMessages: [],
    physical,
    returns,
    shipping: order.shipping,
    shipTo: order.shipTo,
    note: order.note,
    rating: order.rating,
    adPlatform: adPlatformOf(order),
    adCode: order.adCode,
    today: day,
  };
}

/** A creator as the shared picker shows them: prices per platform, and whether they're already in. */
export function inviteView(c: Creator, { t, f }: I18n, inCampaign = false): InviteCreator {
  return {
    id: c.id,
    name: f.pick(c.name),
    handle: c.handle,
    city: f.pick(c.city),
    niches: c.niches,
    inCampaign,
    showsFace: c.showsFace,
    photo: c.photo,
    packages: c.formats.map((o) => ({ format: o.format, label: t(`formats.${o.format}`), price: o.price })),
  };
}

/** The account's lists for the picker, each with its creators who can be booked now. */
export async function pickerLists(ws: Workspace, i18n: I18n, inCampaign: (id: string) => boolean = () => false) {
  return (await allLists()).map((l) => ({
    id: l.id,
    name: l.favorites ? i18n.t("lists.favorites") : l.name,
    creators: creatorsIn(l, ws).map((c) => inviteView(c, i18n, inCampaign(c.id))),
  }));
}

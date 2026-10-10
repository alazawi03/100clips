import { account, brands, products, walletTopUps } from "./account";
import { campaigns } from "./campaigns";
import { FAVORITES_ID, allLists, type CreatorList } from "./lists";
import { conversations } from "./messages";
import { orders } from "./orders";
import { problemReports } from "./problems";
import { withdrawals } from "./wallet";
import { replaceCart, type CartLine } from "./store";

/*
 * Debug only: switch between the demo account (brands, campaigns, orders, chats…) and a brand-new one
 * with nothing in it, to try the first-run screens. The demo data is set aside, not lost; whatever was
 * made while on the new account is dropped when switching back. Creators and their clips (the
 * marketplace) stay in both.
 *
 * In development, editing a data file reloads it with its demo data. The set-aside copy lives on
 * globalThis so a reload of this file doesn't lose it, and choosing "New account" again always empties
 * the account, so a reload can never leave it stuck showing demo data.
 */

type Saved = {
  brands: typeof brands;
  products: typeof products;
  campaigns: typeof campaigns;
  orders: typeof orders;
  conversations: typeof conversations;
  topUps: typeof walletTopUps;
  lists: CreatorList[];
  cart: CartLine[];
  balance: number;
  bankAccount: typeof account.bankAccount;
  withdrawals: typeof withdrawals;
  reports: typeof problemReports;
};

const store = globalThis as typeof globalThis & { __debugSavedAccount?: Saved };

export const isNewAccount = () => store.__debugSavedAccount !== undefined;

/** Empties the account. The first time, the demo data is set aside to come back to. */
export function switchToNewAccount() {
  if (store.__debugSavedAccount) {
    emptyAccount();
    return;
  }
  store.__debugSavedAccount = {
    brands: brands.splice(0),
    products: products.splice(0),
    campaigns: campaigns.splice(0),
    orders: orders.splice(0),
    conversations: conversations.splice(0),
    topUps: walletTopUps.splice(0),
    lists: allLists().splice(0),
    cart: replaceCart([]),
    balance: account.balance,
    bankAccount: account.bankAccount,
    withdrawals: withdrawals.splice(0),
    reports: problemReports.splice(0),
  };
  emptyAccount();
}

function emptyAccount() {
  for (const list of [brands, products, campaigns, orders, conversations, walletTopUps, allLists(), withdrawals, problemReports]) list.splice(0);
  replaceCart([]);
  // Favourites always exists, empty on a new account.
  allLists().push({ id: FAVORITES_ID, name: "", creatorIds: [], favorites: true });
  account.balance = 0;
  account.bankAccount = undefined;
}

export function switchToDemoData() {
  const saved = store.__debugSavedAccount;
  if (!saved) return;
  const refill = <T,>(target: T[], items: T[]) => target.splice(0, target.length, ...items);
  refill(brands, saved.brands);
  refill(products, saved.products);
  refill(campaigns, saved.campaigns);
  refill(orders, saved.orders);
  refill(conversations, saved.conversations);
  refill(walletTopUps, saved.topUps);
  refill(allLists(), saved.lists);
  replaceCart(saved.cart);
  refill(withdrawals, saved.withdrawals);
  refill(problemReports, saved.reports);
  account.balance = saved.balance;
  account.bankAccount = saved.bankAccount;
  store.__debugSavedAccount = undefined;
}

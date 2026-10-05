import arJson from "@/messages/ar.json";
import enJson from "@/messages/en.json";
import type { Locale } from "./config";

type PluralCategory = "zero" | "one" | "two" | "few" | "many" | "other";
export type PluralForms = { other: string } & Partial<Record<Exclude<PluralCategory, "other">, string>>;

/** A plural group: has "other", and every key is a plural category. */
type IsPlural<T> = T extends { other: string } ? (Exclude<keyof T, PluralCategory> extends never ? true : false) : false;

/** ar.json is the source of truth: every locale must have the same keys. Plural groups may differ in forms. */
type Shape<T> = T extends string ? string : IsPlural<T> extends true ? PluralForms : { [K in keyof T]: Shape<T[K]> };

export type Messages = Shape<typeof arJson>;

const ar: Messages = arJson;
const en: Messages = enJson;

export const dictionaries: Record<Locale, Messages> = { ar, en };

type Join<P extends string, K extends string> = P extends "" ? K : `${P}.${K}`;

/** Every key that points to a plain string, e.g. "nav.home". */
export type MessageKey<T = typeof arJson, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
    ? Join<P, K>
    : IsPlural<T[K]> extends true
      ? never
      : MessageKey<T[K], Join<P, K>>;
}[keyof T & string];

/** Every key that points to a plural group, e.g. "cart.creators". */
export type PluralKey<T = typeof arJson, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
    ? never
    : IsPlural<T[K]> extends true
      ? Join<P, K>
      : PluralKey<T[K], Join<P, K>>;
}[keyof T & string];

export type Vars = Record<string, string | number>;

function lookup(messages: Messages, key: string): unknown {
  return key.split(".").reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], messages);
}

function fill(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
}

export function createTranslator(locale: Locale) {
  const messages = dictionaries[locale];
  const rules = new Intl.PluralRules(locale);

  function t(key: MessageKey, vars?: Vars): string {
    const value = lookup(messages, key);
    return typeof value === "string" ? fill(value, vars) : key;
  }

  function tp(key: PluralKey, count: number, vars?: Vars): string {
    const forms = lookup(messages, key) as PluralForms | undefined;
    if (!forms) return key;
    const category = count === 0 && forms.zero ? "zero" : (rules.select(count) as PluralCategory);
    const template = forms[category] ?? forms.other;
    return fill(template, { count, ...vars });
  }

  return { t, tp };
}

export type Translator = ReturnType<typeof createTranslator>;

import { ValidateBy, ValidationOptions } from "class-validator";

/** A list of objects where `key` appears at most once (e.g. one price per format). */
export const UniqueBy = (key: string, options?: ValidationOptions) =>
  ValidateBy(
    {
      name: "uniqueBy",
      validator: {
        validate: (value: unknown) => {
          if (!Array.isArray(value)) return true;
          const seen = value.map((item) => (item as Record<string, unknown>)?.[key]);
          return new Set(seen).size === seen.length;
        },
        defaultMessage: (args) => `${args?.property ?? "list"}: each ${key} at most once`,
      },
    },
    options,
  );

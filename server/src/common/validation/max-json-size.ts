import { ValidateBy, ValidationOptions } from "class-validator";

/** A free-form JSON value no bigger than `bytes` once serialized. */
export const MaxJsonSize = (bytes: number, options?: ValidationOptions) =>
  ValidateBy(
    {
      name: "maxJsonSize",
      validator: {
        validate: (value: unknown) => Buffer.byteLength(JSON.stringify(value ?? null)) <= bytes,
        defaultMessage: (args) => `${args?.property ?? "value"} must be ${Math.round(bytes / 1000)} KB or less`,
      },
    },
    options,
  );

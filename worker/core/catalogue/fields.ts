/**
 * Fields describe a component's props. One field gives three things:
 * the prop's type, a zod schema that fills in the default when a saved
 * value is missing or wrong, and the control the editor shows for it.
 */
import { z } from "zod";

export type Media = { type: "image" | "video"; url: string };
export type Link = { label: string; href: string };
export type Option<V extends string = string> = { value: V; label: string };

interface FieldBase<K extends string, V> {
  kind: K;
  label: string;
  /** A short hint under the control. */
  help?: string;
  default: V;
}

export interface TextField extends FieldBase<"text", string> {
  placeholder?: string;
}
export interface LongTextField extends FieldBase<"longText", string> {
  placeholder?: string;
}
export interface NumberField extends FieldBase<"number", number> {
  min?: number;
  max?: number;
  step?: number;
}
export interface ToggleField extends FieldBase<"toggle", boolean> {}
/** A few options side by side. Use `select` once there are more than four. */
export interface SegmentedField<V extends string = string> extends FieldBase<"segmented", V> {
  options: readonly Option<V>[];
}
export interface SelectField<V extends string = string> extends FieldBase<"select", V> {
  options: readonly Option<V>[];
}
export interface ColorField extends FieldBase<"color", string> {}
/** An image URL, picked from Context or pasted. */
export interface ImageField extends FieldBase<"image", string> {}
export interface MediaField extends FieldBase<"media", Media> {}
export interface LinkField extends FieldBase<"link", Link> {}
/** Any number of options, as chips. */
export interface MultiField<V extends string = string> extends FieldBase<"multi", V[]> {
  options: readonly Option<V>[];
}
/** Skills from Context, by id. Generated sections follow them. */
export interface SkillsField extends FieldBase<"skills", string[]> {}
/** The workflow's lookups, by id: what a generated section recommends from. */
export interface LookupsField extends FieldBase<"lookups", string[]> {}
/** Repeating items, each with its own fields: nav links, FAQs, options. */
export interface ListField<F extends Fields = Fields> extends FieldBase<"list", FieldValues<F>[]> {
  fields: F;
  /** Names one item in the editor: "Add Question". */
  itemLabel: string;
  max?: number;
}

export type Field =
  | TextField
  | LongTextField
  | NumberField
  | ToggleField
  | SegmentedField
  | SelectField
  | ColorField
  | ImageField
  | MediaField
  | LinkField
  | MultiField
  | SkillsField
  | LookupsField
  // `any` so a list of any shape is still a Field.
  | ListField<any>;

export type FieldKind = Field["kind"];
export type Fields = Record<string, Field>;

export type FieldValue<F> = F extends FieldBase<string, infer V> ? V : never;
export type FieldValues<F extends Fields> = { [K in keyof F]: FieldValue<F[K]> };

type Options<F extends Field, D = F["default"]> = Omit<F, "kind" | "default"> & { default?: D };

/**
 * Builders, so a component reads like a form: `headline: f.text({ label: "Headline" })`.
 * Option lists keep their literal values, so props narrow to the union.
 */
export const f = {
  text: (o: Options<TextField>): TextField => ({ kind: "text", ...o, default: o.default ?? "" }),
  longText: (o: Options<LongTextField>): LongTextField => ({ kind: "longText", ...o, default: o.default ?? "" }),
  number: (o: Options<NumberField>): NumberField => ({ kind: "number", ...o, default: o.default ?? o.min ?? 0 }),
  toggle: (o: Options<ToggleField>): ToggleField => ({ kind: "toggle", ...o, default: o.default ?? false }),
  segmented: <const V extends string>(
    o: Omit<SegmentedField<V>, "kind" | "default"> & { default?: NoInfer<V> },
  ): SegmentedField<V> => ({ kind: "segmented", ...o, default: o.default ?? o.options[0].value }),
  select: <const V extends string>(
    o: Omit<SelectField<V>, "kind" | "default"> & { default?: NoInfer<V> },
  ): SelectField<V> => ({ kind: "select", ...o, default: o.default ?? o.options[0].value }),
  color: (o: Options<ColorField>): ColorField => ({ kind: "color", ...o, default: o.default ?? "#111111" }),
  image: (o: Options<ImageField>): ImageField => ({ kind: "image", ...o, default: o.default ?? "" }),
  media: (o: Options<MediaField>): MediaField => ({
    kind: "media",
    ...o,
    default: o.default ?? { type: "image", url: "" },
  }),
  link: (o: Options<LinkField>): LinkField => ({ kind: "link", ...o, default: o.default ?? { label: "", href: "" } }),
  multi: <const V extends string>(o: Omit<MultiField<V>, "kind" | "default"> & { default?: NoInfer<V>[] }): MultiField<V> => ({
    kind: "multi",
    ...o,
    default: o.default ?? [],
  }),
  skills: (o: Options<SkillsField>): SkillsField => ({ kind: "skills", ...o, default: o.default ?? [] }),
  lookups: (o: Options<LookupsField>): LookupsField => ({ kind: "lookups", ...o, default: o.default ?? [] }),
  list: <F extends Fields>(
    o: Omit<ListField<F>, "kind" | "default"> & { default?: FieldValues<F>[] },
  ): ListField<F> => ({ kind: "list", ...o, default: o.default ?? [] }),
};

/** Lenient: anything missing or the wrong shape falls back to the field's default. */
export function fieldSchema(field: Field): z.ZodType {
  // Typed as never so it fits every branch's schema.
  const fallback = () => structuredClone(field.default) as never;
  switch (field.kind) {
    case "text":
    case "longText":
    case "color":
    case "image":
      return z.string().catch(fallback);
    case "number": {
      let schema = z.number();
      if (field.min !== undefined) schema = schema.min(field.min);
      if (field.max !== undefined) schema = schema.max(field.max);
      return schema.catch(fallback);
    }
    case "toggle":
      return z.boolean().catch(fallback);
    case "segmented":
    case "select":
      return z.enum(field.options.map((option) => option.value) as [string, ...string[]]).catch(fallback);
    case "media":
      return z.object({ type: z.enum(["image", "video"]), url: z.string() }).catch(fallback);
    case "link":
      return z.object({ label: z.string(), href: z.string() }).catch(fallback);
    case "multi": {
      const values = new Set<string>(field.options.map((option) => option.value));
      return z
        .array(z.string())
        .transform((list) => [...new Set(list)].filter((value) => values.has(value)))
        .catch(fallback);
    }
    case "skills":
    case "lookups":
      return z.array(z.string()).catch(fallback);
    case "list": {
      const item = fieldsSchema(field.fields);
      return z.array(item).max(field.max ?? Infinity).catch(fallback);
    }
  }
}

export function fieldsSchema<F extends Fields>(fields: F): z.ZodType<FieldValues<F>> {
  return z.object(
    Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, fieldSchema(field)])),
  ) as unknown as z.ZodType<FieldValues<F>>;
}

export function defaultsOf<F extends Fields>(fields: F): FieldValues<F> {
  return Object.fromEntries(
    Object.entries(fields).map(([key, field]) => [key, structuredClone(field.default)]),
  ) as FieldValues<F>;
}

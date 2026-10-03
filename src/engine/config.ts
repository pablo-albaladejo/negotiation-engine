import { z } from "zod";

/**
 * Negotiable issue. `direction` is declared from the buyer role; for the seller it is flipped
 * (see `orientIssues` in issues.ts). Bounds are explicit so utility can be normalized.
 */
export const IssueSchema = z
  .object({
    name: z.string().regex(/^[a-z][a-zA-Z0-9_]*$/),
    min: z.number(),
    max: z.number(),
    direction: z.enum(["higher-better", "lower-better"]),
    weight: z.number().nonnegative(),
  })
  .strict()
  .refine((issue) => issue.min < issue.max, { message: "min must be less than max", path: ["max"] });

export type Issue = z.infer<typeof IssueSchema>;

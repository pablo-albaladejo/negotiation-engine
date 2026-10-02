import { z } from "zod";

/**
 * Issue negociable. `direction` se declara desde el rol comprador; para el vendedor se invierte
 * (ver `orientIssues` en issues.ts). Los límites son explícitos para normalizar la utilidad.
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
  .refine((issue) => issue.min < issue.max, { message: "min debe ser menor que max", path: ["max"] });

export type Issue = z.infer<typeof IssueSchema>;

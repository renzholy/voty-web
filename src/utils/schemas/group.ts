import { z } from 'zod'

import { booleanSetsSchema, decimalSetsSchema } from './sets'

export const workgroupSchema = z.object({
  id: z.string().min(1, 'Required'),
  name: z.string().min(1, 'Required'),
  permission: z.object({
    proposing: booleanSetsSchema,
    voting: decimalSetsSchema,
  }),
  duration: z.object({
    pending: z.number().int().min(300, 'Minium 5 minutes'),
    voting: z.number().int().min(300, 'Minium 5 minutes'),
  }),
  extension: z.object({
    type: z.literal('workgroup'),
    introduction: z.string().max(160, 'Maximum 160 characters').optional(),
    terms_and_conditions: z.string().min(1, 'Required'), // TODO: rename to criteria_for_approval
  }),
})

export const grantSchema = z.object({
  id: z.string().min(1, 'Required'),
  name: z.string().min(1, 'Required'),
  permission: z.object({
    proposing: booleanSetsSchema,
    adding_option: booleanSetsSchema,
    voting: decimalSetsSchema,
  }),
  duration: z.object({
    pending: z.number().int().min(300, 'Minium 5 minutes'),
    adding_option: z.number().int().min(300, 'Minium 5 minutes'),
    voting: z.number().int().min(300, 'Minium 5 minutes'),
  }),
  extension: z.object({
    type: z.literal('grant'),
    introduction: z.string().max(160, 'Maximum 160 characters').optional(),
  }),
})

export const groupSchema = z.union([workgroupSchema, grantSchema])

export type Workgroup = z.infer<typeof workgroupSchema>

export type Grant = z.infer<typeof grantSchema>

export type Group = z.infer<typeof groupSchema>

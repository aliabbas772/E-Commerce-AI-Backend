import { z } from 'zod'

export const createAddressSchema = z.object({
  fullName: z.string().min(2).max(100),
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number'),
  street: z.string().min(5).max(200),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  country: z.string().default('India'),
  label: z.enum(['home', 'office', 'other']).default('home')
})

export const updateAddressSchema = createAddressSchema.partial()
import { z } from 'zod'

// Common validators
export const emailSchema = z.string().email('Invalid email address')

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')

export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number')

export const districtSchema = z.string().min(1, 'District is required')
export const citySchema = z.string().min(1, 'City is required')

// Skills for volunteers
export const skillsSchema = z.array(z.string()).optional()

// Auth schemas
export const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    phone: phoneSchema,
    role: z.enum(['requester', 'volunteer', 'coordinator']),
    skills: skillsSchema,
    district: districtSchema,
    city: citySchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => {
    // Skills are required for volunteers
    if (data.role === 'volunteer') {
      return data.skills && data.skills.length > 0
    }
    return true
  }, {
    message: 'Please select at least one skill',
    path: ['skills'],
  })

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

// Request schemas
export const createRequestSchema = z.object({
  category: z.enum([
    'water',
    'food',
    'medicine',
    'shelter',
    'rescue',
    'transport',
    'other',
  ]),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  urgency: z.enum(['low', 'medium', 'high']),
  district: districtSchema,
  city: citySchema,
  peopleCount: z
    .number()
    .int()
    .positive('Number of people must be positive'),
})

export const updateRequestStatusSchema = z.object({
  status: z.enum([
    'pending',
    'matched',
    'assigned',
    'in_progress',
    'completed',
    'cancelled',
  ]),
})

// Volunteer schemas
export const registerVolunteerSchema = z.object({
  skillSet: z.array(z.string()).min(1, 'Select at least one skill'),
  district: districtSchema,
  city: citySchema,
  availabilityStatus: z.enum(['available', 'unavailable', 'limited']),
})

// Types
export type RegisterFormInputs = z.infer<typeof registerSchema>
export type LoginFormInputs = z.infer<typeof loginSchema>
export type CreateRequestInputs = z.infer<typeof createRequestSchema>
export type UpdateRequestStatusInputs = z.infer<typeof updateRequestStatusSchema>
export type RegisterVolunteerInputs = z.infer<typeof registerVolunteerSchema>

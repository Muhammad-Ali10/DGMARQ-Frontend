import { z } from "zod";

export const ContactFormSchema = z.object({
  firstname: z.string().min(2, "First name must be at least 2 characters"),
  lastname: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  message: z.string().min(5, "Message must be at least 5 characters"),
});

export const ContactFormSchema2 = z.object({
  firstname: z.string().min(2, "First name must be at least 2 characters"),
  lastname: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  department: z.string().min(1, "Please select a department"),
  message: z.string().min(5, "Message must be at least 5 characters"),
});

import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  cvUrl: z.string().url("URL tidak valid").optional().or(z.literal("")),
});

export type RegisterInput = z.infer<typeof registerSchema>;
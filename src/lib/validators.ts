import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter")
    .max(100, "Nama maksimal 100 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  cvUrl: z
    .string()
    .url("URL tidak valid")
    .max(500, "URL terlalu panjang")
    .refine((url) => /^https?:\/\//i.test(url), "URL harus diawali http:// atau https://")
    .optional()
    .or(z.literal("")),
});

export type RegisterInput = z.infer<typeof registerSchema>;

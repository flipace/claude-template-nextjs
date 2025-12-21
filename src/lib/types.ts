import { z } from "zod";

// User types
export interface User {
  id: string;
  username: string;
  displayName?: string | null;
  avatar?: string | null;
}

export interface Author {
  username: string | null;
  displayName: string | null;
  avatar: string | null;
}

// Add your types here
// Example:
// export const postFormSchema = z.object({
//   title: z.string().min(1, "Title is required"),
//   content: z.string().optional(),
// });
// export type PostFormData = z.infer<typeof postFormSchema>;

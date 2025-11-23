// app/api/auth/[...nextauth]/route.ts
import { handlers } from "~/server/auth" // adjust the path if needed

// `handlers` is { GET, POST }
export const { GET, POST } = handlers

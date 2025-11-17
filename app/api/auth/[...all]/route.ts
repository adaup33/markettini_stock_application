import { getAuth } from "@/lib/better-auth/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const runtime = 'nodejs';

export const { GET, POST } = toNextJsHandler(async () => {
    return await getAuth();
});

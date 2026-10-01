import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/customer-auth";

export const { GET, POST } = toNextJsHandler(auth);

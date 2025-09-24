import type { AuthConfig } from "@auth/core";
import Google from "next-auth/providers/google";

const googleClientId = process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET;

const providers = [] as AuthConfig["providers"];

if (googleClientId && googleClientSecret) {
  providers.push(
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
  );
} else {
  const message = "Google OAuth credentials are not configured; authentication is disabled.";
  if (process.env.NODE_ENV === "production") {
    console.error(message);
  } else {
    console.warn(message);
  }
}

const secret =
  process.env.AUTH_SECRET ??
  process.env.NEXTAUTH_SECRET ??
  (process.env.NODE_ENV !== "production" ? "alli-dev-secret-change-me-0123456789" : undefined);

if (!secret) {
  throw new Error("Missing AUTH_SECRET or NEXTAUTH_SECRET environment variable");
}

export const authConfig = {
  providers,
  secret,
} satisfies AuthConfig;

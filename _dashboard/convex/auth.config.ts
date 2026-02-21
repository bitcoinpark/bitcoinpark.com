import GitHub from "@auth/core/providers/github";
import Google from "@auth/core/providers/google";
import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    Password({
      // Allow email/password signup and login
      profile(params) {
        return {
          email: params.email as string,
          name: (params.email as string | undefined)?.split("@")[0] as string,
        };
      },
    }),
    // Optional: Add GitHub OAuth
    // GitHub,
    // Optional: Add Google OAuth
    // Google,
  ],
});

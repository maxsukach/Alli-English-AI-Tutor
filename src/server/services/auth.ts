import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { prisma } from "@/lib/prisma";

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const DEMO_USER_ID = "demo-user";

type ProfileRecord = NonNullable<Awaited<ReturnType<typeof prisma.profile.findUnique>>>;

interface ProfileResult {
  profile: ProfileRecord;
  isDemo: boolean;
  supabaseUserId?: string | null;
}

export class AuthService {
  async getProfile(): Promise<ProfileResult> {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.warn("[AuthService] Supabase environment missing, using demo profile");
      return this.getDemoProfile();
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {
          // Next server actions expose read-only cookies; refresh will be handled client-side.
          return;
        },
        remove() {
          return;
        },
      },
    });

    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.warn("[AuthService] Supabase user lookup failed", error.message);
    }

    const user = data?.user;
    if (!user) {
      return this.getDemoProfile();
    }

    const fullName = (user.user_metadata?.full_name ?? user.user_metadata?.name ?? "") as string | undefined;
    const cefrRange = user.user_metadata?.cefr ?? user.user_metadata?.cefr_range;

    const profile = await this.ensureProfile(user.id, {
      name: fullName,
      email: user.email ?? undefined,
      cefrRange: typeof cefrRange === "string" ? cefrRange : undefined,
      nativeLanguage: typeof user.user_metadata?.l1 === "string" ? user.user_metadata.l1 : undefined,
    });

    return {
      profile,
      isDemo: false,
      supabaseUserId: user.id,
    };
  }

  private async ensureProfile(
    userId: string,
    updates: {
      name?: string;
      email?: string;
      cefrRange?: string;
      nativeLanguage?: string;
    },
  ): Promise<ProfileRecord> {
    const existing = await prisma.profile.findUnique({ where: { userId } });
    if (existing) {
      const updatePayload = Object.fromEntries(
        Object.entries({
          name: updates.name,
          email: updates.email,
          cefrRange: updates.cefrRange,
          nativeLanguage: updates.nativeLanguage,
        }).filter(([, value]) => typeof value === "string" && value.length > 0),
      );

      if (Object.keys(updatePayload).length > 0) {
        return prisma.profile.update({
          where: { id: existing.id },
          data: updatePayload,
        });
      }

      return existing;
    }

    return prisma.profile.create({
      data: {
        userId,
        name: updates.name,
        email: updates.email,
        cefrRange: updates.cefrRange,
        nativeLanguage: updates.nativeLanguage,
      },
    });
  }

  private async getDemoProfile(): Promise<ProfileResult> {
    const profile =
      (await prisma.profile.findUnique({ where: { userId: DEMO_USER_ID } })) ??
      (await prisma.profile.create({
        data: {
          userId: DEMO_USER_ID,
          name: "Demo Learner",
          email: "learner@example.com",
          cefrRange: "A2",
        },
      }));

    return {
      profile,
      isDemo: true,
      supabaseUserId: null,
    };
  }
}

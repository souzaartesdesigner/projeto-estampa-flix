import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useUserSubscription(userId: string | undefined) {
  return useQuery({
    queryKey: ["user-subscription", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("id, credits_remaining, status, current_period_end, plans(name, tier, monthly_credits)")
        .eq("user_id", userId!)
        .eq("status", "active")
        .maybeSingle();
      return data;
    },
    staleTime: 1000 * 60, // 1 minute
  });
}

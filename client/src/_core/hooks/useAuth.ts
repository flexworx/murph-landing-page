import { trpc } from "@/lib/trpc";

export function useAuth() {
  const meQuery = trpc.auth.me.useQuery(undefined, { retry: false });
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => { meQuery.refetch(); },
  });

  return {
    user: meQuery.data ?? null,
    isLoading: meQuery.isLoading,
    logout: () => logoutMutation.mutate(),
  };
}

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { moderation } from "../lib/api";

export function useApprovePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId: number | string) => moderation.approve(postId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["posts", "pending"] });
      qc.invalidateQueries({ queryKey: ["posts", "all"] });
    },
  });
}

export function useRejectPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { postId: number | string; reason: string }) =>
      moderation.reject(payload.postId, payload.reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["posts", "pending"] });
      qc.invalidateQueries({ queryKey: ["posts", "all"] });
    },
  });
}

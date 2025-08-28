import * as React from "react";
import { useApprovePost, useRejectPost } from "../hooks/useModeration";
import Button from "./ui/Button";

type Props = {
  post: { id: number; title: string; authorEmail?: string };
};

export function ModerationRow({ post }: Props) {
  const approve = useApprovePost();
  const reject = useRejectPost();
  const [reason, setReason] = React.useState("");
  const [showRejectBox, setShowRejectBox] = React.useState(false);

  return (
    <div className="flex items-center justify-between border-b py-3">
      <div>
        <div className="font-medium">{post.title}</div>
        <div className="text-sm text-gray-500">{post.authorEmail}</div>
      </div>

      <div className="flex gap-2">
        <Button onClick={() => approve.mutate(post.id)} disabled={approve.isPending}> {approve.isPending ? "Approving…" : "Approve"} </Button>
        <Button variant="outline" onClick={() => setShowRejectBox(true)} disabled={reject.isPending}>Reject</Button>
      </div>

      {showRejectBox && (
        <div className="mt-2 flex flex-col gap-2">
          <textarea
            className="w-full rounded-lg px-3 py-2 bg-[color:var(--surface)] border border-[color:var(--border)] text-[color:var(--text)] text-sm"
            placeholder="Reason (min 10 chars)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              className="btn btn-primary disabled:opacity-50"
              onClick={() =>
                reject.mutate({ postId: post.id, reason }, { onSuccess: () => setShowRejectBox(false) })
              }
              disabled={reason.trim().length < 10 || reject.isPending}
            >
              {reject.isPending ? "Rejecting…" : "Confirm Reject"}
            </button>
            <button
              className="btn-ghost"
              onClick={() => setShowRejectBox(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

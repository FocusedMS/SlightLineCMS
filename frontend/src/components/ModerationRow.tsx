import * as React from "react";
import { useApprovePost, useRejectPost } from "../hooks/useModeration";

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
        <button
          className="px-3 py-1 rounded bg-green-600 text-white disabled:opacity-50"
          onClick={() => approve.mutate(post.id)}
          disabled={approve.isPending}
        >
          {approve.isPending ? "Approving…" : "Approve"}
        </button>

        <button
          className="px-3 py-1 rounded bg-red-600 text-white disabled:opacity-50"
          onClick={() => setShowRejectBox(true)}
          disabled={reject.isPending}
        >
          Reject
        </button>
      </div>

      {showRejectBox && (
        <div className="mt-2 flex flex-col gap-2">
          <textarea
            className="border p-2 text-sm"
            placeholder="Reason (min 10 chars)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              className="px-3 py-1 rounded bg-red-600 text-white disabled:opacity-50"
              onClick={() =>
                reject.mutate({ postId: post.id, reason }, { onSuccess: () => setShowRejectBox(false) })
              }
              disabled={reason.trim().length < 10 || reject.isPending}
            >
              {reject.isPending ? "Rejecting…" : "Confirm Reject"}
            </button>
            <button
              className="px-3 py-1 rounded bg-gray-200"
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

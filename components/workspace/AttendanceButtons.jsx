"use client";

import { Message, Button } from "@/components/WorkspaceUI";
import { useAction } from "@/components/workspace/shared/useWorkspaceData";

export default function AttendanceButtons({ onChange }) {
  const action = useAction(onChange);
  return (
    <>
      <div className="flex gap-3">
        <Button
          disabled={action.busy}
          onClick={() => action.act("/attendance/check-in")}
        >
          Check in without face
        </Button>
        <Button
          secondary
          disabled={action.busy}
          onClick={() => action.act("/attendance/check-out")}
        >
          Check out without face
        </Button>
      </div>
      <p className="mt-3 text-xs text-zinc-400">
        Recorded using server time in UTC.
      </p>
      <Message error={action.error} success={action.success} />
    </>
  );
}

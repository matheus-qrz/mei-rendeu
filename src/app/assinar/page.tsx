import { Suspense } from "react";
import { AssinarClient } from "./AssinarClient";

export default function AssinarPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a1a0f]" />}>
      <AssinarClient />
    </Suspense>
  );
}

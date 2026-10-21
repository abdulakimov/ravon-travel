"use client";

import { useRouter } from "next/navigation";
import { Uploader } from "../../_ui/MediaPicker";

export function MediaUploadBar() {
  const router = useRouter();
  return <Uploader onUploaded={() => router.refresh()} />;
}

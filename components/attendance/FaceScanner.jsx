import Card from "@/components/ui/Card";
import CameraPreview from "@/components/attendance/CameraPreview";

export default function FaceScanner() {
  return (
    <Card title="Camera preview">
      <p className="mb-4 text-sm text-white/60">
        Face matching is not configured. Starting the preview only requests camera access.
      </p>
      <CameraPreview />
    </Card>
  );
}
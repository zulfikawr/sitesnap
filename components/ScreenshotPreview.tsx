"use client";

import { Button } from "@/components/ui/button";
import { Download, ImageIcon } from "lucide-react";
import Image from "next/image";

type ScreenshotPreviewProps = {
  screenshot: string | null;
};

export function ScreenshotPreview({ screenshot }: ScreenshotPreviewProps) {
  const handleDownload = () => {
    if (screenshot) {
      const link = document.createElement("a");
      link.href = screenshot;
      link.download = "screenshot.png";
      link.click();
    }
  };

  return (
    <div className="space-y-4">
      {screenshot && (
        <div className="flex items-center justify-end">
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2 text-muted-foreground" />
            Download
          </Button>
        </div>
      )}
      <div className="aspect-video w-full bg-muted rounded-lg border border-muted flex items-center justify-center">
        {screenshot ? (
          <Image
            src={screenshot}
            alt="Website screenshot"
            className="w-full h-full object-contain rounded-lg"
            width={1280}
            height={720}
            unoptimized={true}
          />
        ) : (
          <div className="text-muted-foreground text-sm flex flex-col items-center gap-2">
            <ImageIcon className="h-8 w-8" />
            <p className="text-center px-4">
              Enter a URL and click capture to see the screenshot
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

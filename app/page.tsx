"use client";

import { useState } from "react";
import { ScreenshotForm } from "@/components/ScreenshotForm";
import { ScreenshotPreview } from "@/components/ScreenshotPreview";
import { ImageIcon } from "lucide-react";
import { ModeToggle } from "@/components/ToggleTheme";

export default function Home() {
  const [screenshot, setScreenshot] = useState<string | null>(null);

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <header className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-6 w-6 text-foreground" />
              <h1 className="text-xl font-medium text-foreground">Sitesnap</h1>
            </div>
            <ModeToggle />
          </div>
        </header>

        <div className="grid gap-8 md:grid-cols-[1fr_1.5fr] lg:grid-cols-[1fr_1.5fr]">
          <ScreenshotForm setScreenshot={setScreenshot} />
          <ScreenshotPreview screenshot={screenshot} />
        </div>
      </div>
    </main>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Laptop, Monitor, Smartphone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { showToast } from "@/lib/utils/toast";
import { useTheme } from "next-themes";
import Script from "next/script";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type Preset = { name: string; width: number; height: number };

interface Turnstile {
  render: (
    container: HTMLElement | string,
    options: {
      sitekey: string;
      theme?: "light" | "dark" | "auto";
      callback?: (token: string) => void;
      "error-callback"?: () => void;
    },
  ) => void;
  reset: (container: HTMLElement | string) => void;
  remove: (container: HTMLElement | string) => void;
}

declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

const presets: Preset[] = [
  { name: "iPhone 13 Pro", width: 390, height: 844 },
  { name: "iPhone 12", width: 390, height: 844 },
  { name: "Pixel 6", width: 412, height: 915 },
  { name: "Galaxy S21", width: 360, height: 800 },
  { name: "iPad", width: 768, height: 1024 },
  { name: "Desktop (Full HD)", width: 1920, height: 1080 },
];

type ScreenshotFormProps = {
  setScreenshot: (screenshot: string | null) => void;
};

export function ScreenshotForm({ setScreenshot }: ScreenshotFormProps) {
  const [url, setUrl] = useState("");
  const [width, setWidth] = useState(1920);
  const [height, setHeight] = useState(1080);
  const [delay, setDelay] = useState(0);
  const [fullPage, setFullPage] = useState(true);
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [turnstileLoaded, setTurnstileLoaded] = useState(false);
  const [device, setDevice] = useState<"mobile" | "tablet" | "desktop">(
    "desktop",
  );
  const turnstileRef = useRef<HTMLDivElement>(null);

  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const currentTurnstileRef = turnstileRef.current;
    if (turnstileLoaded && currentTurnstileRef && window.turnstile) {
      window.turnstile.render(currentTurnstileRef, {
        sitekey: process.env.NEXT_PUBLIC_CF_TURNSTILE_SITE_KEY!,
        theme: resolvedTheme === "dark" ? "dark" : "light",
        callback: (token: string) => {
          setCaptchaToken(token);
        },
        "error-callback": () => {
          showToast.error("Failed to load CAPTCHA. Please try again.");
          setTurnstileLoaded(false);
        },
      });

      return () => {
        if (currentTurnstileRef && window.turnstile) {
          window.turnstile.remove(currentTurnstileRef);
        }
      };
    }
  }, [turnstileLoaded, resolvedTheme]);

  const handlePresetChange = (value: string) => {
    const preset = presets.find((p) => p.name === value);
    if (preset) {
      setWidth(preset.width);
      setHeight(preset.height);
    }
  };

  const handleDeviceChange = (value: "mobile" | "tablet" | "desktop") => {
    if (value) {
      setDevice(value);
      if (value === "mobile") {
        setWidth(390);
        setHeight(844);
      } else if (value === "tablet") {
        setWidth(768);
        setHeight(1024);
      } else {
        setWidth(1920);
        setHeight(1080);
      }
    }
  };

  const validUrl = url.startsWith("http");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!captchaToken) {
      showToast.error("Please complete the CAPTCHA verification");
      return;
    }

    try {
      new URL(url);
    } catch {
      showToast.error("Please enter a valid URL (e.g., https://example.com)");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/screenshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          width,
          height,
          delay,
          fullPage,
          cfCaptchaToken: captchaToken,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to capture screenshot");
      }

      setScreenshot(data.image);
      showToast.success("Screenshot captured successfully!");
      // Reset CAPTCHA after successful submission
      setCaptchaToken(null);
      if (turnstileRef.current && window.turnstile) {
        window.turnstile.reset(turnstileRef.current);
      }
    } catch (error: unknown) {
      console.error("Screenshot error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Error capturing screenshot";
      showToast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="lazyOnload"
        onLoad={() => setTurnstileLoaded(true)}
        onError={() => {
          showToast.error(
            "Failed to load CAPTCHA script. Please check your network.",
          );
          setTurnstileLoaded(false);
        }}
      />
      <div className="space-y-6">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-2"
        >
          <Input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            required
          />
          <Button
            type="submit"
            disabled={loading || !captchaToken || !validUrl}
            className="bg-primary hover:bg-primary/90 w-full sm:w-auto mt-2 sm:mt-0"
          >
            {loading ? "Capturing..." : "Capture"}
          </Button>
        </form>

        <Tabs defaultValue="device" className="w-full min-h-[220px]">
          <TabsList className="grid w-full grid-cols-3 bg-muted">
            <TabsTrigger value="device">Device</TabsTrigger>
            <TabsTrigger value="dimensions">Dimensions</TabsTrigger>
            <TabsTrigger value="options">Options</TabsTrigger>
          </TabsList>
          <TabsContent value="device" className="space-y-4 pt-4">
            <div className="flex justify-center">
              <ToggleGroup
                type="single"
                value={device}
                onValueChange={handleDeviceChange}
                className="gap-0 w-full"
              >
                <ToggleGroupItem
                  value="mobile"
                  className="h-auto py-4 data-[state=on]:bg-primary data-[state=on]:text-white data-[state=on]:dark:text-black"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    <span className="text-xs">Mobile</span>
                  </div>
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="tablet"
                  className="h-auto py-4 data-[state=on]:bg-primary data-[state=on]:text-white data-[state=on]:dark:text-black"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Laptop className="h-5 w-5" />
                    <span className="text-xs">Tablet</span>
                  </div>
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="desktop"
                  className="h-auto py-4 data-[state=on]:bg-primary data-[state=on]:text-white data-[state=on]:dark:text-black"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    <span className="text-xs">Desktop</span>
                  </div>
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Preset</Label>
              <Select onValueChange={handlePresetChange}>
                <SelectTrigger className="border-muted w-full">
                  <SelectValue placeholder="Select a preset" />
                </SelectTrigger>
                <SelectContent>
                  {presets.map((preset) => (
                    <SelectItem key={preset.name} value={preset.name}>
                      {preset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
          <TabsContent value="dimensions" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="width"
                  className="text-sm text-muted-foreground"
                >
                  Width (px)
                </Label>
                <Input
                  id="width"
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  min={320}
                  max={3840}
                  className="border-muted"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="height"
                  className="text-sm text-muted-foreground"
                >
                  Height (px)
                </Label>
                <Input
                  id="height"
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  min={480}
                  max={2160}
                  className="border-muted"
                />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="options" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="delay" className="text-sm text-muted-foreground">
                Capture delay (seconds)
              </Label>
              <Input
                id="delay"
                type="number"
                value={delay}
                onChange={(e) => setDelay(Number(e.target.value))}
                min={0}
                max={10}
                className="border-muted"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label
                htmlFor="fullpage"
                className="text-sm text-muted-foreground"
              >
                Full page capture
              </Label>
              <Switch
                id="fullpage"
                checked={fullPage}
                onCheckedChange={setFullPage}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">
            Verify you're not a bot
          </Label>
          <Card className="p-4 flex justify-center items-center gap-4 min-h-[120px]">
            {turnstileLoaded ? (
              <div
                ref={turnstileRef}
                className="cf-turnstile"
                data-sitekey={process.env.NEXT_PUBLIC_CF_TURNSTILE_SITE_KEY}
                data-theme={resolvedTheme === "dark" ? "dark" : "light"}
              />
            ) : (
              <div className="text-muted-foreground text-sm">
                Loading CAPTCHA...
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

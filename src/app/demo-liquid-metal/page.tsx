import { LiquidMetalButton } from "@/components/ui/liquid-metal-button";

export default function LiquidMetalButtonDemo() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-8 p-8">
        <h1 className="text-3xl font-bold mb-8">Liquid Metal Button Demo</h1>

        <div className="flex items-center gap-8">
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-muted-foreground">Text Mode</p>
            <LiquidMetalButton label="Get Started" />
          </div>

          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-muted-foreground">Icon Mode</p>
            <LiquidMetalButton viewMode="icon" />
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 mt-8">
          <p className="text-sm text-muted-foreground">Custom Labels</p>
          <div className="flex gap-4">
            <LiquidMetalButton label="Sign Up" />
            <LiquidMetalButton label="Learn More" />
            <LiquidMetalButton label="Contact Us" />
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import React from "react";
import { EvervaultCard, Icon } from "@/components/ui/evervault-card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DemoEvervaultPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>

        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-4">Evervault Card Effect Demo</h1>
            <p className="text-muted-foreground max-w-2xl">
              The Evervault card effect has been integrated into the landing page feature cards
              and impact stats. Hover over the cards to see the dynamic matrix-like text
              effect that follows your cursor.
            </p>
          </div>

          {/* Original Demo Component */}
          <div className="border border-black/[0.2] dark:border-white/[0.2] flex flex-col items-start max-w-sm mx-auto p-4 relative h-[30rem]">
            <Icon className="absolute h-6 w-6 -top-3 -left-3 dark:text-white text-black" />
            <Icon className="absolute h-6 w-6 -bottom-3 -left-3 dark:text-white text-black" />
            <Icon className="absolute h-6 w-6 -top-3 -right-3 dark:text-white text-black" />
            <Icon className="absolute h-6 w-6 -bottom-3 -right-3 dark:text-white text-black" />

            <EvervaultCard text="hover" />

            <h2 className="dark:text-white text-black mt-4 text-sm font-light">
              Hover over this card to reveal an awesome effect. Running out of copy
              here.
            </h2>
            <p className="text-sm border font-light dark:border-white/[0.2] border-black/[0.2] rounded-full mt-4 text-black dark:text-white px-2 py-0.5">
              Watch me hover
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-6 space-y-4">
            <h2 className="text-2xl font-semibold">Integration Details</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li>✅ Evervault card component created with framer-motion</li>
              <li>✅ Applied to all feature cards in the Features section</li>
              <li>✅ Applied to impact statistics cards</li>
              <li>✅ Dynamic text generation on hover</li>
              <li>✅ Cursor-following gradient mask effect</li>
              <li>✅ Customized colors to match each card\'s accent</li>
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border-l-4 border-primary pl-4">
              <h3 className="font-semibold mb-2">Feature Cards</h3>
              <p className="text-sm text-muted-foreground">
                The 6 feature cards now include the Evervault effect with
                customized gradient colors matching their original accent colors.
              </p>
            </div>
            <div className="border-l-4 border-primary pl-4">
              <h3 className="font-semibold mb-2">Impact Stats</h3>
              <p className="text-sm text-muted-foreground">
                The 4 impact statistic cards feature a subtle version of the
                effect with numeric characters for a data-driven aesthetic.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
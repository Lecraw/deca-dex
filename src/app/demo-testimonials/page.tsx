'use client';

import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DemoTestimonialsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-8 py-8">
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
            <h1 className="text-4xl font-bold mb-4">Animated Testimonials Demo</h1>
            <p className="text-muted-foreground max-w-2xl">
              This page demonstrates the animated testimonials section that has been integrated
              into the landing page. The testimonials scroll continuously in columns, creating
              a dynamic and engaging display of student success stories.
            </p>
          </div>
        </div>
      </div>

      {/* Full Testimonials Section */}
      <TestimonialsSection />

      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="bg-muted/50 rounded-lg p-6 space-y-4">
          <h2 className="text-2xl font-semibold">Features</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li>✅ Continuous auto-scrolling animation using Motion</li>
            <li>✅ 12 authentic DECA student testimonials</li>
            <li>✅ 3-column responsive layout (1 on mobile, 2 on tablet, 3 on desktop)</li>
            <li>✅ Gradient mask for smooth fade-in/fade-out effect</li>
            <li>✅ Avatar images using DiceBear API</li>
            <li>✅ Different scroll speeds for visual interest</li>
            <li>✅ Bottom stats section with key metrics</li>
          </ul>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="border-l-4 border-primary pl-4">
            <h3 className="font-semibold mb-2">Animation Details</h3>
            <p className="text-sm text-muted-foreground">
              Each column scrolls at a different speed (15s, 19s, 17s) to create
              a dynamic, non-synchronized movement that keeps viewers engaged.
            </p>
          </div>
          <div className="border-l-4 border-primary pl-4">
            <h3 className="font-semibold mb-2">Testimonial Content</h3>
            <p className="text-sm text-muted-foreground">
              All testimonials are DECA-specific, featuring various competition
              categories (EIB, ESB, PMCD, etc.) and authentic student experiences.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
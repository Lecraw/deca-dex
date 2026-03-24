'use client';

import { SplineSceneBasic } from "@/components/ui/spline-demo";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Demo3DPage() {
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
            <h1 className="text-4xl font-bold mb-4">3D Spline Integration Demo</h1>
            <p className="text-muted-foreground max-w-2xl">
              This page demonstrates the interactive 3D Spline scene integration.
              The 3D scene is now live on the main landing page hero section,
              providing an immersive experience for visitors.
            </p>
          </div>

          {/* Demo Component */}
          <SplineSceneBasic />

          <div className="bg-muted/50 rounded-lg p-6 space-y-4">
            <h2 className="text-2xl font-semibold">Integration Details</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li>✅ Spline 3D library installed and configured</li>
              <li>✅ Custom loading state with 3D spinner animation</li>
              <li>✅ Responsive design for mobile and desktop</li>
              <li>✅ Spotlight effect for visual enhancement</li>
              <li>✅ Integrated into the main hero section</li>
              <li>✅ Dark/light theme compatibility</li>
            </ul>
          </div>

          <div className="border-l-4 border-primary pl-4">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> The Spline scene URL can be customized by replacing the URL in the
              SplineScene component. You can create your own 3D scenes at{" "}
              <a href="https://spline.design" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                spline.design
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
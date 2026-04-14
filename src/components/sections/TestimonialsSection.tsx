"use client";
import { TestimonialsColumn } from "@/components/ui/testimonials-columns";
import { motion } from "motion/react";
import { testimonials } from "@/lib/testimonials-data";

const firstColumn = testimonials.slice(0, 4);
const secondColumn = testimonials.slice(4, 8);
const thirdColumn = testimonials.slice(8, 12);

export const TestimonialsSection = () => {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 grid-bg opacity-10 dark:opacity-20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[600px] bg-[radial-gradient(ellipse,oklch(0.42_0.18_255/0.04)_0%,transparent_55%)] pointer-events-none" />

      <div className="container z-10 mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center max-w-[540px] mx-auto"
        >
          <div className="flex justify-center">
            <div className="text-[11px] font-mono text-primary uppercase tracking-[0.2em] border border-primary/15 bg-primary/5 py-1 px-4 rounded-lg">
              Testimonials
            </div>
          </div>

          <h2 className="text-3xl md:text-5xl font-bold tracking-[-0.03em] mt-5 text-center">
            Students Love Nexari
          </h2>
          <p className="text-center mt-4 text-muted-foreground text-[15px] max-w-md">
            Join thousands of DECA competitors who've transformed their projects and won competitions with Nexari.
          </p>
        </motion.div>

        {/* Testimonials columns with gradient mask */}
        <div className="flex justify-center gap-6 mt-16 [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)] max-h-[740px] overflow-hidden">
          <TestimonialsColumn
            testimonials={firstColumn}
            duration={15}
          />
          <TestimonialsColumn
            testimonials={secondColumn}
            className="hidden md:block"
            duration={19}
          />
          <TestimonialsColumn
            testimonials={thirdColumn}
            className="hidden lg:block"
            duration={17}
          />
        </div>

        {/* Bottom stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="flex justify-center items-center gap-8 mt-16 pt-8 border-t border-border/30"
        >
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">4.9/5</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Avg Rating</div>
          </div>
          <div className="w-px h-8 bg-border/30" />
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">340+</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Competition Wins</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
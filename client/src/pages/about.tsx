import { motion } from "framer-motion";
import { ArrowLeft, Mail, Linkedin, Twitter, Instagram } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import elikemPhoto from "@assets/Ps._Elikem_Aflakpui_1767385677540.jpg";

export default function About() {
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/10">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md py-4">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-70 transition-opacity">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm tracking-widest uppercase font-medium">Back to Home</span>
          </Link>
          <span className="text-xl tracking-widest font-serif font-bold uppercase text-primary">
            Elikem Aflakpui
          </span>
        </div>
      </nav>

      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            {/* Image Column */}
            <div className="lg:col-span-5 sticky top-32">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="relative"
              >
                <div className="aspect-[3/4] overflow-hidden bg-muted">
                  <img 
                    src={elikemPhoto} 
                    alt="Elikem Aflakpui" 
                    className="w-full h-full object-cover grayscale object-[35%_top] scale-125"
                  />
                </div>
                <div className="absolute -bottom-6 -right-6 w-full h-full border border-primary/20 -z-10"></div>
              </motion.div>

              <motion.div 
                {...fadeIn}
                className="mt-12 flex gap-6 text-muted-foreground"
              >
                <a href="#" className="hover:text-primary transition-colors"><Linkedin className="h-5 w-5" /></a>
                <a href="#" className="hover:text-primary transition-colors"><Twitter className="h-5 w-5" /></a>
                <a href="#" className="hover:text-primary transition-colors"><Instagram className="h-5 w-5" /></a>
                <a href="mailto:hello@elikem-aflakpui.com" className="hover:text-primary transition-colors"><Mail className="h-5 w-5" /></a>
              </motion.div>
            </div>

            {/* Content Column */}
            <div className="lg:col-span-7 space-y-12">
              <motion.div {...fadeIn} className="space-y-6">
                <h1 className="text-5xl md:text-6xl font-serif text-primary leading-tight">
                  The Intersection of Faith, Data, and Words
                </h1>
                <p className="text-xl text-muted-foreground font-light italic font-serif">
                  "Faith provides the anchor, analysis provides the path, and writing provides the voice for legacy."
                </p>
              </motion.div>

              <motion.div {...fadeIn} className="prose prose-lg max-w-none text-muted-foreground space-y-6 font-light leading-relaxed">
                <p>
                  Elikem Aflakpui is a multifaceted leader whose life's work is dedicated to the pursuit of truth—whether through spiritual revelation, analytical precision, or narrative clarity. Based in Ghana, he serves as a dynamic bridge between traditional wisdom and modern innovation.
                </p>

                <div className="space-y-4">
                  <h3 className="text-2xl font-serif text-primary font-normal">Spiritual Leadership</h3>
                  <p>
                    As a Pastor, Elikem is known for his ability to translate ancient spiritual principles into practical, lived experiences for a contemporary generation. His ministry is characterized by "Faith at the Core"—a belief that all true success and peace begin with a deep, unwavering spiritual foundation.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-2xl font-serif text-primary font-normal">Analytical Rigor</h3>
                  <p>
                    In his professional capacity as a Data Analyst, Elikem brings "Insight in the Lead." He understands that in a world drowning in information, clarity is the ultimate competitive advantage. By leveraging data, he helps organizations and individuals see through the noise, making strategic decisions grounded in evidence and foresight.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-2xl font-serif text-primary font-normal">Creative Expression</h3>
                  <p>
                    As a Writer, Elikem is focused on "Impact as the Legacy." He believes that stories and ideas are the most enduring human currency. Through his writing, he distills complex philosophical and analytical concepts into accessible, transformative narratives that challenge readers to think deeper and live more purposefully.
                  </p>
                </div>

                <p>
                  Whether he is standing behind a pulpit, sitting behind a dataset, or hunched over a keyboard, Elikem's mission remains singular: to empower people to bridge the gap between their current reality and their God-given potential.
                </p>
              </motion.div>

              <motion.div {...fadeIn} className="pt-8">
                <Button className="rounded-none px-8 py-6 text-base tracking-widest uppercase bg-primary hover:bg-primary/90 text-white shadow-lg transition-all">
                  Collaborate with Elikem
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

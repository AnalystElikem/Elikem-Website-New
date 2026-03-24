import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Mail, Menu, Instagram, Twitter, Linkedin, Facebook } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import heroBg from "@assets/generated_images/minimalist_serene_light_abstract_background_with_soft_light.png";
import pastorIcon from "@assets/EA_Pastor_Icon_(1)_1767383792177.png";
import writerIcon from "@assets/EA_Writer_Icon_(1)_1767383792179.png";
import analystIcon from "@assets/EA_Data_Analyst_icon_1767384265979.png";
import elikemPhoto from "@assets/Ps._Elikem_Aflakpui_1767385677540.jpg";

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const stagger = {
    animate: {
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/10">
      {/* Navigation */}
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? "bg-white/80 backdrop-blur-md shadow-sm py-4" : "bg-transparent py-6"
        }`}
      >
        <div className="container mx-auto px-6 flex justify-between items-center">
          <a href="#" className="text-xl tracking-widest font-serif font-bold uppercase text-primary">
            Elikem Aflakpui
          </a>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8 text-sm tracking-widest uppercase text-muted-foreground">
            <a href="#about" className="hover:text-primary transition-colors">About</a>
            <a href="#expertise" className="hover:text-primary transition-colors">Expertise</a>
            <a href="#writing" className="hover:text-primary transition-colors">Writing</a>
            <a href="#contact" className="hover:text-primary transition-colors">Contact</a>
            <Button variant="outline" className="ml-4 border-primary text-primary hover:bg-primary hover:text-white transition-colors rounded-none px-6">
              Book Elikem
            </Button>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="flex flex-col gap-6 mt-10 text-lg font-serif">
                  <a href="#about" className="hover:text-primary transition-colors">About</a>
                  <a href="#expertise" className="hover:text-primary transition-colors">Expertise</a>
                  <a href="#writing" className="hover:text-primary transition-colors">Writing</a>
                  <a href="#contact" className="hover:text-primary transition-colors">Contact</a>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroBg} 
            alt="Background" 
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px]"></div>
        </div>

        <div className="container relative z-10 px-6 pt-20 text-center max-w-4xl mx-auto">
          <motion.div 
            initial="initial"
            animate="animate"
            variants={stagger}
            className="flex flex-col items-center gap-6"
          >
            <motion.p 
              variants={fadeIn}
              className="text-xs md:text-sm tracking-[0.3em] uppercase text-muted-foreground font-medium"
            >
              Pastor • Data Analyst • Writer
            </motion.p>
            
            <motion.h1 
              variants={fadeIn}
              className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-serif text-primary leading-tight"
            >
              Elikem Aflakpui
            </motion.h1>

            <motion.div variants={fadeIn} className="w-24 h-px bg-primary/20 my-4"></motion.div>

            <motion.p 
              variants={fadeIn}
              className="text-lg md:text-2xl text-muted-foreground font-light italic font-serif max-w-2xl leading-relaxed"
            >
              "Faith at the core, insight in the lead and impact as the legacy."
            </motion.p>

            <motion.div variants={fadeIn} className="mt-8">
              <Button size="lg" className="rounded-none px-8 py-6 text-base tracking-widest uppercase bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                Start the Journey
              </Button>
            </motion.div>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-primary/40 animate-bounce"
        >
          <ArrowRight className="h-6 w-6 rotate-90" />
        </motion.div>
      </section>

      <section id="about" className="py-20 md:py-32 bg-white overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="aspect-[3/4] overflow-hidden bg-muted relative">
                <img 
                  src={elikemPhoto} 
                  alt="Elikem Aflakpui" 
                  className="w-full h-full object-cover grayscale transition-all duration-700 object-[35%_top] scale-125"
                />
                <div className="absolute -bottom-6 -right-6 w-full h-full border border-primary/20 -z-10"></div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <h2 className="text-4xl md:text-5xl font-serif text-primary">A Multifaceted Journey</h2>
              <p className="text-lg text-muted-foreground leading-relaxed font-light">
                Elikem Aflakpui occupies the unique intersection of spiritual leadership, analytical rigor, and creative expression. 
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed font-light">
                As a Pastor, he grounds individuals in faith; as a Data Analyst, he provides the clarity needed for strategic growth; and as a Writer, he distills complex truths into impactful narratives.
              </p>
              
              <div className="pt-4">
                <Link href="/about">
                  <Button variant="link" className="p-0 h-auto text-primary text-lg underline-offset-4 hover:underline group cursor-pointer">
                    Read Full Bio <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Core Values / Pillars with Custom Icons */}
      <section id="expertise" className="py-20 md:py-24 bg-muted/30">
        <div className="container mx-auto px-6 text-center mb-12 md:mb-16">
          <p className="text-xs sm:text-sm tracking-widest uppercase text-muted-foreground mb-4">Core Areas</p>
          <h2 className="text-3xl md:text-5xl font-serif text-primary">Expertise & Service</h2>
        </div>
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {[
              {
                customIcon: pastorIcon,
                title: "Pastor",
                description: "Spiritual guidance and community leadership focused on heart-centered service and faith."
              },
              {
                customIcon: analystIcon,
                title: "Data Analyst",
                description: "Leveraging analytical insights to drive strategic decisions and professional excellence."
              },
              {
                customIcon: writerIcon,
                title: "Writer",
                description: "Crafting narratives that inspire change, distill truth, and leave a lasting legacy."
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
                className="group p-8 bg-white border border-border/50 hover:border-primary/20 hover:shadow-lg transition-all duration-300 text-center space-y-6"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300 overflow-hidden">
                  <img src={item.customIcon} alt={item.title} className="w-10 h-10 object-contain invert group-hover:invert-0 transition-all" />
                </div>
                <h3 className="text-2xl font-serif text-primary">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed font-light">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote / Break */}
      <section className="py-32 bg-primary text-primary-foreground text-center px-6">
        <div className="container mx-auto max-w-4xl">
          <BookOpen className="h-8 w-8 mx-auto mb-8 text-white/40" />
          <h2 className="text-3xl md:text-5xl font-serif leading-tight italic">
            "Faith provides the anchor, analysis provides the path, and writing provides the voice for legacy."
          </h2>
          <p className="mt-8 text-white/60 tracking-widest uppercase text-sm">— Elikem Aflakpui</p>
        </div>
      </section>

      {/* Latest Writings */}
      <section id="writing" className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-end mb-16">
            <div>
              <p className="text-sm tracking-widest uppercase text-muted-foreground mb-4">Journal</p>
              <h2 className="text-4xl font-serif text-primary">Latest Thoughts</h2>
            </div>
            <Link href="/downloads">
              <Button variant="outline" className="hidden md:flex border-primary text-primary hover:bg-primary hover:text-white rounded-none cursor-pointer">
                View All
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-none shadow-none group cursor-pointer bg-transparent">
                <div className="aspect-[16/10] bg-muted mb-6 overflow-hidden">
                  <div className="w-full h-full bg-muted-foreground/10 group-hover:scale-105 transition-transform duration-500"></div>
                </div>
                <CardContent className="p-0 space-y-3">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{i === 1 ? "Leadership" : i === 2 ? "Data" : "Faith"} • Jan 0{i}, 2026</p>
                  <h3 className="text-2xl font-serif text-primary group-hover:underline decoration-1 underline-offset-4">
                    {i === 1 ? "The Intersection of Data and Faith" : i === 2 ? "Analytic Integrity in Leadership" : "Writing Your Own Legacy"}
                  </h3>
                  <p className="text-muted-foreground line-clamp-2 font-light">
                    {i === 1 ? "How spiritual principles can provide a moral framework for data science." : i === 2 ? "Using metrics to better serve your community and organization." : "The power of storytelling in creating long-term impact."}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 flex justify-center md:hidden">
            <Link href="/downloads">
              <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white rounded-none cursor-pointer">
                View All
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer / Contact */}
      <section id="contact" className="bg-white py-20 md:py-24 border-t border-border">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center text-center space-y-12 md:space-y-16">
            {/* Main CTA */}
            <div className="max-w-2xl">
              <h2 className="text-4xl md:text-5xl font-serif text-primary mb-6">Let's Connect</h2>
              <p className="text-lg text-muted-foreground font-light">
                Inquiries for data consultations, pastoral care, or writing collaborations are always welcome.
              </p>
            </div>

            {/* Email */}
            <a 
              href="mailto:hello@elikem-aflakpui.com" 
              className="group flex items-center gap-3 px-6 py-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-all duration-300"
            >
              <Mail className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
              <span className="text-primary font-medium tracking-wide">hello@elikem-aflakpui.com</span>
            </a>

            {/* Social Media Icons */}
            <div className="flex gap-4 pt-4">
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center justify-center w-12 h-12 rounded-full bg-muted hover:bg-primary hover:text-white transition-all duration-300 text-muted-foreground hover:scale-110"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center justify-center w-12 h-12 rounded-full bg-muted hover:bg-primary hover:text-white transition-all duration-300 text-muted-foreground hover:scale-110"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center justify-center w-12 h-12 rounded-full bg-muted hover:bg-primary hover:text-white transition-all duration-300 text-muted-foreground hover:scale-110"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center justify-center w-12 h-12 rounded-full bg-muted hover:bg-primary hover:text-white transition-all duration-300 text-muted-foreground hover:scale-110"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
            </div>

            {/* Divider */}
            <div className="w-16 h-px bg-border"></div>

            {/* Copyright */}
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Elikem Aflakpui. All rights reserved.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

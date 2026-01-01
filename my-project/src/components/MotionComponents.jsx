import React, { useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

// 1. Noise Overlay
export const NoiseOverlay = () => (
  <div className="fixed inset-0 z-[1] pointer-events-none opacity-[0.03] mix-blend-overlay">
    <svg className="w-full h-full">
      <filter id="noiseFilter">
        <feTurbulence type="fractalNoise" baseFrequency="0.80" numOctaves="3" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#noiseFilter)" />
    </svg>
  </div>
);

// 2. Custom Cursor
export const CustomCursor = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const mouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      const target = e.target;
      if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('button') || target.closest('a') || target.closest('.clickable')) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };
    window.addEventListener("mousemove", mouseMove);
    return () => window.removeEventListener("mousemove", mouseMove);
  }, []);

  return (
    <motion.div
      className="fixed top-0 left-0 w-8 h-8 rounded-full border border-[#D4AF37] pointer-events-none z-[9999] hidden md:flex items-center justify-center mix-blend-difference"
      animate={{
        x: mousePos.x - 16,
        y: mousePos.y - 16,
        scale: isHovering ? 2 : 1,
        backgroundColor: isHovering ? "#D4AF37" : "transparent",
      }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
    />
  );
};

// 3. Animated Title
export const AnimatedTitle = ({ text, className }) => {
  const words = text.split(" ");
  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.04 * i },
    }),
  };
  const child = {
    visible: { opacity: 1, y: 0, transition: { type: "spring", damping: 12, stiffness: 100 } },
    hidden: { opacity: 0, y: 50, transition: { type: "spring", damping: 12, stiffness: 100 } },
  };

  return (
    <motion.h1 variants={container} initial="hidden" animate="visible" className={`flex flex-wrap ${className}`}>
      {words.map((word, index) => (
        <motion.div key={index} className="inline-block whitespace-nowrap mr-[0.25em] last:mr-0" variants={container}>
          {Array.from(word).map((letter, i) => (
            <motion.span variants={child} key={i} className="inline-block">{letter}</motion.span>
          ))}
        </motion.div>
      ))}
    </motion.h1>
  );
};

// 4. Reveal On Scroll
export const RevealOnScroll = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

// 5. Tilt Card
export const TiltCard = ({ children }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-100, 100], [10, -10]));
  const rotateY = useSpring(useTransform(x, [-100, 100], [-10, 10]));

  function handleMouseMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct * 200);
    y.set(yPct * 200);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className="relative w-full h-full flex items-center justify-center perspective-1000 group"
    >
      <div className="absolute inset-0 bg-[#D4AF37]/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      {children}
    </motion.div>
  );
};
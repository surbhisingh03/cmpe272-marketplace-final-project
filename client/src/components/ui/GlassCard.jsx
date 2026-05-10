import { motion } from "framer-motion";

export default function GlassCard({
  className = "",
  children,
  glow = false,
  delay = 0,
  hover = true,
  ...props
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay }}
      whileHover={
        hover
          ? { y: -4, scale: 1.008, transition: { type: "spring", stiffness: 320, damping: 26 } }
          : undefined
      }
      className={`relative rounded-2xl overflow-hidden ${className}`}
      {...props}
    >
      {glow && (
        <div
          className="pointer-events-none absolute -inset-[1px] rounded-2xl opacity-70 blur-xl"
          style={{
            background:
              "linear-gradient(120deg, rgba(124,58,237,.45), rgba(6,182,212,.38), rgba(236,72,153,.38))",
          }}
        />
      )}
      <div className={`relative rounded-2xl glass glass-strong ${glow ? "border-white/20" : ""}`}>
        {children}
      </div>
    </motion.div>
  );
}

import { motion } from "framer-motion";

/**
 * @param {"light" | "glass"} surface — `light` matches Landing cards; `glass` for dark / admin login panels.
 */
export default function GlassCard({
  className = "",
  children,
  glow = false,
  delay = 0,
  hover = true,
  surface = "light",
  ...props
}) {
  const isGlass = surface === "glass";

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
      className={`relative overflow-hidden rounded-2xl ${className}`}
      {...props}
    >
      {glow && isGlass ? (
        <div
          className="pointer-events-none absolute -inset-[1px] rounded-2xl opacity-70 blur-xl"
          style={{
            background:
              "linear-gradient(120deg, rgba(124,58,237,.45), rgba(6,182,212,.38), rgba(236,72,153,.38))",
          }}
        />
      ) : null}
      <div
        className={
          isGlass
            ? `relative rounded-2xl glass glass-strong ${glow ? "border-white/20" : ""}`
            : "relative rounded-2xl border border-slate-200/90 bg-white shadow-[0_12px_40px_-28px_rgba(15,23,42,0.1)]"
        }
      >
        {children}
      </div>
    </motion.div>
  );
}

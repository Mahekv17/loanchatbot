import { motion } from "framer-motion";

interface AnimatedLoaderProps {
  type?: "dots" | "circle" | "pulse";
}

export const AnimatedLoader = ({ type = "dots" }: AnimatedLoaderProps) => {
  if (type === "circle") {
    return (
      <div className="flex items-center justify-center gap-1">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-primary"
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
            }}
            animate={{
              x: [0, Math.cos((i * Math.PI) / 3) * 16],
              y: [0, Math.sin((i * Math.PI) / 3) * 16],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.1,
            }}
          />
        ))}
      </div>
    );
  }

  if (type === "pulse") {
    return (
      <motion.div
        className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
        }}
      >
        <motion.div
          className="w-8 h-8 rounded-full bg-primary"
          animate={{
            scale: [1, 0.8, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
          }}
        />
      </motion.div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-3 h-3 rounded-full bg-primary"
          animate={{
            y: [0, -10, 0],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
          }}
        />
      ))}
    </div>
  );
};

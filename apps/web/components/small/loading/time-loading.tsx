import { useEffect, useRef, useState } from "react";

const clockSize = 64;

function AnimatedClock() {
  const handRef = useRef<SVGLineElement>(null);
  const [speed, setSpeed] = useState(1); // multiplier for speed

  useEffect(() => {
    let frame: number;
    let start: number | null = null;
    let currentSpeed = 1;

    const animate = (timestamp: number) => {
      if (start === null) start = timestamp;
      // Every 2 seconds, increase speed a bit (up to a max)
      const elapsed = (timestamp - start) / 1000;
      // Speed increases smoothly, capped at 8x
      currentSpeed = Math.min(1 + elapsed * 0.25, 8);
      setSpeed(currentSpeed);

      // The hand rotates faster as speed increases
      const now = new Date();
      const seconds = now.getSeconds() + now.getMilliseconds() / 1000;
      // Multiply seconds by speed for faster rotation
      const fastSeconds = seconds * currentSpeed;
      const angle = (fastSeconds % 60) / 60 * 360;

      if (handRef.current) {
        handRef.current.setAttribute(
          "transform",
          `rotate(${angle} ${clockSize / 2} ${clockSize / 2})`
        );
      }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <svg
      width={clockSize}
      height={clockSize}
      viewBox={`0 0 ${clockSize} ${clockSize}`}
      className="animate-fade-in"
    >
      <circle
        cx={clockSize / 2}
        cy={clockSize / 2}
        r={clockSize / 2 - 4}
        fill="none"
        stroke="var(--brand-primary, #7c3aed)"
        strokeWidth="3"
        className="opacity-80"
      />
      <circle
        cx={clockSize / 2}
        cy={clockSize / 2}
        r={clockSize / 2 - 10}
        fill="none"
        stroke="var(--brand-primary, #7c3aed)"
        strokeWidth="1"
        strokeDasharray="4 4"
        className="opacity-40"
      />
      <line
        ref={handRef}
        x1={clockSize / 2}
        y1={clockSize / 2}
        x2={clockSize / 2}
        y2={clockSize / 2 - 22}
        stroke="var(--brand-primary, #7c3aed)"
        strokeWidth="3"
        strokeLinecap="round"
        className="drop-shadow"
      />
      <circle
        cx={clockSize / 2}
        cy={clockSize / 2}
        r="4"
        fill="var(--brand-primary, #7c3aed)"
        className="animate-pulse"
      />
    </svg>
  );
}

export default function TimeLoading() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-[var(--background)]">
      <AnimatedClock />
    </div>
  );
}
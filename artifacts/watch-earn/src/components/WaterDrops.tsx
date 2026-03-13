export function WaterDrops() {
  // Generate random drops
  const drops = Array.from({ length: 15 }).map((_, i) => {
    const size = Math.random() * 20 + 5; // 5px to 25px
    const left = Math.random() * 100; // 0% to 100%
    const duration = Math.random() * 12 + 8; // 8s to 20s
    const delay = Math.random() * -20; // Start immediately but staggered
    const opacity = Math.random() * 0.3 + 0.1; // 0.1 to 0.4
    const blur = Math.random() * 2 + 1; // 1px to 3px

    return (
      <div
        key={i}
        className="water-drop z-0"
        style={{
          width: `${size}px`,
          height: `${size * 1.2}px`, // slightly elongated
          left: `${left}%`,
          animationDuration: `${duration}s`,
          animationDelay: `${delay}s`,
          opacity: opacity,
          filter: `blur(${blur}px)`,
        }}
      />
    );
  });

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {drops}
    </div>
  );
}

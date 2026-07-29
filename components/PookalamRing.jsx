const COLORS = ["#c99a2e", "#7a1f2b", "#1f5c3d", "#e8a93b"];

export default function PookalamRing({ size = 32 }) {
  const center = size / 2;
  const petals = 8;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="ring">
      <circle cx={center} cy={center} r={size * 0.16} fill="#e8a93b" />
      {Array.from({ length: petals }).map((_, i) => {
        const angle = (i / petals) * Math.PI * 2;
        const r = size * 0.32;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        return (
          <circle key={i} cx={x} cy={y} r={size * 0.13} fill={COLORS[i % COLORS.length]} />
        );
      })}
    </svg>
  );
}

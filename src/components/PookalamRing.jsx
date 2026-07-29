export default function PookalamRing({ size = 30 }) {
  return (
    <svg
      className="ring"
      width={size}
      height={size}
      viewBox="0 0 40 40"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="20" cy="20" r="18" fill="none" stroke="#c99a2e" strokeWidth="2" />
      <circle cx="20" cy="20" r="12" fill="none" stroke="#7a1f2b" strokeWidth="2" />
      <circle cx="20" cy="20" r="6" fill="#e8a93b" stroke="#7a1f2b" strokeWidth="1.5" />
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * Math.PI * 2) / 8;
        const x = 20 + 15 * Math.cos(angle);
        const y = 20 + 15 * Math.sin(angle);
        return <circle key={i} cx={x} cy={y} r="2.2" fill="#1f5c3d" />;
      })}
    </svg>
  );
}

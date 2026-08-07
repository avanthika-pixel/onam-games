export default function Logo({ size = 32 }) {
  return (
    <img
      src="/dn-logo.png"
      alt="DynamicNext"
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.22,
        display: "block",
        objectFit: "cover",
        flexShrink: 0,
      }}
    />
  );
}

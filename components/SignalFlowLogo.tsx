export function SignalFlowLogo({
  size = 44,
  showWordmark = false,
}: {
  size?: number;
  showWordmark?: boolean;
}) {
  if (showWordmark) {
    return (
      <img
        src="/brand/signal_flow_primary_logo_dark.png"
        alt="SIGNAL//FLOW"
        className="h-auto object-contain"
        style={{ width: Math.max(180, size * 4) }}
      />
    );
  }

  return (
    <img
      src="/brand/signal_flow_icon_transparent_light.png"
      alt="S//F"
      className="object-contain"
      style={{ width: size, height: size }}
    />
  );
}

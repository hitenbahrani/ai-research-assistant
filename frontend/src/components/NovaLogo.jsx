import logo from "../assets/nova-logo.png";

export default function NovaLogo({ size = 40 }) {
  return (
    <img
      src={logo}
      alt="Nova Logo"
      style={{
        width: size,
        height: size,
      }}
      className="rounded-xl object-contain"
    />
  );
}
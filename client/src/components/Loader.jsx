export default function Loader({ label = "Loading..." }) {
  return (
    <div className="flex items-center gap-3 py-8 text-sm text-slate-500" role="status">
      <span className="loader" />
      {label}
    </div>
  );
}

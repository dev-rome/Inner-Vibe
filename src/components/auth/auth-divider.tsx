export function AuthDivider() {
  return (
    <div className="flex items-center gap-3" role="presentation">
      <span className="bg-line h-px flex-1" />
      <span className="text-subtle text-xs">or</span>
      <span className="bg-line h-px flex-1" />
    </div>
  );
}

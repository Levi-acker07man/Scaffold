"use client";

export function AmbientBackground() {
  return (
    <div className="ambient" aria-hidden="true">
      <div
        className="ambient-image"
        style={{
          backgroundImage: "url('/Fantasy-Autumn.png')",
        }}
      />
    </div>
  );
}

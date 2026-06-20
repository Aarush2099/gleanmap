// Original PGC horizontal logo (sourced from projectgreenchallenge.com).
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center ${className}`}>
      <img
        src="https://projectgreenchallenge.com/wp-content/themes/PGC/assets/img/PGChallenge_HorizontalLogo_RGB_2.svg"
        alt="Project Green Challenge"
        className="h-9 w-auto"
        loading="eager"
      />
    </span>
  );
}

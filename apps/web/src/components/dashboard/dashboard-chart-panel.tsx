import { ChartCard } from "@/components/data/chart-card";

type DashboardChartPanelProps = {
  title: string;
  points?: number[];
  xLabels?: string[];
  height?: "compact" | "large";
  message?: string;
};

export function DashboardChartPanel({
  title,
  points,
  xLabels = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"],
  height = "compact",
  message = "Chart history is unavailable in the local data.",
}: DashboardChartPanelProps) {
  const chartHeight = height === "large" ? "h-[300px]" : "h-[220px]";
  const max = Math.max(1, ...(points ?? []));
  const yAxisValues = [0, 1, 2, 3, 4].map((line) => Math.round(max * (1 - line / 4)));
  const yAxisLabels = yAxisValues.map((value, index) =>
    index === 0 || value !== yAxisValues[index - 1] ? value.toLocaleString() : "",
  );
  const polyline = points?.length
    ? points
        .map((point, index) => {
          const x = points.length === 1 ? 500 : (index / (points.length - 1)) * 1000;
          const y = 190 - (Math.max(0, point) / max) * 170;
          return `${x},${y}`;
        })
        .join(" ")
    : "";

  return (
    <ChartCard title={title} className="px-5 pt-9 pb-5">
      <div className={`relative mt-4 ${chartHeight}`}>
        <div className="absolute inset-y-3 left-[68px] right-0 flex flex-col justify-between">
          {[0, 1, 2, 3, 4].map((line) => (
            <div key={line} className="relative border-t border-grid-line">
              {points?.length && yAxisLabels[line] ? (
                <span className="absolute -left-[62px] -top-2 w-[54px] text-right fs-text leading-none text-axis">
                  {yAxisLabels[line]}
                </span>
              ) : null}
            </div>
          ))}
        </div>
        {points?.length ? (
          <svg
            aria-label={`${title} local data trend`}
            className="absolute inset-y-3 left-[68px] h-[calc(100%-12px)] w-[calc(100%-68px)] overflow-visible"
            viewBox="0 0 1000 200"
            preserveAspectRatio="none"
            role="img"
          >
            <polyline
              points={polyline}
              fill="none"
              stroke="var(--primary)"
              strokeWidth="3"
              vectorEffect="non-scaling-stroke"
            />
            {points.map((point, index) => {
              const x = points.length === 1 ? 500 : (index / (points.length - 1)) * 1000;
              const y = 190 - (Math.max(0, point) / max) * 170;
              return <circle key={index} cx={x} cy={y} r="4" fill="var(--primary)" />;
            })}
          </svg>
        ) : (
          <p className="absolute inset-0 grid place-items-center fs-text text-muted-foreground">
            {message}
          </p>
        )}
        <div className="absolute bottom-0 left-[68px] right-0 flex justify-between gap-1 fs-text text-axis">
          {xLabels.map((label, index) => (
            <span key={`${label}-${index}`} className="min-w-0 truncate text-center">
              {label}
            </span>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}

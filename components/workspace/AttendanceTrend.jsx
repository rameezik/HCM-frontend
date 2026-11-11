"use client";

export default function AttendanceTrend({ rows }) {
  if (!rows?.length) return null;
  const maximum = Math.max(
    1,
    ...rows.map((row) => row.present + row.absent + row.onLeave),
  );
  const width = 700,
    height = 160,
    x = (index) => 20 + (index * 660) / Math.max(1, rows.length - 1),
    y = (value) => 140 - (value / maximum) * 120;
  return (
    <figure className="mb-5">
      <svg
        role="img"
        aria-label="Attendance trend: present in cyan, absent in rose. Exact daily values are in the table below."
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
      >
        <path d="M20 20V140H680" fill="none" stroke="#292934" />
        {[
          ["present", "#4bb8dc"],
          ["absent", "#ff2d95"],
        ].map(([key, color]) => (
          <g key={key}>
            <polyline
              points={rows.map((row, i) => `${x(i)},${y(row[key])}`).join(" ")}
              fill="none"
              stroke={color}
              strokeWidth="2.5"
            />
            {rows.map((row, i) => (
              <circle
                key={row.date}
                cx={x(i)}
                cy={y(row[key])}
                r="3"
                fill={color}
              >
                <title>{`${row.date}: ${row[key]} ${key}`}</title>
              </circle>
            ))}
          </g>
        ))}
      </svg>
      <figcaption className="flex justify-between text-xs text-zinc-400">
        <span>{rows[0].date}</span>
        <span>
          <span className="text-[#4bb8dc]">Present</span> /{" "}
          <span className="text-[#ff2d95]">Absent</span>
        </span>
        <span>{rows.at(-1).date}</span>
      </figcaption>
    </figure>
  );
}

export default function DataTable({ columns, emptyMessage = "No records to display.", rows = [] }) {
  return (
    <div className="overflow-x-auto rounded-md border border-white/10">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-white/5 text-xs uppercase text-white/60">
          <tr>
            {columns.map((column) => (
              <th className="px-4 py-3 font-medium" key={column.key} scope="col">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {rows.length ? (
            rows.map((row, rowIndex) => (
              <tr className="text-white/85" key={row.id ?? rowIndex}>
                {columns.map((column) => (
                  <td className="px-4 py-3" key={column.key}>
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td className="px-4 py-8 text-center text-white/55" colSpan={columns.length}>
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
interface SkeletonTableProps {
  rows?: number
  cols: number[]
}

export default function SkeletonTable({ rows = 4, cols }: SkeletonTableProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <tr key={rowIdx}>
          {cols.map((width, colIdx) => (
            <td key={colIdx}>
              <div
                className="skeleton h-4 rounded"
                style={{ width: `${width}%` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

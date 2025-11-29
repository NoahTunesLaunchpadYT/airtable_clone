// app/[baseId]/[tableId]/page.tsx

import { api } from "~/trpc/server"
import TableShell from "~/app/[baseId]/_components/TableShell"

export default async function TablePage({
  params,
}: {
  params: Promise<{ baseId: string; tableId: string }>
}) {
  const { baseId, tableId } = await params

  const base = await api.base.getBaseById({ baseId })
  const tables = await api.base.getTablesForBase({ baseId })
  const cols = await api.table.getColumns({ tableId })

  if (!tables || tables.length === 0) {
    return <div className="p-4">No tables in this base</div>
  }

  return (
    <TableShell
      baseId={baseId}
      tableId={tableId}
      tables={tables}
      columnsMeta={cols}
      baseName={base.name}
      baseColor={base.color}
    />
  )
}

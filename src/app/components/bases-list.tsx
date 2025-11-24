"use client";

import { api } from "~/trpc/react";
import Link from "next/link";

export function BasesList() {
  const { data, isLoading } = api.base.getBases.useQuery();
  const utils = api.useContext();

  const { mutate: createDemoBase, isPending: isSeeding } =
    api.base.createDemoBase.useMutation({
      onSuccess: async () => {
        await utils.base.getBases.invalidate();
      }
    });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Your bases</h2>

        <button
          type="button"
          onClick={() => createDemoBase()}
          disabled={isSeeding}
          className="rounded bg-blue-600 px-3 py-1 text-sm text-white disabled:opacity-50"
        >
          {isSeeding
            ? "Creating demo base..."
            : "Create demo base (100 000 rows)"}
        </button>
      </div>

      {isLoading ? (
        <div>Loading bases...</div>
      ) : !data || data.length === 0 ? (
        <div>No bases yet</div>
      ) : (
        <ul className="space-y-2">
          {data.map(base => (
            <li key={base.id}>
              <Link
                className="text-blue-600 underline"
                href={`/${base.id}`}
              >
                {base.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

'use client';

import { useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, ChevronsUpDown, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, SkeletonRows } from '@/components/ui/states';
import { cn } from '@/lib/utils';

export interface DataTableColumn<T> {
  id: string;
  header: string;
  /** Cell renderer. Keep it presentational — sorting uses `sortValue`. */
  cell: (row: T) => ReactNode;
  /** Returning a value here makes the column sortable. */
  sortValue?: (row: T) => string | number | null | undefined;
  /** Contributes to the free-text filter. */
  searchValue?: (row: T) => string | null | undefined;
  /** Hidden below `sm`, so narrow screens keep only the essential columns. */
  hideOnMobile?: boolean;
  align?: 'left' | 'right';
  width?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onRowClick?: (row: T) => void;
  /** Shows the search box when any column declares `searchValue`. */
  searchPlaceholder?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: ComponentType<{ className?: string }>;
  emptyAction?: ReactNode;
  /** Rows per page. Pass 0 to render everything. */
  pageSize?: number;
  caption?: string;
}

type SortState = { columnId: string; direction: 'asc' | 'desc' } | null;

function compare(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true });
}

/**
 * The one table used by every admin screen.
 *
 * Sorting, free-text filtering and pagination all run client-side, because the
 * endpoints behind these screens return whole collections with no server-side
 * query parameters. If the API grows real pagination, only this component and
 * its callers' data fetching need to change.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  isLoading,
  error,
  onRetry,
  onRowClick,
  searchPlaceholder,
  emptyTitle = 'Nothing here yet',
  emptyDescription,
  emptyIcon,
  emptyAction,
  pageSize = 25,
  caption,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<SortState>(null);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);

  const searchable = columns.some((column) => column.searchValue);

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return rows;
    return rows.filter((row) =>
      columns.some((column) =>
        column.searchValue?.(row)?.toLowerCase().includes(trimmed),
      ),
    );
  }, [rows, columns, query]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const column = columns.find((item) => item.id === sort.columnId);
    if (!column?.sortValue) return filtered;
    const next = [...filtered].sort((a, b) =>
      compare(column.sortValue!(a), column.sortValue!(b)),
    );
    return sort.direction === 'desc' ? next.reverse() : next;
  }, [filtered, sort, columns]);

  const pageCount = pageSize > 0 ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1;
  const safePage = Math.min(page, pageCount - 1);
  const visible =
    pageSize > 0 ? sorted.slice(safePage * pageSize, safePage * pageSize + pageSize) : sorted;

  const toggleSort = (columnId: string) => {
    setPage(0);
    setSort((current) => {
      if (current?.columnId !== columnId) return { columnId, direction: 'asc' };
      if (current.direction === 'asc') return { columnId, direction: 'desc' };
      return null;
    });
  };

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  return (
    <div className="space-y-3">
      {searchable && (
        <div className="relative max-w-sm">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(0);
            }}
            placeholder={searchPlaceholder ?? 'Search…'}
            aria-label={searchPlaceholder ?? 'Search table'}
            className="pl-9"
          />
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {/* The wrapper scrolls, so a wide table never pushes the page sideways. */}
        <div className="scrollbar-thin w-full overflow-x-auto">
          <table className="w-full min-w-[36rem] caption-bottom text-sm">
            {caption && <caption className="sr-only">{caption}</caption>}
            <thead className="bg-muted/50">
              <tr className="border-b border-border">
                {columns.map((column) => {
                  const isSorted = sort?.columnId === column.id;
                  const SortIcon = !isSorted
                    ? ChevronsUpDown
                    : sort.direction === 'asc'
                      ? ArrowUp
                      : ArrowDown;

                  return (
                    <th
                      key={column.id}
                      scope="col"
                      style={column.width ? { width: column.width } : undefined}
                      aria-sort={
                        isSorted
                          ? sort.direction === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : column.sortValue
                            ? 'none'
                            : undefined
                      }
                      className={cn(
                        'px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground',
                        column.align === 'right' ? 'text-right' : 'text-left',
                        column.hideOnMobile && 'hidden sm:table-cell',
                      )}
                    >
                      {column.sortValue ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(column.id)}
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-sm transition-colors hover:text-foreground',
                            column.align === 'right' && 'flex-row-reverse',
                          )}
                        >
                          {column.header}
                          <SortIcon className="h-3 w-3" aria-hidden="true" />
                        </button>
                      ) : (
                        column.header
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>

            {isLoading ? (
              <tbody>
                <tr>
                  <td colSpan={columns.length} className="p-0">
                    <SkeletonRows rows={5} cols={columns.length} />
                  </td>
                </tr>
              </tbody>
            ) : visible.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={columns.length} className="p-0">
                    <EmptyState
                      icon={emptyIcon}
                      title={query ? 'No matches' : emptyTitle}
                      description={
                        query
                          ? `Nothing matches “${query}”. Try a different search.`
                          : emptyDescription
                      }
                      action={query ? undefined : emptyAction}
                      className="border-0 bg-transparent"
                    />
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="divide-y divide-border">
                {visible.map((row) => (
                  <tr
                    key={rowKey(row)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    onKeyDown={
                      onRowClick
                        ? (event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              onRowClick(row);
                            }
                          }
                        : undefined
                    }
                    tabIndex={onRowClick ? 0 : undefined}
                    role={onRowClick ? 'button' : undefined}
                    className={cn(
                      'transition-colors',
                      onRowClick && 'cursor-pointer hover:bg-muted/50 focus-visible:bg-muted/50',
                    )}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.id}
                        className={cn(
                          'px-4 py-3 align-middle',
                          column.align === 'right' && 'text-right',
                          column.hideOnMobile && 'hidden sm:table-cell',
                        )}
                      >
                        {column.cell(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>
      </div>

      {!isLoading && pageCount > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <p>
            Showing {safePage * pageSize + 1}–
            {Math.min((safePage + 1) * pageSize, sorted.length)} of {sorted.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((current) => Math.max(0, current - 1))}
              disabled={safePage === 0}
            >
              Previous
            </Button>
            <span className="tabular-nums">
              {safePage + 1} / {pageCount}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
              disabled={safePage >= pageCount - 1}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useCallback } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { walletAPI } from '@services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Skeleton } from '@components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { EmptyState, TableEmptyRow } from '@components/common/EmptyState';
import { ErrorState } from '@components/common/ErrorState';
import { TableRowsSkeleton, CardListSkeleton } from '@components/common/Skeletons';
import { Pagination } from '@components/common/Pagination';
import { formatRelativeDate, formatExactTitle } from '@lib/datetime';
import useCurrency from '@hooks/useCurrency';
import { Wallet as WalletIcon, ArrowDownLeft, ArrowUpRight, Receipt, ShoppingCart } from 'lucide-react';

const PAGE_SIZE = 15;

const UserWallet = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { format } = useCurrency();

  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const setPage = useCallback(
    (next) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          if (next <= 1) params.delete('page');
          else params.set('page', String(next));
          return params;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const balanceQuery = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: () => walletAPI.getBalance().then((res) => res.data?.data ?? res.data ?? {}),
    retry: 1,
  });

  const txQuery = useQuery({
    queryKey: ['wallet-transactions', page],
    queryFn: () =>
      walletAPI.getTransactions({ page, limit: PAGE_SIZE }).then((res) => res.data.data),
    placeholderData: keepPreviousData,
  });

  const transactions = txQuery.data?.transactions ?? [];
  const pagination = txQuery.data?.pagination ?? {};
  const balance = Number(balanceQuery.data?.balance ?? 0);

  const emptyState = (
    <EmptyState
      icon={Receipt}
      title="No wallet activity yet"
      description="Credit lands here when a refund is approved or when you redeem DGMARQ Points. You can spend it at checkout like any other balance."
      action={
        <Button asChild>
          <Link to="/search">
            <ShoppingCart aria-hidden="true" />
            Browse keys
          </Link>
        </Button>
      }
    />
  );

  const TxDirection = ({ type }) =>
    type === 'credit' ? (
      <Badge variant="success">
        <ArrowDownLeft aria-hidden="true" />
        In
      </Badge>
    ) : (
      <Badge variant="neutral">
        <ArrowUpRight aria-hidden="true" />
        Out
      </Badge>
    );

  const signedAmount = (tx) =>
    `${tx.type === 'credit' ? '+' : '−'}${format(Number(tx.amount) || 0)}`;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-xl font-semibold text-fg">Wallet</h1>
        <p className="mt-1 text-sm text-fg-muted">Your balance and everything that moved it.</p>
      </header>

      <Card variant="hud">
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl border border-success/35 bg-success-soft">
              <WalletIcon aria-hidden="true" className="size-6 text-success" />
            </div>
            <div>
              <p className="text-xs tracking-wide text-fg-subtle uppercase">Available balance</p>
              {balanceQuery.isPending ? (
                <Skeleton className="mt-1 h-8 w-28" />
              ) : balanceQuery.isError ? (
                <p className="mt-1 text-sm text-danger">Balance unavailable</p>
              ) : (
                <p className="mt-0.5 text-2xl font-semibold tabular-nums text-fg">
                  {format(balance)}
                </p>
              )}
            </div>
          </div>
          <p className="max-w-xs text-xs text-fg-subtle">
            Wallet credit is applied automatically at checkout before any card payment.
          </p>
        </CardContent>
      </Card>

      <Card variant="hud">
        <CardHeader>
          <CardTitle>
            {pagination.total != null ? `${pagination.total} transactions` : 'Transactions'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {txQuery.isError ? (
            <ErrorState
              error={txQuery.error}
              title="Couldn't load your transactions"
              onRetry={() => txQuery.refetch()}
            />
          ) : (
            <>
              <div className="hidden md:block">
                <Table variant="hud">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Direction</TableHead>
                      <TableHead numeric>Amount</TableHead>
                      <TableHead numeric>Balance after</TableHead>
                      <TableHead>When</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {txQuery.isPending ? (
                      <TableRowsSkeleton rows={PAGE_SIZE} cols={5} />
                    ) : transactions.length === 0 ? (
                      <TableEmptyRow colSpan={5}>{emptyState}</TableEmptyRow>
                    ) : (
                      transactions.map((tx) => (
                        <TableRow key={tx._id}>
                          <TableCell className="max-w-xs whitespace-normal">
                            {tx.description}
                          </TableCell>
                          <TableCell>
                            <TxDirection type={tx.type} />
                          </TableCell>
                          <TableCell
                            numeric
                            className={tx.type === 'credit' ? 'font-semibold text-success' : 'text-fg'}
                          >
                            {signedAmount(tx)}
                          </TableCell>
                          <TableCell numeric className="text-fg-muted">
                            {tx.balanceAfter != null ? format(tx.balanceAfter) : '—'}
                          </TableCell>
                          <TableCell
                            className="text-fg-muted"
                            title={formatExactTitle(tx.createdAt)}
                          >
                            {formatRelativeDate(tx.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="md:hidden">
                {txQuery.isPending ? (
                  <CardListSkeleton rows={5} />
                ) : transactions.length === 0 ? (
                  emptyState
                ) : (
                  <ul className="space-y-3">
                    {transactions.map((tx) => (
                      <li
                        key={tx._id}
                        className="rounded-xl border border-brand-cyan/12 bg-brand-cyan/3 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="min-w-0 flex-1 text-sm text-fg">{tx.description}</p>
                          <span
                            className={`shrink-0 text-sm font-semibold tabular-nums ${
                              tx.type === 'credit' ? 'text-success' : 'text-fg'
                            }`}
                          >
                            {signedAmount(tx)}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <TxDirection type={tx.type} />
                          <span className="text-xs text-fg-subtle">
                            {formatRelativeDate(tx.createdAt)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <Pagination
                page={page}
                totalPages={pagination.pages}
                onPageChange={setPage}
                total={pagination.total}
                totalNoun="transactions"
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserWallet;

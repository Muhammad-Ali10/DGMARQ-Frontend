import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminAPI } from "../../services/api";
import { useState } from "react";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Loading, ErrorMessage } from "../../components/ui/loading";
import { DollarSign, ChevronLeft, ChevronRight } from "lucide-react";

const PayoutsManagement = () => {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  const {
    data: payouts,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["admin-payouts", page, statusFilter],
    queryFn: async () => {
      try {
        const response = await adminAPI.getAllPayouts({
          page,
          limit: 20,
          status: statusFilter || undefined,
        });
        return response.data.data;
      } catch (err) {
        console.error("Payouts error:", err);
        throw err;
      }
    },
    retry: 1,
  });

  const processMutation = useMutation({
    mutationFn: (payoutId) => adminAPI.processPayout(payoutId),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-payouts"]);
    },
  });

  const handleProcess = (payoutId) => {
      processMutation.mutate(payoutId);
  };

  if (isLoading) return <Loading message="Loading payouts..." />;
  if (isError)
    return (
      <ErrorMessage
        message={error?.response?.data?.message || "Error loading payouts"}
      />
    );

  const payoutList = payouts?.payouts || [];
  const pagination = payouts?.pagination || {};

  const getStatusBadge = (status) => {
    const variants = {
      released: "success",
      pending: "warning",
      failed: "destructive",
      hold: "secondary",
      blocked: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="px-4 sm:px-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Payouts Management</h1>
        <p className="text-sm sm:text-base text-gray-400 mt-1">Manage seller payouts</p>
      </div>

      <Card className="bg-primary border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            All Payouts
          </CardTitle>
          <Select
            value={statusFilter || "all"}
            onValueChange={(value) => {
              setStatusFilter(value === "all" ? "" : value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-48 bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="released">Released</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="hold">Hold</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {payoutList.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              No payouts found
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700 hover:bg-gray-800">
                      <TableHead className="text-gray-300">Payout ID</TableHead>
                      <TableHead className="text-gray-300">Seller</TableHead>
                      <TableHead className="text-gray-300">Amount</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300">Scheduled</TableHead>
                      <TableHead className="text-gray-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payoutList.map((payout) => (
                      <TableRow
                        key={payout._id}
                        className="border-gray-700 hover:bg-gray-800"
                      >
                        <TableCell className="text-white font-mono text-sm">
                          {payout._id.slice(-8)}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {payout.sellerId?.shopName || "N/A"}
                        </TableCell>
                        <TableCell className="text-white font-semibold">
                          ${payout.netAmount?.toFixed(2) || payout.amount?.toFixed(2) || '0.00'}
                        </TableCell>
                        <TableCell>{getStatusBadge(payout.status)}</TableCell>
                        <TableCell className="text-gray-300">
                          {payout.holdUntil
                            ? new Date(payout.holdUntil).toLocaleDateString()
                            : payout.scheduledAt
                            ? new Date(payout.scheduledAt).toLocaleDateString()
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          {payout.status === "pending" && (
                            <Button
                              size="sm"
                              onClick={() => handleProcess(payout._id)}
                              disabled={processMutation.isPending}
                            >
                              Process
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <span className="text-gray-300">
                    Page {page} of {pagination.pages || 1}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setPage((p) => Math.min(pagination.pages || 1, p + 1))
                    }
                    disabled={page >= (pagination.pages || 1)}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PayoutsManagement;

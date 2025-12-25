import { useState, useMemo } from "react";
import { Card, CardBody, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Input, Select, SelectItem, User, Pagination } from "@heroui/react";
import { Search } from "lucide-react";
import { communicationLogs } from "../../data/mockData";

const ROWS_PER_PAGE = 8;

export default function CommunicationLogs() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(1);

  const filteredLogs = communicationLogs.filter(log => {
    const matchSearch = log.recipient.toLowerCase().includes(search.toLowerCase()) ||
      log.student.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || log.type.toLowerCase() === filterType;
    const matchStatus = filterStatus === "all" || log.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  const totalPages = Math.ceil(filteredLogs.length / ROWS_PER_PAGE);
  const paginatedLogs = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    return filteredLogs.slice(start, start + ROWS_PER_PAGE);
  }, [filteredLogs, page]);

  return (
    <div className="flex flex-col gap-3 w-full">
      <Card className="shadow-sm border border-default-200 rounded-2xl">
        <CardBody className="p-4">
          <div className="flex gap-2 mb-4 shrink-0">
            <Input
              size="sm"
              placeholder="Search recipient..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              startContent={<Search size={16} className="text-default-400" />}
              className="w-full sm:max-w-[40%]"
              variant="faded"
            />
            <div className="flex gap-2 ml-auto">
              <Select size="sm" selectedKeys={[filterType]} onChange={(e) => setFilterType(e.target.value)} className="w-[120px]" variant="faded">
                <SelectItem key="all">All Types</SelectItem>
                <SelectItem key="sms">SMS</SelectItem>
                <SelectItem key="email">Email</SelectItem>
              </Select>
              <Select size="sm" selectedKeys={[filterStatus]} onChange={(e) => setFilterStatus(e.target.value)} className="w-[120px]" variant="faded">
                <SelectItem key="all">All Status</SelectItem>
                <SelectItem key="delivered">Delivered</SelectItem>
                <SelectItem key="failed">Failed</SelectItem>
              </Select>
            </div>
          </div>

          <Table
            aria-label="Communication logs"
            radius="none"
            isStriped={false}
            removeWrapper
            classNames={{
              table: "w-full",
              th: "bg-transparent text-default-500 font-semibold text-xs uppercase tracking-wider h-12 border-b border-default-200",
              td: "py-4 border-b border-default-100",
              tr: "transition-opacity hover:bg-default-50/30",
              wrapper: "p-0"
            }}
          >
            <TableHeader>
              <TableColumn>RECIPIENT</TableColumn>
              <TableColumn>TYPE</TableColumn>
              <TableColumn>MESSAGE</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>DATE</TableColumn>
            </TableHeader>
            <TableBody>
              {paginatedLogs.map((log) => (
                <TableRow key={log.id} className="cursor-pointer hover:bg-default-50 transition-colors">
                  <TableCell>
                    <User
                      avatarProps={{ radius: "full", size: "sm", src: `https://i.pravatar.cc/150?u=${log.id}` }}
                      description={log.student}
                      name={log.recipient}
                    >
                      {log.recipient}
                    </User>
                  </TableCell>
                  <TableCell>
                    <Chip size="sm" variant="flat" color={log.type === "SMS" ? "primary" : "secondary"} className="uppercase font-bold text-[10px]">{log.type}</Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-small font-normal text-default-700 truncate max-w-[300px]">{log.message}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip size="sm" color={log.status === "delivered" ? "success" : "danger"} variant="dot" classNames={{ base: "border border-default-100" }}>{log.status}</Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-xs text-default-500">{log.date.split(' ')[0]}</span>
                      <span className="text-[10px] text-default-400">{log.date.split(' ')[1]}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex w-full justify-end pt-4 border-t border-default-100 mt-4">
              <Pagination
                isCompact
                showControls
                showShadow
                color="primary"
                page={page}
                total={totalPages}
                onChange={setPage}
              />
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

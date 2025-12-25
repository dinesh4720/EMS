import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Button, Select, SelectItem, Input, User, Pagination } from "@heroui/react";
import { Download, Bell, Search } from "lucide-react";
import { useApp } from "../../context/AppContext";

const ROWS_PER_PAGE = 8;

export default function FeeDefaulters() {
  const navigate = useNavigate();
  const { feeDefaulters: defaulterStudents } = useApp();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Transform students to defaulter format with calculated days
  const feeDefaulters = useMemo(() => defaulterStudents.map((s, i) => ({
    id: s.id,
    student: s.name,
    class: s.class,
    pending: 5000 + (i * 2000),
    dueDate: "2025-12-01",
    days: 10 + (i * 5),
  })), [defaulterStudents]);

  const filteredDefaulters = feeDefaulters.filter(d => {
    const matchSearch = d.student.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" ||
      (filter === "7" && d.days >= 7 && d.days < 15) ||
      (filter === "15" && d.days >= 15 && d.days < 30) ||
      (filter === "30" && d.days >= 30);
    return matchSearch && matchFilter;
  });

  const totalPages = Math.ceil(filteredDefaulters.length / ROWS_PER_PAGE);
  const paginatedDefaulters = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    return filteredDefaulters.slice(start, start + ROWS_PER_PAGE);
  }, [filteredDefaulters, page]);

  const totalPending = filteredDefaulters.reduce((sum, d) => sum + d.pending, 0);

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex justify-end gap-2 mb-4">
        <Button size="sm" variant="flat" color="warning" startContent={<Bell size={14} />}>Send Reminders</Button>
        <Button size="sm" variant="flat" startContent={<Download size={14} />}>Export</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-none border border-default-200">
          <CardBody className="p-4 text-center">
            <p className="text-2xl font-bold text-danger">{feeDefaulters.length}</p>
            <p className="text-xs text-default-500">Total Defaulters</p>
          </CardBody>
        </Card>
        <Card className="shadow-none border border-default-200">
          <CardBody className="p-4 text-center">
            <p className="text-2xl font-bold text-warning">{feeDefaulters.filter(d => d.days >= 7 && d.days < 15).length}</p>
            <p className="text-xs text-default-500">&gt;7 Days</p>
          </CardBody>
        </Card>
        <Card className="shadow-none border border-default-200">
          <CardBody className="p-4 text-center">
            <p className="text-2xl font-bold text-danger">{feeDefaulters.filter(d => d.days >= 15 && d.days < 30).length}</p>
            <p className="text-xs text-default-500">&gt;15 Days</p>
          </CardBody>
        </Card>
        <Card className="shadow-none border border-default-200">
          <CardBody className="p-4 text-center">
            <p className="text-2xl font-bold text-danger">{feeDefaulters.filter(d => d.days >= 30).length}</p>
            <p className="text-xs text-default-500">&gt;30 Days</p>
          </CardBody>
        </Card>
      </div>

      <div className="flex-1">
        <Card className="shadow-sm border border-default-200 rounded-2xl">
          <CardBody className="p-4">
            <div className="flex justify-between gap-2 mb-4 shrink-0">
              <div className="flex gap-2 w-full max-w-[70%]">
                <Input
                  size="sm"
                  placeholder="Search student..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  startContent={<Search size={16} className="text-default-400" />}
                  className="max-w-xs"
                  variant="faded"
                />
                <Select size="sm" selectedKeys={[filter]} onChange={(e) => setFilter(e.target.value)} className="max-w-[150px]" variant="faded">
                  <SelectItem key="all">All Defaulters</SelectItem>
                  <SelectItem key="7">&gt;7 Days</SelectItem>
                  <SelectItem key="15">&gt;15 Days</SelectItem>
                  <SelectItem key="30">&gt;30 Days</SelectItem>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-default-600">Total Pending: <span className="text-danger ml-1 text-lg">₹{totalPending.toLocaleString()}</span></span>
              </div>
            </div>

            <Table
              aria-label="Fee defaulters"
              isStriped={false}
              removeWrapper
              selectionMode="multiple"
              color="danger"
              radius="none"
              classNames={{
                table: "w-full",
                th: "bg-transparent text-default-500 font-semibold text-xs uppercase tracking-wider h-12 border-b border-default-200 first:pl-4",
                td: "py-4 border-b border-default-100 first:pl-4",
                tr: "opacity-100 transition-opacity data-[selected=true]:bg-danger-50/50 data-[hover=true]:bg-default-50/30",
                wrapper: "p-0",
                base: "[&_th:first-child]:w-14 [&_th:first-child]:min-w-14 [&_th:first-child]:max-w-14 [&_td:first-child]:w-14"
              }}
            >
              <TableHeader>
                <TableColumn>STUDENT DETAILS</TableColumn>
                <TableColumn>PENDING AMOUNT</TableColumn>
                <TableColumn>DUE DATE</TableColumn>
                <TableColumn>STATUS</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody>
                {paginatedDefaulters.map((item) => (
                  <TableRow key={item.id} className="cursor-pointer hover:bg-default-50 transition-colors">
                    <TableCell>
                      <User
                        avatarProps={{ radius: "lg", size: "sm", color: "danger", src: `https://i.pravatar.cc/150?u=${item.id}` }}
                        description={`Class ${item.class}`}
                        name={
                          <span
                            className="text-foreground font-medium hover:text-primary hover:underline cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); navigate(`/students/${item.id}`); }}
                          >
                            {item.student}
                          </span>
                        }
                      >
                        {item.student}
                      </User>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-medium font-bold text-danger">₹{item.pending.toLocaleString()}</span>
                        <span className="text-[10px] text-default-400">Include late fees</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{item.dueDate}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        color={item.days >= 30 ? "danger" : item.days >= 15 ? "warning" : "default"}
                        variant="flat"
                        className="font-medium"
                      >
                        {item.days} days overdue
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" color="primary" variant="solid" className="font-medium shadow-sm">Collect</Button>
                        <Button size="sm" variant="flat" color="warning" isIconOnly><Bell size={16} /></Button>
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
                  color="danger"
                  page={page}
                  total={totalPages}
                  onChange={setPage}
                />
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

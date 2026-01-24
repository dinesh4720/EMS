import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell
} from '@heroui/react';

const SkeletonTable = ({ columns = 4, rows = 5 }) => {
  return (
    <Table aria-label="Loading table" removeWrapper>
      <TableHeader>
        {Array.from({ length: columns }).map((_, index) => (
          <TableColumn key={index}>
            <div className="h-4 bg-default-200 rounded animate-pulse" />
          </TableColumn>
        ))}
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <TableRow key={rowIndex}>
            {Array.from({ length: columns }).map((_, cellIndex) => (
              <TableCell key={cellIndex}>
                <div className="h-4 bg-default-200 rounded animate-pulse" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default SkeletonTable;
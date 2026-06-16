import { useState } from "react";

import Pagination from "../../../../components/common/Pagination";

export default function PaginationDemo() {
  const [page, setPage] = useState(3);
  return (
    <div style={{ width: "100%" }}>
      <Pagination
        currentPage={page}
        totalPages={12}
        onPageChange={setPage}
        totalItems={240}
        itemLabel="students"
      />
    </div>
  );
}

# UI Style Guide - StaffAttendance.jsx

Complete reference of all UI patterns, components, spacing, and styling from the polished StaffAttendance page.

---

## Imports

```jsx
// HeroUI Components
import {
    Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
    Button, Spinner, Progress,
    Dropdown, DropdownTrigger, DropdownMenu, DropdownItem,
    Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
    Textarea, Select, SelectItem, Input,
    Popover, PopoverTrigger, PopoverContent, Calendar
} from "@heroui/react";

// Date parsing
import { parseDate } from "@internationalized/date";

// Lucide Icons
import { 
    Search, Filter, ArrowUpDown, Layers, MoreVertical, 
    Check, X, Clock, ChevronDown, Download, AlertCircle, 
    CalendarDays, ChevronLeft, ChevronRight, UserCheck, UserX, Users 
} from "lucide-react";
```

---

## Page Wrapper Structure

All list/table pages should be wrapped in a Card component with consistent structure:

### Complete Page Wrapper
```jsx
import { Card, Breadcrumbs, BreadcrumbItem, Tabs, Tab } from "@heroui/react";
import { Home } from "lucide-react";

<div className="space-y-6 animate-fade-in pb-8">
  <Card className="shadow-sm border border-default-200 bg-background rounded-md">
    {/* 1. Breadcrumbs Section */}
    <div className="px-6 py-3 border-b border-default-200 flex items-center justify-between">
      <Breadcrumbs size="sm">
        <BreadcrumbItem startContent={<Home size={14} />} onPress={() => navigate("/")}>Home</BreadcrumbItem>
        <BreadcrumbItem>Section Name</BreadcrumbItem>
        {activeTab === "subpage" && <BreadcrumbItem>Subpage</BreadcrumbItem>}
      </Breadcrumbs>
    </div>

    {/* 2. Tabs Section */}
    <div className="px-6 py-3 border-b border-default-200">
      <Tabs
        selectedKey={activeTab}
        onSelectionChange={(key) => { /* navigation logic */ }}
        size="md"
        color="default"
        variant="light"
        classNames={{
          tabList: "gap-0 p-1.5 bg-gradient-to-r from-default-100 via-default-200/50 to-default-100 rounded-xl",
          cursor: "bg-white dark:bg-default-50 rounded-lg shadow-lg ring-1 ring-black/5",
          tab: "px-6 h-10 cursor-pointer",
          tabContent: "group-data-[selected=true]:text-default-900 group-data-[selected=true]:font-semibold text-default-500 font-medium"
        }}
      >
        <Tab key="list" title="All Items" />
        <Tab key="other" title="Other Tab" />
      </Tabs>
    </div>

    {/* 3. Header Section with Gradient */}
    <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-6 border-b border-default-200 overflow-hidden">
      {/* Gradient background - change color per section */}
      <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-orange-200/80 to-transparent blur-3xl pointer-events-none" />
      
      <div className="pl-2 relative z-10">
        <h1 className="text-2xl font-medium text-default-900">Page Title</h1>
        <p className="text-sm text-default-500 mt-1">Page description text</p>
      </div>
      
      {/* Primary action button */}
      <button className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg border border-primary hover:bg-primary-600 transition-all duration-200 text-sm cursor-pointer whitespace-nowrap relative z-10">
        <Plus size={16} />
        <span>Add Item</span>
      </button>
    </div>

    {/* 4. Content Area - THIS IS WHERE CHILD COMPONENTS GO */}
    <div className="min-h-[500px] px-6 py-6">
      <Routes>
        <Route index element={<ListComponent />} />
        <Route path="other" element={<OtherComponent />} />
      </Routes>
    </div>
  </Card>
</div>
```

### Gradient Colors by Section
Use different gradient colors for visual distinction:
- Staffs: `from-orange-200/80`
- Students: `from-blue-200/80`
- Classes: `from-green-200/80`
- Fees: `from-purple-200/80`

### Key Points
- Card provides the white background with border
- Content area has `px-6 py-6` padding - child components use full-bleed pattern
- Breadcrumbs and tabs have `px-6 py-3` with bottom borders
- Header section has `px-6 py-6` with gradient background
- `min-h-[500px]` ensures consistent minimum height

---

## Page Container & Layout Structure

### Root Container
Every page uses this root wrapper:
```jsx
<div className="w-full flex flex-col">
    {/* All content goes here */}
</div>
```

### Full-Bleed Pattern
The attendance page uses a "full-bleed" pattern where sections extend to the edges of the parent container using negative margins. This creates visual separation while maintaining consistent padding.

**How it works:**
- Parent container has `px-6 py-6` padding (from the layout/card wrapper)
- Child sections use `-mx-6 -mt-6 px-6 pt-6` to extend to parent edges
- This creates seamless edge-to-edge sections within a padded container

### Section Stacking Order
```jsx
<div className="w-full flex flex-col">
    {/* 1. Modals (rendered first but positioned via portal) */}
    <Modal>...</Modal>
    
    {/* 2. KPI Cards Section - full-bleed with bottom margin */}
    <div className="grid ... -mx-6 -mt-6 px-6 pt-6 mb-6">
        {/* KPI cards */}
    </div>
    
    {/* 3. Toolbar Section - full-bleed with border-bottom */}
    <div className="flex ... -mx-6 -mt-6 px-6 py-4 border-b border-default-200">
        {/* Search, filters, actions */}
    </div>
    
    {/* 4. Table Section - full-bleed via classNames */}
    <Table classNames={{ base: "-mx-6 ..." }}>
        {/* Table content */}
    </Table>
    
    {/* 5. Loader/Pagination Section */}
    <div className="flex justify-center py-4">
        {/* Loading indicator or pagination */}
    </div>
</div>
```

### Full-Bleed Section Classes

**KPI Cards Grid:**
```jsx
<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 -mx-6 -mt-6 px-6 pt-6">
```
- `-mx-6` - Extends 24px left and right to parent edges
- `-mt-6` - Pulls up 24px to parent top edge
- `px-6` - Restores 24px horizontal padding inside
- `pt-6` - Restores 24px top padding inside
- `mb-6` - 24px margin bottom for spacing to next section

**Toolbar:**
```jsx
<div className="flex flex-col sm:flex-row justify-between gap-4 items-center bg-background border-b border-default-200 py-4 -mx-6 -mt-6 px-6">
```
- Same negative margin pattern
- `border-b border-default-200` - Bottom border for visual separation
- `py-4` - 16px vertical padding
- `bg-background` - Explicit background color

**Table:**
```jsx
classNames={{
    base: "-mx-6 overflow-visible [&_table]:w-[calc(100%+3rem)] [&_table]:border-spacing-0",
    thead: "[&>tr>th:first-child]:pl-6 [&>tr>th:last-child]:pr-6",
    tbody: "[&>tr>td:first-child]:pl-6 [&>tr>td:last-child]:pr-6",
    // ... other classNames
}}
```
- `-mx-6` on base extends table to edges
- `[&_table]:w-[calc(100%+3rem)]` - Table width accounts for negative margins (3rem = 48px = 24px × 2)
- First/last cell padding restores alignment

### When NOT to Use Full-Bleed

If the page doesn't have a padded parent wrapper, skip the negative margins:
```jsx
// Without padded parent - use normal spacing
<div className="w-full flex flex-col">
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {/* KPI cards */}
    </div>
    
    <div className="flex ... py-4 border-b border-default-200">
        {/* Toolbar */}
    </div>
    
    <Table classNames={{ base: "overflow-visible" }}>
        {/* Table */}
    </Table>
</div>
```

### Responsive Behavior
- Mobile: Sections stack vertically, grids collapse to fewer columns
- Desktop: Full-width sections with proper edge alignment
- The `-mx-6 px-6` pattern works at all breakpoints

---

## Section 1: KPI Cards

### Grid Container
```jsx
<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 -mx-6 -mt-6 px-6 pt-6">
```

**Spacing breakdown:**
- `grid grid-cols-2 sm:grid-cols-4` - 2 cols mobile, 4 cols desktop
- `gap-4` - 16px gap between cards
- `mb-6` - 24px margin bottom
- `-mx-6 -mt-6 px-6 pt-6` - Full-bleed (extends to parent edges)

### Default KPI Card (Total Staff)
```jsx
<div className="p-4 bg-default-50 rounded-lg border border-default-200">
    <div className="flex items-center gap-2 mb-2">
        <Users size={18} className="text-default-500" />
        <span className="text-xs text-default-500 uppercase tracking-wider">Total Staff</span>
    </div>
    <p className="text-2xl font-semibold text-default-900">{value}</p>
</div>
```

### Success KPI Card (Present)
```jsx
<div className="p-4 bg-success-50 rounded-lg border border-success-200">
    <div className="flex items-center gap-2 mb-2">
        <UserCheck size={18} className="text-success-600" />
        <span className="text-xs text-success-700 uppercase tracking-wider">Present</span>
    </div>
    <p className="text-2xl font-semibold text-success-700">{value}</p>
</div>
```

### Danger KPI Card (Absent)
```jsx
<div className="p-4 bg-danger-50 rounded-lg border border-danger-200">
    <div className="flex items-center gap-2 mb-2">
        <UserX size={18} className="text-danger-600" />
        <span className="text-xs text-danger-700 uppercase tracking-wider">Absent</span>
    </div>
    <p className="text-2xl font-semibold text-danger-700">{value}</p>
</div>
```

### Warning KPI Card (On Leave)
```jsx
<div className="p-4 bg-warning-50 rounded-lg border border-warning-200">
    <div className="flex items-center gap-2 mb-2">
        <Clock size={18} className="text-warning-600" />
        <span className="text-xs text-warning-700 uppercase tracking-wider">On Leave</span>
    </div>
    <p className="text-2xl font-semibold text-warning-700">{value}</p>
</div>
```

### KPI Card Spacing Summary
- Container: `p-4` (16px padding)
- Icon + Label row: `flex items-center gap-2 mb-2`
- Icon: `size={18}`
- Label: `text-xs uppercase tracking-wider`
- Value: `text-2xl font-semibold`

---

## Section 2: Toolbar

### Toolbar Container
```jsx
<div className="flex flex-col sm:flex-row justify-between gap-4 items-center bg-background border-b border-default-200 py-4 -mx-6 -mt-6 px-6">
```

**Spacing breakdown:**
- `flex flex-col sm:flex-row` - Stack on mobile, row on desktop
- `justify-between` - Space between left and right groups
- `gap-4` - 16px gap
- `items-center` - Vertically centered
- `bg-background` - Background color
- `border-b border-default-200` - Bottom border
- `py-4` - 16px vertical padding
- `-mx-6 -mt-6 px-6` - Full-bleed horizontal

### Left Side (Date Picker Group)
```jsx
<div className="flex items-center gap-3 w-full sm:w-auto">
    <div className="flex items-center gap-1">
        {/* Date picker and Today button */}
    </div>
</div>
```

### Right Side (Search, Filters, Actions)
```jsx
<div className="flex gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
    {/* Search, Filter, Sort, Download, Bulk Actions */}
</div>
```

### Toolbar Layout Rule

**When there is NO left side content:** Move the search input to the left side, keep filters/actions on the right. Always use `justify-between`.

```jsx
{/* With left side content (e.g., date picker) */}
<div className="flex flex-col sm:flex-row justify-between gap-4 items-center ...">
    <div className="flex items-center gap-3 w-full sm:w-auto">
        {/* Left content - date picker, etc. */}
    </div>
    <div className="flex gap-2 ...">
        {/* Search, filters, actions */}
    </div>
</div>

{/* Without left side content - search moves to left, filters stay right */}
<div className="flex flex-col sm:flex-row justify-between gap-4 items-center ...">
    <div className="flex items-center gap-2 w-full sm:w-auto">
        {/* Search input only */}
    </div>
    <div className="flex gap-2 ...">
        {/* Filters, actions */}
    </div>
</div>
```

---

## Section 3: Date Picker

### Form Date Picker (Standard)
For form inputs, use the `DatePicker` component directly with `parseDate`.

```jsx
import { DatePicker } from "@heroui/react";
import { parseDate } from "@internationalized/date";

<DatePicker
    label="Date of Birth"
    labelPlacement="outside"
    value={value ? parseDate(value.split('T')[0]) : null}
    onChange={(date) => setValue(date ? date.toString() : "")}
    variant="bordered"
    radius="sm"
    showMonthAndYearPickers
    classNames={{ label: "text-xs font-medium text-default-600 mb-1" }}
    aria-label="Select date"
/>
```

### Date Picker with Navigation Arrows (Toolbar)
```jsx
<Popover placement="bottom-start">
    <PopoverTrigger>
        <button className="flex items-center gap-2 px-3 py-2 bg-transparent rounded-lg border border-default-300 hover:border-primary transition-all duration-200 text-sm cursor-pointer whitespace-nowrap">
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    const date = new Date(selectedDate);
                    date.setDate(date.getDate() - 1);
                    setSelectedDate(date.toISOString().split('T')[0]);
                }}
                className="p-0.5 hover:bg-default-100 rounded cursor-pointer"
            >
                <ChevronLeft size={14} className="text-default-400" />
            </button>
            <CalendarDays size={16} className="text-default-400 flex-shrink-0" />
            <span>{new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    const date = new Date(selectedDate);
                    date.setDate(date.getDate() + 1);
                    setSelectedDate(date.toISOString().split('T')[0]);
                }}
                disabled={selectedDate >= new Date().toISOString().split('T')[0]}
                className="p-0.5 hover:bg-default-100 rounded cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
                <ChevronRight size={14} className="text-default-400" />
            </button>
        </button>
    </PopoverTrigger>
    <PopoverContent className="p-0">
        <Calendar
            value={parseDate(selectedDate)}
            onChange={(date) => setSelectedDate(date.toString())}
            aria-label="Select date"
        />
    </PopoverContent>
</Popover>
```

### Today Button
```jsx
<button 
    onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
    disabled={selectedDate === new Date().toISOString().split('T')[0]}
    className="px-3 py-2 bg-transparent rounded-lg border border-default-300 hover:border-primary transition-all duration-200 text-sm cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
>
    Today
</button>
```

---

## Section 4: Search Input

### Custom HTML Search (NOT HeroUI Input)
```jsx
<div className="flex items-center gap-2 w-full sm:max-w-[250px] px-3 py-2 bg-default-100 rounded-lg border border-default-200 hover:border-primary hover:bg-default-50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-200">
    <Search size={16} className="text-default-400" />
    <input
        type="text"
        placeholder="Search staff..."
        className="flex-1 bg-transparent outline-none text-sm"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
    />
    {searchQuery && (
        <button onClick={() => setSearchQuery("")} className="p-0.5 hover:bg-default-200 rounded cursor-pointer">
            <X size={14} className="text-default-400" />
        </button>
    )}
</div>
```

**Spacing breakdown:**
- Container: `px-3 py-2` (12px horizontal, 8px vertical)
- `gap-2` - 8px between icon and input
- `w-full sm:max-w-[250px]` - Full width mobile, 250px max desktop
- Clear button: `p-0.5` (2px padding)

---

## Section 5: Icon Buttons (Filter, Sort)

### Icon-Only Button
```jsx
<button className="p-2 bg-transparent rounded-lg border border-default-300 hover:border-primary transition-all duration-200 cursor-pointer">
    <Filter size={16} className="text-default-400" />
</button>
```

**Spacing:** `p-2` (8px padding all sides)

---

## Section 6: Text Buttons with Icons

### Download Report Button
```jsx
<button 
    className="flex items-center gap-2 px-3 py-2 bg-transparent rounded-lg border border-default-300 hover:border-primary transition-all duration-200 text-sm cursor-pointer whitespace-nowrap"
    onClick={() => setDownloadModalOpen(true)}
>
    <Download size={16} className="text-default-400" />
    <span>Download Report</span>
</button>
```

### Bulk Actions Button (with Chevron)
```jsx
<button className="flex items-center gap-2 px-3 py-2 bg-transparent rounded-lg border border-default-300 hover:border-primary transition-all duration-200 text-sm cursor-pointer whitespace-nowrap">
    <Layers size={16} className="text-default-400" />
    <span>Bulk Actions</span>
    <ChevronDown size={14} className="text-default-400" />
</button>
```

### Primary Action Button (e.g., Add New, Create)
Primary buttons use the same size and structure as other toolbar buttons, but with primary color styling:
```jsx
<button className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg border border-primary hover:bg-primary-600 transition-all duration-200 text-sm cursor-pointer whitespace-nowrap">
    <Plus size={16} />
    <span>Add Staff</span>
</button>
```

**Spacing:** `px-3 py-2 gap-2` (12px horizontal, 8px vertical, 8px gap)

---

## Section 7: Dropdowns

### Filter Dropdown
```jsx
<Dropdown>
    <DropdownTrigger>
        <button className="p-2 bg-transparent rounded-lg border border-default-300 hover:border-primary transition-all duration-200 cursor-pointer">
            <Filter size={16} className="text-default-400" />
        </button>
    </DropdownTrigger>
    <DropdownMenu
        aria-label="Filter by status"
        disallowEmptySelection
        selectionMode="single"
        selectedKeys={new Set([statusFilter])}
        onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0])}
    >
        <DropdownItem key="all">All Status</DropdownItem>
        <DropdownItem key="present">Present</DropdownItem>
        <DropdownItem key="absent">Absent</DropdownItem>
        <DropdownItem key="halfday">Half Day</DropdownItem>
        <DropdownItem key="leave">On Leave</DropdownItem>
        <DropdownItem key="unmarked">Not Marked</DropdownItem>
    </DropdownMenu>
</Dropdown>
```

### Sort Dropdown
```jsx
<Dropdown>
    <DropdownTrigger>
        <button className="p-2 bg-transparent rounded-lg border border-default-300 hover:border-primary transition-all duration-200 cursor-pointer">
            <ArrowUpDown size={16} className="text-default-400" />
        </button>
    </DropdownTrigger>
    <DropdownMenu
        aria-label="Sort options"
        disallowEmptySelection
        selectionMode="single"
        selectedKeys={new Set([sortDescriptor.column])}
        onSelectionChange={(keys) => setSortDescriptor({ column: Array.from(keys)[0], direction: sortDescriptor.direction })}
    >
        <DropdownItem key="name">Name</DropdownItem>
        <DropdownItem key="department">Department</DropdownItem>
    </DropdownMenu>
</Dropdown>
```

### Bulk Actions Dropdown
```jsx
<Dropdown>
    <DropdownTrigger>
        <button className="flex items-center gap-2 px-3 py-2 bg-transparent rounded-lg border border-default-300 hover:border-primary transition-all duration-200 text-sm cursor-pointer whitespace-nowrap">
            <Layers size={16} className="text-default-400" />
            <span>Bulk Actions</span>
            <ChevronDown size={14} className="text-default-400" />
        </button>
    </DropdownTrigger>
    <DropdownMenu
        aria-label="Bulk Actions"
        onAction={handleBulkAction}
    >
        <DropdownItem key="present" className="text-success">Mark Selected Present</DropdownItem>
        <DropdownItem key="halfday" className="text-secondary">Mark Selected Half Day</DropdownItem>
        <DropdownItem key="absent" className="text-danger">Mark Selected Absent</DropdownItem>
        <DropdownItem key="leave" className="text-warning">Mark Selected On Leave</DropdownItem>
        <DropdownItem key="unmarked">Mark Selected Not Marked</DropdownItem>
    </DropdownMenu>
</Dropdown>
```

---

## Section 8: Table


### Column Widths State
```jsx
const [columnWidths] = useState({
    name: 250,
    status: 120,
    attendance: 160,
    inTime: 100,
    outTime: 100,
    actions: 50
});
```

### Full Table Component
```jsx
<Table
    aria-label="Staff attendance table"
    selectionMode="multiple"
    selectedKeys={selectedKeys}
    onSelectionChange={setSelectedKeys}
    sortDescriptor={sortDescriptor}
    onSortChange={setSortDescriptor}
    removeWrapper
    radius="none"
    classNames={{
        base: "-mx-6 overflow-visible [&_table]:w-[calc(100%+3rem)] [&_table]:border-spacing-0",
        thead: "[&>tr]:first:shadow-none [&>tr>th:first-child]:pl-6 [&>tr>th:first-child]:pr-3 [&>tr>th:first-child]:w-12",
        th: "bg-transparent text-default-400 font-medium text-xs uppercase tracking-wider h-12 border-b border-default-200 last:pr-6 hover:bg-default-100 transition-colors cursor-pointer [&_svg]:text-default-300 [&:hover_svg]:text-default-500 [&_svg]:opacity-100 first:hover:bg-transparent first:cursor-default",
        td: "py-5 border-b border-default-200 group-data-[last=true]:border-none last:pr-6",
        tbody: "[&>tr>td:first-child]:pl-6 [&>tr>td:first-child]:pr-3 [&>tr>td:first-child]:w-12 [&>tr:first-child>td]:pt-5",
        tr: "",
    }}
>
```

### Table classNames Breakdown

**base:**
- `-mx-6` - Negative margin to extend full width
- `overflow-visible` - Allow dropdowns to overflow
- `[&_table]:w-[calc(100%+3rem)]` - Table width calculation
- `[&_table]:border-spacing-0` - No border spacing

**thead:**
- `[&>tr]:first:shadow-none` - Remove shadow from first row
- `[&>tr>th:first-child]:pl-6` - 24px left padding on first column (checkbox)
- `[&>tr>th:first-child]:pr-3` - 12px right padding on first column
- `[&>tr>th:first-child]:w-12` - 48px width for checkbox column

**th:**
- `bg-transparent` - No background
- `text-default-400` - Gray text
- `font-medium` - Medium weight
- `text-xs` - 12px font size
- `uppercase tracking-wider` - Uppercase with letter spacing
- `h-12` - 48px height
- `border-b border-default-200` - Bottom border
- `last:pr-6` - 24px right padding on last column
- `hover:bg-default-100` - Hover background
- `transition-colors cursor-pointer` - Smooth transition
- `[&_svg]:text-default-300` - SVG icon color
- `[&:hover_svg]:text-default-500` - SVG hover color
- `[&_svg]:opacity-100` - SVG full opacity
- `first:hover:bg-transparent first:cursor-default` - No hover on checkbox column

**td:**
- `py-5` - 20px vertical padding
- `border-b border-default-200` - Bottom border
- `group-data-[last=true]:border-none` - No border on last row
- `last:pr-6` - 24px right padding on last column

**tbody:**
- `[&>tr>td:first-child]:pl-6` - 24px left padding on first column
- `[&>tr>td:first-child]:pr-3` - 12px right padding on first column
- `[&>tr>td:first-child]:w-12` - 48px width for checkbox column
- `[&>tr:first-child>td]:pt-5` - 20px top padding on first row

### Table Header
```jsx
<TableHeader>
    <TableColumn key="name" allowsSorting style={{ width: columnWidths.name }}>STAFF MEMBER</TableColumn>
    <TableColumn key="status" allowsSorting style={{ width: columnWidths.status }}>STATUS</TableColumn>
    <TableColumn key="inTime" style={{ width: columnWidths.inTime }}>
        <span className="whitespace-normal leading-tight">CHECK IN</span>
    </TableColumn>
    <TableColumn key="outTime" style={{ width: columnWidths.outTime }}>
        <span className="whitespace-normal leading-tight">CHECK OUT</span>
    </TableColumn>
    <TableColumn key="attendance" style={{ width: columnWidths.attendance, minWidth: columnWidths.attendance }}>
        <Dropdown>
            <DropdownTrigger>
                <div className="flex items-center gap-1 cursor-pointer w-full h-full">
                    <span className="whitespace-normal leading-tight">{attendancePeriod === "this_week" ? "THIS WEEK AVG" : attendancePeriod === "this_month" ? "THIS MONTH AVG" : "THIS YEAR AVG"}</span>
                    <ChevronDown size={12} />
                </div>
            </DropdownTrigger>
            <DropdownMenu
                aria-label="Select attendance period"
                selectionMode="single"
                selectedKeys={new Set([attendancePeriod])}
                onSelectionChange={(keys) => setAttendancePeriod(Array.from(keys)[0])}
            >
                <DropdownItem key="this_week">This Week</DropdownItem>
                <DropdownItem key="this_month">This Month</DropdownItem>
                <DropdownItem key="this_year">This Year</DropdownItem>
            </DropdownMenu>
        </Dropdown>
    </TableColumn>
    <TableColumn align="end" style={{ width: columnWidths.actions }}>ACTIONS</TableColumn>
</TableHeader>
```

### Table Body
```jsx
<TableBody emptyContent="No staff found">
    {visibleStaff.map((s) => {
        const att = dailyAttendance[s.id];
        const overallPercentage = getOverallAttendance(s.id);

        return (
            <TableRow key={s.id}>
                {/* Cells */}
            </TableRow>
        );
    })}
</TableBody>
```

---

## Section 9: Table Cells

### Staff Member Cell (Avatar + Name + Department)
```jsx
<TableCell>
    <div className="flex items-center gap-3">
        <img 
            src={`https://i.pravatar.cc/150?u=${s.id}`} 
            alt={s.name}
            className="w-10 h-10 rounded-full"
        />
        <div className="flex flex-col">
            <span 
                className="text-default-900 font-medium text-base hover:text-primary transition-colors cursor-pointer"
                onClick={() => navigate(`/staffs/${s.id}`)}
            >
                {s.name}
            </span>
            <span className="text-default-500 text-xs">{s.department}</span>
        </div>
    </div>
</TableCell>
```

**Spacing:**
- Container: `gap-3` (12px)
- Avatar: `w-10 h-10` (40px)
- Name: `text-base` (16px)
- Subtitle: `text-xs` (12px)

**IMPORTANT - Clickable Name Rule:**
Staff/Student names should ALWAYS be clickable with hover effect:
```
hover:text-primary transition-colors cursor-pointer
```
This applies to all tables showing person names (Staff List, Payroll, Attendance, Students, etc.)

### Status Cell (Inline Dropdown Badge)
```jsx
<TableCell>
    <Dropdown>
        <DropdownTrigger>
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer border transition-all text-xs font-medium ${getStatusStyle(att.status)}`}>
                {getStatusIcon(att.status)}
                <span>{getStatusLabel(att.status)}</span>
                <ChevronDown size={12} className="opacity-50" />
            </div>
        </DropdownTrigger>
        <DropdownMenu
            aria-label="Change Status"
            onAction={(key) => handleStatusChange(s.id, key)}
        >
            <DropdownItem key="present" startContent={<Check size={14} className="text-success" />}>Present</DropdownItem>
            <DropdownItem key="halfday" startContent={<AlertCircle size={14} className="text-secondary" />}>Half Day</DropdownItem>
            <DropdownItem key="absent" startContent={<X size={14} className="text-danger" />}>Absent</DropdownItem>
            <DropdownItem key="leave" startContent={<Clock size={14} className="text-warning" />}>On Leave</DropdownItem>
            <DropdownItem key="unmarked" startContent={<Clock size={14} className="text-default-400" />}>Not Marked</DropdownItem>
        </DropdownMenu>
    </Dropdown>
</TableCell>
```

**Badge Spacing:** `px-3 py-1.5 gap-2` (12px horizontal, 6px vertical, 8px gap)

### Time Cells (Check In / Check Out)
```jsx
<TableCell>
    <span className="text-default-600 text-sm font-mono">
        {att.inTime}
    </span>
</TableCell>
```

### Attendance Progress Cell
```jsx
<TableCell>
    <div className="flex items-center gap-2">
        <Progress 
            value={overallPercentage} 
            size="sm"
            className="max-w-[150px]"
            classNames={{
                indicator: overallPercentage >= 90 
                    ? "bg-emerald-300" 
                    : overallPercentage >= 75 
                        ? "bg-amber-300" 
                        : "bg-rose-300",
                track: "bg-default-100"
            }}
        />
        <span className="text-xs font-semibold text-default-700 min-w-[32px]">{overallPercentage}%</span>
    </div>
</TableCell>
```

**Progress Colors:**
- >= 90%: `bg-emerald-300`
- >= 75%: `bg-amber-300`
- < 75%: `bg-rose-300`
- Track: `bg-default-100`

### Actions Cell
```jsx
<TableCell>
    <div className="flex justify-end">
        <Dropdown>
            <DropdownTrigger>
                <Button isIconOnly size="sm" variant="light" className="text-default-400">
                    <MoreVertical size={18} />
                </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Actions">
                <DropdownItem key="view" onPress={() => navigate(`/staffs/${s.id}`)}>View Profile</DropdownItem>
                <DropdownItem key="edit">Edit Attendance</DropdownItem>
            </DropdownMenu>
        </Dropdown>
    </div>
</TableCell>
```

---

## Section 10: Status Helper Functions

### getStatusStyle
```jsx
const getStatusStyle = (status) => {
    switch (status) {
        case "present": return "bg-success-50 border-success-200 text-success-700";
        case "absent": return "bg-danger-50 border-danger-200 text-danger-700";
        case "leave": return "bg-warning-50 border-warning-200 text-warning-700";
        case "halfday": return "bg-secondary-50 border-secondary-200 text-secondary-700";
        default: return "bg-default-100 border-default-200 text-default-600";
    }
};
```

### getStatusIcon
```jsx
const getStatusIcon = (status) => {
    switch (status) {
        case "present": return <Check size={14} className="text-success-600" />;
        case "absent": return <X size={14} className="text-danger-600" />;
        case "leave": return <Clock size={14} className="text-warning-600" />;
        case "halfday": return <AlertCircle size={14} className="text-secondary-600" />;
        default: return <Clock size={14} className="text-default-500" />;
    }
};
```

### getStatusLabel
```jsx
const getStatusLabel = (status) => {
    if (status === "unmarked") return "Not Marked";
    if (status === "halfday") return "Half Day";
    if (status === "leave") return "On Leave";
    return status.charAt(0).toUpperCase() + status.slice(1);
};
```

---

## Section 11: Modals

### Reason Modal
```jsx
<Modal isOpen={reasonModalOpen} onOpenChange={setReasonModalOpen} size="md">
    <ModalContent>
        {(onClose) => (
            <>
                <ModalHeader className="flex flex-col gap-1">
                    Enter Reason for {getStatusLabel(pendingStatus.status)}
                </ModalHeader>
                <ModalBody>
                    <Textarea
                        label="Reason"
                        placeholder="Please provide a reason..."
                        value={reason}
                        onValueChange={setReason}
                        minRows={3}
                        variant="bordered"
                    />
                </ModalBody>
                <ModalFooter>
                    <Button variant="light" onPress={onClose}>Cancel</Button>
                    <Button 
                        color="primary" 
                        onPress={pendingStatus.staffId === "bulk" ? handleBulkReasonConfirm : handleConfirmReason}
                    >
                        Confirm
                    </Button>
                </ModalFooter>
            </>
        )}
    </ModalContent>
</Modal>
```

### Download Report Modal
```jsx
<Modal isOpen={downloadModalOpen} onOpenChange={setDownloadModalOpen} size="md">
    <ModalContent>
        {(onClose) => (
            <>
                <ModalHeader>Download Attendance Report</ModalHeader>
                <ModalBody className="gap-4">
                    <Select
                        label="Report Type"
                        selectedKeys={new Set([downloadType])}
                        onSelectionChange={(keys) => setDownloadType(Array.from(keys)[0])}
                        variant="bordered"
                    >
                        <SelectItem key="this_week">This Week</SelectItem>
                        <SelectItem key="monthly">Monthly</SelectItem>
                        <SelectItem key="yearly">Yearly</SelectItem>
                        <SelectItem key="custom">Custom Date Range</SelectItem>
                    </Select>

                    {downloadType === "monthly" && (
                        <div className="flex gap-3">
                            <Select
                                label="Month"
                                selectedKeys={new Set([selectedMonth])}
                                onSelectionChange={(keys) => setSelectedMonth(Array.from(keys)[0])}
                                variant="bordered"
                                className="flex-1"
                            >
                                {months.map((month, index) => (
                                    <SelectItem key={index.toString()}>{month}</SelectItem>
                                ))}
                            </Select>
                            <Select
                                label="Year"
                                selectedKeys={new Set([selectedYear])}
                                onSelectionChange={(keys) => setSelectedYear(Array.from(keys)[0])}
                                variant="bordered"
                                className="flex-1"
                            >
                                {years.map(year => (
                                    <SelectItem key={year}>{year}</SelectItem>
                                ))}
                            </Select>
                        </div>
                    )}

                    {downloadType === "yearly" && (
                        <Select
                            label="Year"
                            selectedKeys={new Set([selectedYear])}
                            onSelectionChange={(keys) => setSelectedYear(Array.from(keys)[0])}
                            variant="bordered"
                        >
                            {years.map(year => (
                                <SelectItem key={year}>{year}</SelectItem>
                            ))}
                        </Select>
                    )}

                    {downloadType === "custom" && (
                        <div className="flex gap-3">
                            <Input
                                type="date"
                                label="Start Date"
                                value={customStartDate}
                                onValueChange={setCustomStartDate}
                                variant="bordered"
                                className="flex-1"
                            />
                            <Input
                                type="date"
                                label="End Date"
                                value={customEndDate}
                                onValueChange={setCustomEndDate}
                                variant="bordered"
                                className="flex-1"
                            />
                        </div>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button variant="light" onPress={onClose}>Cancel</Button>
                    <Button color="primary" startContent={<Download size={16} />} onPress={handleDownloadReport}>
                        Download
                    </Button>
                </ModalFooter>
            </>
        )}
    </ModalContent>
</Modal>
```

**Modal Spacing:**
- ModalBody: `gap-4` (16px between elements)
- Side-by-side selects: `flex gap-3` (12px gap)
- Select/Input: `className="flex-1"` for equal width

---

## Section 12: Lazy Loading (REQUIRED for Tables)

**CRITICAL RULE:** All tables MUST use lazy loading instead of pagination. Do NOT use the `Pagination` component with tables.

### Why Lazy Loading?
- Better UX with seamless scrolling
- No page jumps or context loss
- Consistent behavior across all list views
- Better performance for large datasets

### State Setup
```jsx
const ITEMS_PER_LOAD = 10;
const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
const [isLoading, setIsLoading] = useState(false);
const loaderRef = useRef(null);

const visibleStaff = useMemo(() => {
    return filteredStaff.slice(0, visibleCount);
}, [filteredStaff, visibleCount]);

const hasMore = visibleCount < filteredStaff.length;
```

### Reset on Filter Change
```jsx
useEffect(() => {
    setVisibleCount(ITEMS_PER_LOAD);
}, [searchQuery, statusFilter, sortDescriptor]);
```

### Intersection Observer
```jsx
useEffect(() => {
    const observer = new IntersectionObserver(
        (entries) => {
            if (entries[0].isIntersecting && hasMore && !isLoading) {
                setIsLoading(true);
                setTimeout(() => {
                    setVisibleCount(prev => prev + ITEMS_PER_LOAD);
                    setIsLoading(false);
                }, 300);
            }
        },
        { threshold: 0.1 }
    );

    if (loaderRef.current) {
        observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
}, [hasMore, isLoading]);
```

### Loader UI
```jsx
<div ref={loaderRef} className="flex justify-center py-4">
    {isLoading && (
        <Spinner size="sm" color="primary" />
    )}
    {!hasMore && filteredStaff.length > ITEMS_PER_LOAD && (
        <span className="text-default-400 text-sm">All {filteredStaff.length} staff members loaded</span>
    )}
</div>
```

**Spacing:** `py-4` (16px vertical padding)

---

## Section 13: Form Components

### Textarea (in Modal)
```jsx
<Textarea
    label="Reason"
    placeholder="Please provide a reason..."
    value={reason}
    onValueChange={setReason}
    minRows={3}
    variant="bordered"
/>
```

### Select (in Modal)
```jsx
<Select
    label="Report Type"
    selectedKeys={new Set([downloadType])}
    onSelectionChange={(keys) => setDownloadType(Array.from(keys)[0])}
    variant="bordered"
>
    <SelectItem key="value">Label</SelectItem>
</Select>
```

### Input Date (in Modal)
```jsx
<Input
    type="date"
    label="Start Date"
    value={customStartDate}
    onValueChange={setCustomStartDate}
    variant="bordered"
    className="flex-1"
/>
```

---

## Section 14: Button Variants

### HeroUI Button - Light (Cancel)
```jsx
<Button variant="light" onPress={onClose}>Cancel</Button>
```

### HeroUI Button - Primary (Confirm)
```jsx
<Button color="primary" onPress={handleAction}>Confirm</Button>
```

### HeroUI Button - Primary with Icon
```jsx
<Button color="primary" startContent={<Download size={16} />} onPress={handleDownloadReport}>
    Download
</Button>
```

### HeroUI Button - Icon Only
```jsx
<Button isIconOnly size="sm" variant="light" className="text-default-400">
    <MoreVertical size={18} />
</Button>
```

---

## Icon Sizes Reference

| Context | Size |
|---------|------|
| KPI Card icons | 18 |
| Toolbar button icons | 16 |
| Search icon | 16 |
| Clear search button | 14 |
| Date nav arrows | 14 |
| Chevron in dropdowns | 12-14 |
| Status badge icons | 14 |
| Dropdown item icons | 14 |
| Actions menu icon | 18 |
| Button startContent | 16 |

---

## Spacing Quick Reference

| Element | Spacing |
|---------|---------|
| KPI grid gap | `gap-4` (16px) |
| KPI card padding | `p-4` (16px) |
| KPI icon-label gap | `gap-2` (8px) |
| Toolbar padding | `py-4 px-6` |
| Toolbar gap | `gap-4` (16px) |
| Search input padding | `px-3 py-2` |
| Icon button padding | `p-2` (8px) |
| Text button padding | `px-3 py-2` |
| Button icon gap | `gap-2` (8px) |
| Table cell padding | `py-5` (20px) |
| Avatar-text gap | `gap-3` (12px) |
| Status badge padding | `px-3 py-1.5` |
| Progress-label gap | `gap-2` (8px) |
| Modal body gap | `gap-4` (16px) |
| Side-by-side inputs | `gap-3` (12px) |
| Loader padding | `py-4` (16px) |

---

## Color Reference

### Status Colors
| Status | Background | Border | Text | Icon |
|--------|------------|--------|------|------|
| present | `success-50` | `success-200` | `success-700` | `success-600` |
| absent | `danger-50` | `danger-200` | `danger-700` | `danger-600` |
| leave | `warning-50` | `warning-200` | `warning-700` | `warning-600` |
| halfday | `secondary-50` | `secondary-200` | `secondary-700` | `secondary-600` |
| unmarked | `default-100` | `default-200` | `default-600` | `default-500` |

### Progress Bar Colors
| Threshold | Color |
|-----------|-------|
| >= 90% | `bg-emerald-300` |
| >= 75% | `bg-amber-300` |
| < 75% | `bg-rose-300` |
| Track | `bg-default-100` |

### Text Colors
| Use | Color |
|-----|-------|
| Primary text | `text-default-900` |
| Secondary text | `text-default-600` |
| Muted text | `text-default-500` |
| Placeholder/icons | `text-default-400` |
| Table headers | `text-default-400` |
| Loaded message | `text-default-400` |

---

## Transition Classes

All interactive elements use:
```
transition-all duration-200
```

Or for colors only:
```
transition-colors
```


---

## Usage Guidelines

**IMPORTANT:** When applying this style guide to other pages:

1. **Replace pagination with lazy loading** - All tables MUST use lazy loading (intersection observer pattern), NOT pagination
2. **Only update existing component styles** - Don't add new components (like KPI cards) unless explicitly requested
3. **Focus on visual consistency** - Update:
   - Table `classNames` configuration
   - Search input styling (custom HTML instead of HeroUI Input)
   - Filter/dropdown button styling
   - Cell layouts and spacing
   - Status badge styling
   - Button variants
4. **Match spacing and colors** - Use the exact Tailwind classes documented above

---

## Page Structure Rules

**CRITICAL:** The toolbar/table negative margins (`-mx-6 -mt-6 px-6`) only work when the parent container has `px-6 py-6` padding.

### Pages with Card wrapper and padding (e.g., Staffs)
The parent has `px-6 py-6`, so child components use:
```jsx
// Toolbar
<div className="... -mx-6 -mt-6 px-6">

// Table
classNames={{
    base: "-mx-6 overflow-visible [&_table]:w-[calc(100%+3rem)]",
    ...
}}
```

### Pages without padding wrapper (e.g., Students)
Don't use negative margins:
```jsx
// Toolbar
<div className="... py-4">

// Table
classNames={{
    base: "overflow-visible [&_table]:border-spacing-0",
    ...
}}
```

**Check the parent structure before applying styles!**

---

## Lazy Loading (REQUIRED)

**CRITICAL:** All tables MUST use lazy loading. Do NOT use pagination with tables.

### State Setup
```jsx
const ITEMS_PER_LOAD = 10;
const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
const [isLoading, setIsLoading] = useState(false);
const loaderRef = useRef(null);

const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);
const hasMore = visibleCount < items.length;
```

### Reset on Filter Change
```jsx
useEffect(() => {
    setVisibleCount(ITEMS_PER_LOAD);
}, [searchQuery, filters, sortDescriptor]);
```

### Intersection Observer
```jsx
useEffect(() => {
    const observer = new IntersectionObserver(
        (entries) => {
            if (entries[0].isIntersecting && hasMore && !isLoading) {
                setIsLoading(true);
                setTimeout(() => {
                    setVisibleCount(prev => prev + ITEMS_PER_LOAD);
                    setIsLoading(false);
                }, 300);
            }
        },
        { threshold: 0.1 }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
}, [hasMore, isLoading]);
```

### Loader UI
```jsx
    {isLoading && <Spinner size="sm" color="primary" />}
    {!hasMore && items.length > ITEMS_PER_LOAD && (
        <span className="text-default-400 text-sm">All {items.length} items loaded</span>
    )}
</div>
```

---

## Section 10: Tooltips

All tooltips across the application should follow a standardized dark theme for high contrast.

### Standard Tooltip Implementation
```jsx
<Tooltip
    content="Tooltip Content Text"
    placement="top" // or right, bottom, left
    closeDelay={0}
    classNames={{
        content: "bg-black text-white rounded-lg",
    }}
>
    {/* Trigger Element */}
    <Button>Hover Details</Button>
</Tooltip>
```

### Complex Tooltip Content
For tooltips containing badges or icons:

```jsx
<Tooltip
    content={
        <div className="flex items-center gap-2">
            <span>Label Text</span>
            <Chip size="sm" variant="shadow" color="danger" className="h-4 min-w-4 px-1 text-[9px]">
                Badge
            </Chip>
        </div>
    }
    placement="right"
    closeDelay={0}
    classNames={{
        content: "bg-black text-white rounded-lg",
    }}
>
    {/* Trigger Element */}
</Tooltip>
```

### Key Props
- **classNames**: `{ content: "bg-black text-white rounded-lg" }` (REQUIRED)
- **closeDelay**: `0` (Recommended for snapper feel)
- **placement**: `top`, `bottom`, `left`, `right` as needed

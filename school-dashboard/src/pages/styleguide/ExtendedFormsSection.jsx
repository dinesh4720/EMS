import { useState } from "react";
import { Mail, CreditCard } from "lucide-react";

import Select from "../../components/ui/Select";
import MultiSelect from "../../components/ui/MultiSelect";
import Combobox from "../../components/ui/Combobox";
import Slider from "../../components/ui/Slider";
import OtpInput from "../../components/ui/OtpInput";
import DateRangePicker from "../../components/ui/DateRangePicker";
import FileUpload from "../../components/ui/FileUpload";
import ImageUpload from "../../components/ui/ImageUpload";
import SearchInput from "../../components/ui/SearchInput";
import SearchBar from "../../components/ui/SearchBar";
import ToolbarSearch from "../../components/ui/ToolbarSearch";
import FormInput from "../../components/ui/FormInput";
import FieldError from "../../components/ui/FieldError";
import FormActions from "../../components/ui/FormActions";
import Button from "../../components/ui/Button";

import { Story, StoryGroup, Code } from "./shared";

const SAMPLE_OPTIONS = [
  { value: "a", label: "Option A" },
  { value: "b", label: "Option B" },
  { value: "c", label: "Option C" },
];

const COMBO_OPTIONS = [
  { value: "math", label: "Mathematics", description: "Core subject" },
  { value: "sci", label: "Science", description: "Physics, Chemistry, Biology" },
  { value: "eng", label: "English", description: "Literature & Grammar" },
  { value: "hist", label: "History", description: "World & Indian history" },
  { value: "geo", label: "Geography", description: "Physical & Political" },
];

export default function ExtendedFormsSection() {
  const [selectVal, setSelectVal] = useState("");
  const [multiVal, setMultiVal] = useState(["a"]);
  const [comboVal, setComboVal] = useState("");
  const [sliderVal, setSliderVal] = useState(40);
  const [rangeVal, setRangeVal] = useState([20000, 60000]);
  const [otp, setOtp] = useState("");
  const [dates, setDates] = useState({ start: "", end: "" });
  const [files, setFiles] = useState([]);
  const [image, setImage] = useState(null);
  const [search, setSearch] = useState("");
  const [barSearch, setBarSearch] = useState("");
  const [toolSearch, setToolSearch] = useState("");

  return (
    <>
      <StoryGroup
        id="ext-forms-select"
        title="Select & Dropdowns"
        sub="Native select, multi-select, and searchable combobox."
      >
        <Story title="Select" layout="col">
          <div className="sg-form-grid">
            <Select
              label="Standard"
              placeholder="Choose…"
              value={selectVal}
              onChange={(e) => setSelectVal(e.target.value)}
              options={SAMPLE_OPTIONS}
            />
            <Select
              label="With error"
              placeholder="Choose…"
              options={SAMPLE_OPTIONS}
              error="This field is required"
            />
            <Select
              label="Small"
              size="sm"
              placeholder="Choose…"
              options={SAMPLE_OPTIONS}
            />
          </div>
        </Story>

        <Story title="MultiSelect" layout="col">
          <div className="sg-form-grid">
            <MultiSelect
              label="Subjects"
              placeholder="Pick subjects…"
              options={SAMPLE_OPTIONS}
              value={multiVal}
              onChange={setMultiVal}
            />
            <MultiSelect
              label="Max 2"
              placeholder="Pick up to 2…"
              options={SAMPLE_OPTIONS}
              value={multiVal}
              onChange={setMultiVal}
              maxSelections={2}
            />
          </div>
        </Story>

        <Story title="Combobox" layout="col">
          <div className="sg-form-grid">
            <Combobox
              label="Subject"
              placeholder="Search subjects…"
              options={COMBO_OPTIONS}
              value={comboVal}
              onChange={setComboVal}
              clearable
            />
          </div>
        </Story>
      </StoryGroup>

      <StoryGroup
        id="ext-forms-inputs"
        title="Specialised Inputs"
        sub="Sliders, OTP, date range, search boxes, and uploaders."
      >
        <Story title="Slider" layout="col">
          <div className="sg-form-grid">
            <div>
              <span className="sg-demo__label">Single</span>
              <Slider value={sliderVal} onChange={setSliderVal} min={0} max={100} legend />
              <Code>{sliderVal}</Code>
            </div>
            <div>
              <span className="sg-demo__label">Dual range</span>
              <Slider value={rangeVal} onChange={setRangeVal} min={0} max={100000} step={1000} legend />
              <Code>₹{rangeVal[0].toLocaleString()} – ₹{rangeVal[1].toLocaleString()}</Code>
            </div>
          </div>
        </Story>

        <Story title="OtpInput" layout="center">
          <OtpInput length={6} value={otp} onChange={setOtp} />
        </Story>

        <Story title="DateRangePicker" layout="center">
          <DateRangePicker
            startDate={dates.start}
            endDate={dates.end}
            onChange={setDates}
            placeholder="Pick a range"
          />
        </Story>

        <Story title="SearchInput" layout="col">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search students…"
          />
        </Story>

        <Story title="SearchBar" layout="col">
          <SearchBar
            value={barSearch}
            onChange={setBarSearch}
            placeholder="Search…"
            shortcut="/"
          />
        </Story>

        <Story title="ToolbarSearch" layout="col">
          <ToolbarSearch
            value={toolSearch}
            onChange={setToolSearch}
            placeholder="Search table…"
          />
        </Story>
      </StoryGroup>

      <StoryGroup
        id="ext-forms-upload"
        title="Upload"
        sub="File and image upload with drag-and-drop, validation, and previews."
      >
        <Story title="FileUpload" layout="col">
          <FileUpload
            label="Attachments"
            hint="PDF, JPG up to 5 MB"
            accept=".pdf,.jpg,.png"
            multiple
            value={files}
            onChange={setFiles}
          />
        </Story>

        <Story title="ImageUpload" layout="center">
          <ImageUpload
            label="Profile photo"
            shape="circle"
            value={image}
            onChange={setImage}
          />
        </Story>
      </StoryGroup>

      <StoryGroup
        id="ext-forms-helpers"
        title="Form Helpers"
        sub="Low-level building blocks used inside form fields."
      >
        <Story title="FormInput" layout="col">
          <div className="sg-form-grid">
            <FormInput
              label="Email"
              placeholder="user@school.edu"
              startContent={<Mail size={16} />}
            />
            <FormInput
              label="Card number"
              placeholder="0000 0000 0000 0000"
              startContent={<CreditCard size={16} />}
              error="Invalid card number"
            />
          </div>
        </Story>

        <Story title="FieldError" layout="row">
          <FieldError showIcon>Required field</FieldError>
          <FieldError>Plain text error</FieldError>
        </Story>

        <Story title="FormActions" layout="plain">
          <div className="border border-divider rounded-lg p-4">
            <div className="h-16 bg-surface-2 rounded mb-4" aria-hidden />
            <FormActions>
              <Button variant="ghost">Cancel</Button>
              <Button variant="primary">Save</Button>
            </FormActions>
          </div>
        </Story>
      </StoryGroup>
    </>
  );
}

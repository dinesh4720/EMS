import { useState } from "react";

import PhotoModal from "../../components/photo/PhotoModal";
import PhotoEditorModal from "../../components/photo/PhotoEditorModal";
import FileUploadProgress from "../../components/photo/FileUploadProgress";

import { Story, StoryGroup } from "./shared";

export default function PhotoMediaSection() {
  const [photoOpen, setPhotoOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);

  return (
    <>
      <StoryGroup
        id="photo-media"
        title="Photo & Media"
        sub="Image viewing, editing, capture, and upload progress."
      >
        <Story title="PhotoModal" layout="row">
          <button className="btn" onClick={() => setPhotoOpen(true)}>
            Open Photo Modal
          </button>
          {photoOpen && (
            <PhotoModal
              src=""
              alt="Demo"
              onClose={() => setPhotoOpen(false)}
            />
          )}
        </Story>

        <Story title="PhotoEditorModal" layout="row">
          <button className="btn" onClick={() => setEditorOpen(true)}>
            Open Photo Editor
          </button>
          {editorOpen && (
            <PhotoEditorModal
              image=""
              onClose={() => setEditorOpen(false)}
              onSave={() => setEditorOpen(false)}
            />
          )}
        </Story>

        <Story title="FileUploadProgress" layout="col">
          <FileUploadProgress fileName="document.pdf" progress={65} />
          <FileUploadProgress fileName="image.jpg" progress={100} />
        </Story>
      </StoryGroup>
    </>
  );
}

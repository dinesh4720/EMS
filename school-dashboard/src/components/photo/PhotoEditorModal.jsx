import React, { useState, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Slider, Tooltip } from "@heroui/react";
import { RotateCw, RotateCcw, ZoomIn, ZoomOut, FlipHorizontal, FlipVertical, Check, X, Move } from "lucide-react";
import getCroppedImg from "../../utils/canvasUtils";
import { useApp } from "../../context/AppContext";
import { useTranslation } from 'react-i18next';

const PhotoEditorModal = ({ isOpen, onClose, imageSrc, onSave }) => {
  const { t } = useTranslation();
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [rotation, setRotation] = useState(0);
    const [zoom, setZoom] = useState(1);
    const [aspect] = useState(1); // Square for profile
    const [flip, setFlip] = useState({ horizontal: false, vertical: false });
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [loading, setLoading] = useState(false);

    // Reset editing state when a new image is loaded or modal reopens
    useEffect(() => {
      if (isOpen && imageSrc) {
        setCrop({ x: 0, y: 0 });
        setRotation(0);
        setZoom(1);
        setFlip({ horizontal: false, vertical: false });
        setCroppedAreaPixels(null);
      }
    }, [isOpen, imageSrc]);

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        try {
            setLoading(true);
            const croppedImage = await getCroppedImg(
                imageSrc,
                croppedAreaPixels,
                rotation,
                flip
            );
            onSave(croppedImage);
            onClose();
        } catch (e) {
            console.error('❌ Error saving photo:', e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="2xl"
            zIndex={999999}
            portalContainer={document.body}
            classNames={{
                body: "p-0",
                base: "bg-background border border-default-200 z-[999999]",
                wrapper: "z-[999999]",
                backdrop: "z-[999999]",
            }}
        >
            <ModalContent>
                {(modalClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1 px-6 pt-6">
                            Edit Profile Photo
                            <p className="text-sm text-default-500 font-normal">Adjust your photo. Drag to reposition.</p>
                        </ModalHeader>
                        <ModalBody className="gap-6 overflow-hidden">
                            <div className="relative w-full h-[400px] bg-black/90">
                                <Cropper
                                    image={imageSrc}
                                    crop={crop}
                                    rotation={rotation}
                                    zoom={zoom}
                                    aspect={aspect}
                                    onCropChange={setCrop}
                                    onRotationChange={setRotation}
                                    onCropComplete={onCropComplete}
                                    onZoomChange={setZoom}
                                    transform={[
                                        `translate(${crop.x}px, ${crop.y}px)`,
                                        `rotateZ(${rotation}deg)`,
                                        `rotateY(${flip.horizontal ? 180 : 0}deg)`,
                                        `rotateX(${flip.vertical ? 180 : 0}deg)`,
                                        `scale(${zoom})`,
                                    ].join(" ")}
                                    style={{
                                        containerStyle: { background: "rgba(0,0,0,0.9)" },
                                        mediaStyle: {
                                            transform: `translate(${crop.x}px, ${crop.y}px) rotate(${rotation}deg) scale(${zoom}) scaleX(${flip.horizontal ? -1 : 1}) scaleY(${flip.vertical ? -1 : 1})`,
                                        }
                                    }}
                                />
                            </div>

                            <div className="px-6 space-y-6">
                                {/* Controls Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Zoom Control */}
                                    <div className="space-y-3">
                                        <label className="text-sm font-medium text-default-700 flex items-center justify-between">
                                            <span className="flex items-center gap-2"><ZoomIn size={16} /> Zoom</span>
                                            <span className="text-xs text-default-500">{Math.round((zoom - 1) * 100)}%</span>
                                        </label>
                                        <Slider
                                            size="sm"
                                            step={0.1}
                                            minValue={1}
                                            maxValue={3}
                                            aria-label={t('aria.buttons.zoom')}
                                            value={zoom}
                                            onChange={setZoom}
                                            className="max-w-md"
                                        />
                                    </div>

                                    {/* Rotation Control */}
                                    <div className="space-y-3">
                                        <label className="text-sm font-medium text-default-700 flex items-center justify-between">
                                            <span className="flex items-center gap-2"><RotateCw size={16} /> Rotate</span>
                                            <span className="text-xs text-default-500">{rotation}°</span>
                                        </label>
                                        <Slider
                                            size="sm"
                                            step={1}
                                            minValue={-180}
                                            maxValue={180}
                                            aria-label={t('aria.buttons.rotation')}
                                            value={rotation}
                                            onChange={setRotation}
                                            className="max-w-md"
                                        />
                                    </div>
                                </div>

                                {/* Buttons Row */}
                                <div className="flex flex-wrap items-center justify-center gap-4 py-2">
                                    <Tooltip content="Rotate -90°">
                                        <Button isIconOnly variant="flat" onPress={() => setRotation((r) => r - 90)}>
                                            <RotateCcw size={20} />
                                        </Button>
                                    </Tooltip>
                                    <Tooltip content="Rotate +90°">
                                        <Button isIconOnly variant="flat" onPress={() => setRotation((r) => r + 90)}>
                                            <RotateCw size={20} />
                                        </Button>
                                    </Tooltip>
                                    <div className="w-px h-8 bg-default-200 mx-2"></div>
                                    <Tooltip content="Flip Horizontal">
                                        <Button
                                            isIconOnly
                                            variant="flat"
                                            className={flip.horizontal ? "bg-primary-100 dark:bg-primary-900/40 text-primary" : ""}
                                            onPress={() => setFlip(prev => ({ ...prev, horizontal: !prev.horizontal }))}
                                        >
                                            <FlipHorizontal size={20} />
                                        </Button>
                                    </Tooltip>
                                    <Tooltip content="Flip Vertical">
                                        <Button
                                            isIconOnly
                                            variant="flat"
                                            className={flip.vertical ? "bg-primary-100 dark:bg-primary-900/40 text-primary" : ""}
                                            onPress={() => setFlip(prev => ({ ...prev, vertical: !prev.vertical }))}
                                        >
                                            <FlipVertical size={20} />
                                        </Button>
                                    </Tooltip>
                                    <div className="w-px h-8 bg-default-200 mx-2"></div>
                                    <Button
                                        size="sm"
                                        variant="flat"
                                        color="danger"
                                        onPress={() => {
                                            setCrop({ x: 0, y: 0 });
                                            setRotation(0);
                                            setZoom(1);
                                            setFlip({ horizontal: false, vertical: false });
                                        }}
                                    >
                                        Reset
                                    </Button>
                                </div>
                            </div>
                        </ModalBody>
                        <ModalFooter className="px-6 pb-6 pt-4 border-t border-default-100">
                            <Button variant="flat" color="default" onPress={() => { modalClose(); onClose(); }}>
                                Cancel
                            </Button>
                            <Button color="primary" onPress={handleSave} isLoading={loading} startContent={!loading && <Check size={18} />}>
                                Upload Photo
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export default PhotoEditorModal;

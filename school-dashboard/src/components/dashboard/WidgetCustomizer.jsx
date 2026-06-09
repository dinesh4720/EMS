import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  X,
  GripVertical,
  Eye,
  EyeOff,
  LayoutGrid,
  ArrowUp,
  ArrowDown,
  Check,
} from "lucide-react";
import { WIDGET_CATALOG, getWidgetMeta } from "./widgetRegistry";

function useBodyScrollLock(locked) {
  useEffect(() => {
    if (!locked) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [locked]);
}

function useFocusTrap(containerRef, isOpen) {
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const container = containerRef.current;
    const focusables = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (first) first.focus();

    function handleKeyDown(e) {
      if (e.key !== "Tab") return;
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    container.addEventListener("keydown", handleKeyDown);
    return () => container.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, containerRef]);
}

function WidgetItem({ widgetKey, label, visible, index, total, onToggle, onMoveUp, onMoveDown }) {
  return (
    <div className="widget-customizer__item" role="listitem">
      <div className="widget-customizer__drag" aria-hidden="true">
        <GripVertical size={14} className="text-fg-faint" />
      </div>
      <span className="widget-customizer__name">{label}</span>
      <div className="widget-customizer__actions">
        <button
          type="button"
          className="iconbtn iconbtn--sm"
          onClick={() => onMoveUp(index)}
          disabled={index === 0}
          aria-label={`Move ${label} up`}
          title="Move up"
        >
          <ArrowUp size={10} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="iconbtn iconbtn--sm"
          onClick={() => onMoveDown(index)}
          disabled={index === total - 1}
          aria-label={`Move ${label} down`}
          title="Move down"
        >
          <ArrowDown size={10} aria-hidden="true" />
        </button>
        <button
          type="button"
          className={`widget-customizer__visibility${visible ? " is-visible" : ""}`}
          onClick={() => onToggle(widgetKey)}
          aria-label={visible ? `Hide ${label} widget` : `Show ${label} widget`}
          title={visible ? "Hide widget" : "Show widget"}
        >
          {visible ? <Eye size={13} aria-hidden="true" /> : <EyeOff size={13} aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}

export default function WidgetCustomizer({
  isOpen,
  onClose,
  order,
  visible,
  onChangeOrder,
  onChangeVisible,
}) {
  useBodyScrollLock(isOpen);
  const overlayRef = useRef(null);
  useFocusTrap(overlayRef, isOpen);

  const [localOrder, setLocalOrder] = useState(order);
  const [localVisible, setLocalVisible] = useState(visible);

  useEffect(() => {
    if (isOpen) {
      setLocalOrder(order);
      setLocalVisible(visible);
    }
  }, [isOpen, order, visible]);

  const handleToggle = useCallback(
    (key) => {
      setLocalVisible((prev) => {
        const next = { ...prev, [key]: !prev[key] };
        return next;
      });
    },
    [setLocalVisible]
  );

  const handleMoveUp = useCallback(
    (index) => {
      if (index === 0) return;
      setLocalOrder((prev) => {
        const next = [...prev];
        [next[index - 1], next[index]] = [next[index], next[index - 1]];
        return next;
      });
    },
    [setLocalOrder]
  );

  const handleMoveDown = useCallback(
    (index) => {
      setLocalOrder((prev) => {
        if (index >= prev.length - 1) return prev;
        const next = [...prev];
        [next[index], next[index + 1]] = [next[index + 1], next[index]];
        return next;
      });
    },
    [setLocalOrder]
  );

  const handleSave = useCallback(() => {
    onChangeOrder(localOrder);
    onChangeVisible(localVisible);
    onClose();
  }, [localOrder, localVisible, onChangeOrder, onChangeVisible, onClose]);

  const handleReset = useCallback(() => {
    const defaults = Object.fromEntries(WIDGET_CATALOG.map((w) => [w.key, w.defaultVisible]));
    const defaultOrder = WIDGET_CATALOG.map((w) => w.key);
    setLocalOrder(defaultOrder);
    setLocalVisible(defaults);
  }, []);

  if (!isOpen) return null;

  const overlay = (
    <div ref={overlayRef} className="widget-customizer-overlay" role="dialog" aria-modal="true" aria-label="Customize dashboard" onClick={onClose}>
      <div className="widget-customizer" onClick={(e) => e.stopPropagation()}>
        <div className="widget-customizer__head">
          <div className="widget-customizer__title">
            <LayoutGrid size={16} aria-hidden="true" />
            Customize dashboard
          </div>
          <button type="button" className="iconbtn iconbtn--sm" onClick={onClose} aria-label="Close customizer">
            <X size={12} aria-hidden="true" />
          </button>
        </div>

        <div className="widget-customizer__body">
          <p className="widget-customizer__hint">
            Show, hide, and reorder widgets. Click Done when finished.
          </p>

          <div className="widget-customizer__list" role="list">
            {localOrder.map((key, i) => {
              const meta = getWidgetMeta(key);
              if (!meta) return null;
              return (
                <WidgetItem
                  key={key}
                  widgetKey={key}
                  label={meta.label}
                  visible={!!localVisible[key]}
                  index={i}
                  total={localOrder.length}
                  onToggle={handleToggle}
                  onMoveUp={handleMoveUp}
                  onMoveDown={handleMoveDown}
                />
              );
            })}
          </div>
        </div>

        <div className="widget-customizer__foot">
          <button type="button" className="btn btn--ghost" onClick={handleReset}>
            Reset to default
          </button>
          <button type="button" className="btn btn--accent" onClick={handleSave}>
            <Check size={13} aria-hidden="true" />
            Done
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}

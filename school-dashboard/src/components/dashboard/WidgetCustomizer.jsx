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

function WidgetItem({ widgetKey, label, visible, index, total, onToggle, onMoveUp, onMoveDown }) {
  return (
    <div className="widget-customizer__item">
      <div className="widget-customizer__drag">
        <GripVertical size={14} className="text-fg-faint" />
      </div>
      <span className="widget-customizer__name">{label}</span>
      <div className="widget-customizer__actions">
        <button
          type="button"
          className="iconbtn iconbtn--sm"
          onClick={() => onMoveUp(index)}
          disabled={index === 0}
          aria-label="Move up"
          title="Move up"
        >
          <ArrowUp size={10} />
        </button>
        <button
          type="button"
          className="iconbtn iconbtn--sm"
          onClick={() => onMoveDown(index)}
          disabled={index === total - 1}
          aria-label="Move down"
          title="Move down"
        >
          <ArrowDown size={10} />
        </button>
        <button
          type="button"
          className={`widget-customizer__visibility${visible ? " is-visible" : ""}`}
          onClick={() => onToggle(widgetKey)}
          aria-label={visible ? "Hide widget" : "Show widget"}
          title={visible ? "Hide widget" : "Show widget"}
        >
          {visible ? <Eye size={13} /> : <EyeOff size={13} />}
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
    <div className="widget-customizer-overlay" role="dialog" aria-modal="true" aria-label="Customize dashboard">
      <div className="widget-customizer" onClick={(e) => e.stopPropagation()}>
        <div className="widget-customizer__head">
          <div className="widget-customizer__title">
            <LayoutGrid size={16} />
            Customize Dashboard
          </div>
          <button type="button" className="iconbtn iconbtn--sm" onClick={onClose} aria-label="Close">
            <X size={12} />
          </button>
        </div>

        <div className="widget-customizer__body">
          <p className="widget-customizer__hint">
            Show, hide, and reorder widgets. Changes save automatically.
          </p>

          <div className="widget-customizer__list">
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
            <Check size={13} />
            Done
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}

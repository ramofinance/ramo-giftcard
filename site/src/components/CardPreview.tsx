import { useEffect, useRef, type PointerEvent } from "react";
import { CARD_H, CARD_W, defaultCardTextPositions, drawCard, ensureFont, getCardTextStyles, hitTestCardText, hitTestCardTextHandle } from "../lib/card";
import type { CardParams } from "../lib/card";
import { translate } from "../lib/i18n";
import type { CardTextField, CardTextPosition, CardTextStyle } from "../lib/templates";

type CardPreviewProps = CardParams & {
  selectedText?: CardTextField;
  onTextSelect?: (field: CardTextField) => void;
  onTextPositionChange?: (field: CardTextField, position: CardTextPosition) => void;
  onTextStyleChange?: (field: CardTextField, style: CardTextStyle) => void;
};

type DragAction =
  | { kind: "move" | "resize" | "rotate"; field: CardTextField; pointerId: number; start: CardTextPosition; position: CardTextPosition; style: CardTextStyle; startDistance: number; startAngle: number };
type PinchAction = { field: CardTextField; ids: [number, number]; distance: number; angle: number; center: CardTextPosition; position: CardTextPosition; style: CardTextStyle };

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const distance = (a: CardTextPosition, b: CardTextPosition) => Math.hypot(a.x - b.x, a.y - b.y);
const angle = (a: CardTextPosition, b: CardTextPosition) => Math.atan2(b.y - a.y, b.x - a.x);
const angleDelta = (current: number, start: number) => ((current - start + 540) % 360) - 180;

export default function CardPreview(props: CardPreviewProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const pointers = useRef(new Map<number, CardTextPosition>());
  const action = useRef<DragAction | null>(null);
  const pinch = useRef<PinchAction | null>(null);
  const key = JSON.stringify([props.template.id, props.senderName, props.receiverName, props.amount, props.token, props.cardText, props.cardFont, props.cardTextSize, props.cardTextRotation, props.language, props.cardTextPositions, props.cardTextColors, props.cardTextStyles, props.selectedText]);

  useEffect(() => {
    let cancelled = false;
    ensureFont(props.template).then(() => {
      if (!cancelled && ref.current) drawCard(ref.current, props, props.selectedText);
    });
    return () => { cancelled = true; };
  }, [key]);

  const canvasPosition = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: clamp(((event.clientX - rect.left) / rect.width) * CARD_W, 0, CARD_W),
      y: clamp(((event.clientY - rect.top) / rect.height) * CARD_H, 0, CARD_H)
    };
  };

  const setPosition = (field: CardTextField, point: CardTextPosition) => props.onTextPositionChange?.(field, {
    x: clamp(Math.round(point.x), 0, CARD_W),
    y: clamp(Math.round(point.y), 0, CARD_H)
  });

  const setStyle = (field: CardTextField, style: CardTextStyle) => props.onTextStyleChange?.(field, {
    font: style.font,
    size: clamp(Math.round(style.size), 10, 100),
    rotation: clamp(Math.round(style.rotation), -180, 180)
  });

  const onPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!props.selectedText || !props.onTextPositionChange || !props.onTextStyleChange) return;
    event.preventDefault();
    const point = canvasPosition(event);
    pointers.current.set(event.pointerId, point);
    event.currentTarget.setPointerCapture(event.pointerId);

    if (pointers.current.size >= 2) {
      const [firstId, secondId] = [...pointers.current.keys()].slice(0, 2);
      const first = pointers.current.get(firstId)!;
      const second = pointers.current.get(secondId)!;
      const field = props.selectedText;
      pinch.current = {
        field,
        ids: [firstId, secondId],
        distance: Math.max(1, distance(first, second)),
        angle: angle(first, second),
        center: { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 },
        position: props.cardTextPositions?.[field] ?? defaultCardTextPositions(props.template)[field]!,
        style: getCardTextStyles(props)[field]
      };
      action.current = null;
      return;
    }

    const selected = props.selectedText;
    const selectedPosition = props.cardTextPositions?.[selected] ?? defaultCardTextPositions(props.template)[selected]!;
    const selectedHandle = hitTestCardTextHandle(props, selected, point.x, point.y);
    if (selectedHandle) {
      action.current = {
        kind: selectedHandle,
        field: selected,
        pointerId: event.pointerId,
        start: point,
        position: selectedPosition,
        style: getCardTextStyles(props)[selected],
        startDistance: distance(selectedPosition, point),
        startAngle: angle(selectedPosition, point)
      };
      return;
    }

    const hit = hitTestCardText(props, point.x, point.y);
    const field = hit ?? selected;
    const position = props.cardTextPositions?.[field] ?? defaultCardTextPositions(props.template)[field]!;
    props.onTextSelect?.(field);
    action.current = {
      kind: "move",
      field,
      pointerId: event.pointerId,
      start: point,
      position,
      style: getCardTextStyles(props)[field],
      startDistance: 0,
      startAngle: 0
    };
  };

  const onPointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    const point = canvasPosition(event);
    pointers.current.set(event.pointerId, point);

    const pinchAction = pinch.current;
    if (pinchAction) {
      const first = pointers.current.get(pinchAction.ids[0]);
      const second = pointers.current.get(pinchAction.ids[1]);
      if (!first || !second) return;
      const center = { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
      setPosition(pinchAction.field, {
        x: pinchAction.position.x + center.x - pinchAction.center.x,
        y: pinchAction.position.y + center.y - pinchAction.center.y
      });
      setStyle(pinchAction.field, {
        ...pinchAction.style,
        size: pinchAction.style.size * distance(first, second) / pinchAction.distance,
        rotation: pinchAction.style.rotation + angleDelta(angle(first, second) * 180 / Math.PI, pinchAction.angle * 180 / Math.PI)
      });
      return;
    }

    const drag = action.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (drag.kind === "move") {
      setPosition(drag.field, { x: drag.position.x + point.x - drag.start.x, y: drag.position.y + point.y - drag.start.y });
    } else if (drag.kind === "resize") {
      setStyle(drag.field, { ...drag.style, size: drag.style.size * distance(drag.position, point) / Math.max(1, drag.startDistance) });
    } else {
      const change = angleDelta(angle(drag.position, point) * 180 / Math.PI, drag.startAngle * 180 / Math.PI);
      setStyle(drag.field, { ...drag.style, rotation: drag.style.rotation + change });
    }
  };

  const endPointer = (event: PointerEvent<HTMLCanvasElement>) => {
    pointers.current.delete(event.pointerId);
    if (pinch.current) {
      pinch.current = null;
      action.current = null;
    } else if (action.current?.pointerId === event.pointerId) {
      action.current = null;
    }
  };

  return (
    <canvas
      ref={ref}
      width={CARD_W}
      height={CARD_H}
      className={props.selectedText ? "card-canvas is-editing" : "card-canvas"}
      aria-label={translate(props.language, "templates.title")}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      onLostPointerCapture={endPointer}
    />
  );
}

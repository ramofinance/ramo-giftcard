import { useEffect, useRef, type PointerEvent } from "react";
import { CARD_H, CARD_W, defaultCardTextPositions, drawCard, ensureFont, hitTestCardText } from "../lib/card";
import type { CardParams } from "../lib/card";
import { translate } from "../lib/i18n";
import type { CardTextField, CardTextPosition } from "../lib/templates";

type CardPreviewProps = CardParams & {
  selectedText?: CardTextField;
  onTextSelect?: (field: CardTextField) => void;
  onTextPositionChange?: (field: CardTextField, position: CardTextPosition) => void;
};

export default function CardPreview(props: CardPreviewProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const dragging = useRef(false);
  const draggingField = useRef<CardTextField | undefined>(undefined);
  const dragOffset = useRef({ x: 0, y: 0 });
  const key = JSON.stringify([props.template.id, props.senderName, props.receiverName, props.amount, props.token, props.cardText, props.cardFont, props.cardTextSize, props.cardTextRotation, props.language, props.cardTextPositions, props.cardTextColors, props.selectedText]);

  useEffect(() => {
    let cancelled = false;
    ensureFont(props.template).then(() => {
      if (!cancelled && ref.current) drawCard(ref.current, props, props.selectedText);
    });
    return () => { cancelled = true; };
  }, [key]);

  const canvasPosition = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.round(((event.clientX - rect.left) / rect.width) * CARD_W);
    const y = Math.round(((event.clientY - rect.top) / rect.height) * CARD_H);
    return { x: Math.max(0, Math.min(CARD_W, x)), y: Math.max(0, Math.min(CARD_H, y)) };
  };

  const moveText = (event: PointerEvent<HTMLCanvasElement>) => {
    const field = draggingField.current;
    if (!field || !props.onTextPositionChange) return;
    const point = canvasPosition(event);
    props.onTextPositionChange(field, {
      x: Math.max(0, Math.min(CARD_W, point.x - dragOffset.current.x)),
      y: Math.max(0, Math.min(CARD_H, point.y - dragOffset.current.y))
    });
  };

  return (
    <canvas
      ref={ref}
      width={CARD_W}
      height={CARD_H}
      className={props.selectedText ? "card-canvas is-editing" : "card-canvas"}
      aria-label={translate(props.language, "templates.title")}
      onPointerDown={(event) => {
        if (!props.selectedText || !props.onTextPositionChange) return;
        const point = canvasPosition(event);
        const hit = hitTestCardText(props, point.x, point.y);
        const field = hit ?? props.selectedText;
        const position = props.cardTextPositions?.[field] ?? defaultCardTextPositions(props.template)[field]!;
        draggingField.current = field;
        dragOffset.current = hit ? { x: point.x - position.x, y: point.y - position.y } : { x: 0, y: 0 };
        dragging.current = true;
        props.onTextSelect?.(field);
        event.currentTarget.setPointerCapture(event.pointerId);
        if (!hit) moveText(event);
      }}
      onPointerMove={(event) => { if (dragging.current) moveText(event); }}
      onPointerUp={() => { dragging.current = false; draggingField.current = undefined; }}
      onPointerCancel={() => { dragging.current = false; draggingField.current = undefined; }}
    />
  );
}

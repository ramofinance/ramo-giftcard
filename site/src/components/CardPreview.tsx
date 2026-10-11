import { useEffect, useRef, type PointerEvent } from "react";
import { CARD_H, CARD_W, drawCard, ensureFont } from "../lib/card";
import type { CardParams } from "../lib/card";
import { translate } from "../lib/i18n";
import type { CardTextField, CardTextPosition } from "../lib/templates";

type CardPreviewProps = CardParams & {
  selectedText?: CardTextField;
  onTextPositionChange?: (field: CardTextField, position: CardTextPosition) => void;
};

export default function CardPreview(props: CardPreviewProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const dragging = useRef(false);
  const key = JSON.stringify([props.template.id, props.senderName, props.receiverName, props.amount, props.token, props.cardText, props.cardFont, props.cardTextSize, props.cardTextRotation, props.language, props.cardTextPositions, props.cardTextColors, props.selectedText]);

  useEffect(() => {
    let cancelled = false;
    ensureFont(props.template).then(() => {
      if (!cancelled && ref.current) drawCard(ref.current, props, props.selectedText);
    });
    return () => { cancelled = true; };
  }, [key]);

  const moveText = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!props.selectedText || !props.onTextPositionChange) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.round(((event.clientX - rect.left) / rect.width) * CARD_W);
    const y = Math.round(((event.clientY - rect.top) / rect.height) * CARD_H);
    props.onTextPositionChange(props.selectedText, { x: Math.max(0, Math.min(CARD_W, x)), y: Math.max(0, Math.min(CARD_H, y)) });
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
        dragging.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        moveText(event);
      }}
      onPointerMove={(event) => { if (dragging.current) moveText(event); }}
      onPointerUp={() => { dragging.current = false; }}
      onPointerCancel={() => { dragging.current = false; }}
    />
  );
}

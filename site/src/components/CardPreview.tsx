import { useEffect, useRef } from "react";
import { CARD_H, CARD_W, drawCard, ensureFont } from "../lib/card";
import type { CardParams } from "../lib/card";

export default function CardPreview(props: CardParams) {
  const ref = useRef<HTMLCanvasElement>(null);
  const key = JSON.stringify([props.template.id, props.senderName, props.receiverName, props.amount, props.token, props.cardText]);

  useEffect(() => {
    let cancelled = false;
    ensureFont().then(() => {
      if (!cancelled && ref.current) drawCard(ref.current, props);
    });
    return () => { cancelled = true; };
  }, [key]);

  return <canvas ref={ref} width={CARD_W} height={CARD_H} className="card-canvas" aria-label="پیش‌نمایش کارت هدیه" />;
}

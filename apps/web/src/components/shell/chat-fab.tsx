"use client";

import { MessagesSquare, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const STORAGE_KEY = "aimscams:chat-fab-position";
const FAB_SIZE = 60;
// The drag handle (24) sits left of the button, separated by an 8px gap.
const FAB_STACK_WIDTH = 24 + 8 + FAB_SIZE;

function clampToViewport(x: number, y: number) {
  const maxX = window.innerWidth - FAB_STACK_WIDTH - 8;
  const maxY = window.innerHeight - FAB_SIZE - 8;
  return {
    x: Math.max(8, Math.min(x, maxX)),
    y: Math.max(8, Math.min(y, maxY)),
  };
}

export function ChatFab() {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ x: number; y: number; btnX: number; btnY: number } | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setPosition(clampToViewport(parsed.x, parsed.y));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // A position saved on a larger window must not leave the button half off-screen.
  useEffect(() => {
    function onResize() {
      setPosition((current) => (current ? clampToViewport(current.x, current.y) : current));
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  function onPointerDown(e: React.PointerEvent) {
    if (!rootRef.current) return;
    const rect = rootRef.current.getBoundingClientRect();
    dragStart.current = { x: e.clientX, y: e.clientY, btnX: rect.left, btnY: rect.top };
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging || !dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPosition(clampToViewport(dragStart.current.btnX + dx, dragStart.current.btnY + dy));
  }

  function onPointerUp(e: React.PointerEvent) {
    if (!dragging) return;
    setDragging(false);
    const wasDrag = dragStart.current && (Math.abs(e.clientX - dragStart.current.x) > 3 || Math.abs(e.clientY - dragStart.current.y) > 3);
    dragStart.current = null;
    if (wasDrag && position) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(position)); } catch { /* ignore */ }
    }
  }

  function resetPosition() {
    setPosition(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }

  const style: React.CSSProperties = position
    ? { left: position.x, top: position.y, bottom: "auto", right: "auto" }
    : { bottom: 16, right: 20 };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div ref={rootRef} data-chat-fab-root className="fixed z-40 flex items-center gap-2" style={style}>
          <button
            type="button"
            aria-label="Drag chat button"
            className="grid size-6 place-items-center cursor-grab active:cursor-grabbing rounded"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onDoubleClick={resetPosition}
          >
            <span className="grid grid-cols-2 gap-[3px]">
              {Array.from({ length: 6 }).map((_, i) => (
                <span key={i} className="size-[3px] rounded-full bg-[#676565]" />
              ))}
            </span>
          </button>
          <button
            type="button"
            data-testid="chat-fab"
            aria-label="Open chat"
            className="grid size-[60px] place-items-center rounded-full bg-brand-fab text-on-primary shadow-lg outline-none transition-all duration-120 hover:bg-[#025f5d] hover:-translate-y-px focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-fab"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onDoubleClick={resetPosition}
          >
            <MessagesSquare className="size-[22px]" strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      </DialogTrigger>
      <DialogContent className="border border-card-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-fs font-bold text-strong">Support chat</DialogTitle>
          <DialogDescription>
            This is a local demonstration. Live chat connects when the Messages module ships.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg bg-accent-teal-bg p-4 text-fs text-brand">
          <p className="font-semibold">AIMSCAMS support</p>
          <p className="mt-1 text-body">
            Ask about posting, balances or a member account. No message leaves this browser.
          </p>
        </div>
        <Textarea
          aria-label="Message"
          placeholder="Write a message…"
          rows={3}
          className="min-h-24 resize-none"
        />
        <DialogFooter showCloseButton>
          <Button type="button" disabled>
            <Send aria-hidden="true" />
            Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

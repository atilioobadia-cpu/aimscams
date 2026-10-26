"use client";

import { MessageCircle, Send } from "lucide-react";

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

export function ChatFab() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          data-testid="chat-fab"
          aria-label="Open support chat"
          className="fixed bottom-8 right-8 z-50 grid size-[90px] place-items-center rounded-full bg-brand-fab text-on-primary shadow-lg outline-none transition-transform hover:scale-[1.03] focus-visible:ring-4 focus-visible:ring-ring/40"
        >
          <MessageCircle className="size-10" strokeWidth={1.8} aria-hidden="true" />
        </button>
      </DialogTrigger>
      <DialogContent className="border border-card-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-strong">Support chat</DialogTitle>
          <DialogDescription>
            This is a local demonstration. Live chat connects when the Messages module ships.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg bg-accent-teal-bg p-4 text-sm text-brand">
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

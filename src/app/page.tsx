"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { PlusIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { twMerge } from "tailwind-merge";
import {
  FileInputDropZone,
  FileInputDropZoneRef,
} from "./components/file-input";
import { MarqueeText } from "./components/marquee";

type Cell = {
  id: string;
  content: string | null;
};

const keyExample = [
  { key: "No Form" },
  { key: "Tgl Pesanan" },
  { key: "No Pelanggan" },
  { key: "No PO" },
  { key: "No Alamat" },
  { key: "Kena PPN" },
  { key: "Total Termasuk PPN" },
  { key: "Diskon Pesanan (Rp)" },
  { key: "Diskon Pesanan (%)" },
  { key: "Keterangan" },
  { key: "Nama Cabang" },
  { key: "Pengiriman" },
  { key: "Tgl Pengiriman" },
  { key: "FOB" },
  { key: "Syarat Pembayaran" },
  { key: "Syarat Pembayaran & Ketentuan" },
];

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => setIsMounted(true), []);

  const [cells, setCells] = useState<Cell[]>(
    Array.from({ length: 8 }).map((_, i) => ({
      id: `cell-${i}`,
      content: null,
    }))
  );
  const [files, setFiles] = useState<File[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggables, setDraggables] = useState(keyExample);
  const dropZoneRef = useRef<FileInputDropZoneRef>(null);

  const handleAddFile = useCallback((file: File | null) => {
    if (!file) return;
    setFiles((prev) => [...prev, file]);
  }, []);

  const handleDrop = (cellId: string, itemId: string) => {
    console.log("cellId => ", cellId);
    console.log("itemId => ", itemId);
    setCells((prev) =>
      prev.map((cell) =>
        cell.id === cellId ? { ...cell, content: itemId } : cell
      )
    );

    setDraggables((prev) => prev.filter((p) => p.key !== itemId));
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { over } = event;
    if (over && activeId) handleDrop(String(over.id), activeId);
  };

  const addColumn = () => {
    setCells((prev) => [...prev, { id: `cell-${prev.length}`, content: null }]);
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen items-center justify-center bg-zinc-50 font-sans">
      <main className="flex flex-col w-full px-16 bg-white py-24">
        <FileInputDropZone
          ref={dropZoneRef}
          className="mb-6 h-36 rounded-lg border-2 border-dashed border-gray-300 transition-colors hover:border-blue-400"
          acceptedFormat={["xlsx"]}
          onChange={(e) => handleAddFile(e.target.files?.[0] ?? null)}
          onDrop={(e) => handleAddFile(e.dataTransfer.files?.[0] ?? null)}
        />
        {cells.length > 0 && (
          <DndContext
            onDragEnd={onDragEnd}
            onDragStart={(event) => setActiveId(event.active.id as string)}
            onDragCancel={() => setActiveId(null)}
          >
            <div className="mb-6 gap-2 grid grid-cols-12">
              {draggables.map((ke, idx) => (
                <DraggableBox
                  key={`${ke.key}-${idx}`}
                  id={ke.key}
                  label={ke.key}
                />
              ))}
            </div>

            <div className="border-2 border-black rounded-md p-3 flex flex-nowrap overflow-x-auto gap-3 max-w-full scroll-smooth">
              {cells.map((cell) => (
                <DroppableCell key={cell.id} id={cell.id}>
                  {cell.content && (
                    <div className="bg-blue-500 text-white text-center rounded-md whitespace-nowrap w-40 h-16 flex justify-center items-center shrink-0">
                      {cell.content}
                    </div>
                  )}
                </DroppableCell>
              ))}

              <button
                onClick={addColumn}
                className="w-16 h-16 border-2 border-dashed border-gray-400 rounded-md flex items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-400 transition shrink-0"
              >
                <PlusIcon />
              </button>
            </div>

            {createPortal(
              <DragOverlay>
                {activeId ? (
                  <DraggableBox id={activeId} label={activeId} />
                ) : null}
              </DragOverlay>,
              document.body
            )}
          </DndContext>
        )}
      </main>
    </div>
  );
}

function DraggableBox({
  id,
  label,
  isOverlay = false,
}: {
  id: string;
  label: string;
  isOverlay?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id });

  const style: React.CSSProperties = isOverlay
    ? {
        cursor: "grabbing",
        transform: "scale(1.05)",
        transition: "transform 0.1s ease",
        opacity: 0.9,
        zIndex: 9999,
      }
    : {
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
        cursor: isDragging ? "grabbing" : "grab",
        touchAction: "none",
        zIndex: isDragging ? 9999 : "auto",
        transition: transform ? "transform 0.08s ease-out" : undefined,
        opacity: isDragging ? 0 : 1,
      };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className={twMerge(
        "select-none p-3 rounded-md text-white shadow-md text-center col-span-2 truncate whitespace-nowrap",
        isOverlay
          ? "bg-blue-400 scale-105"
          : isDragging
          ? "bg-blue-300 scale-105"
          : "bg-blue-600"
      )}
    >
      <MarqueeText text={label} />
    </div>
  );
}

function DroppableCell({
  id,
  children,
}: {
  id: string;
  children?: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={twMerge(
        "w-40 shrink-0 h-16 border-2 border-dashed rounded-md flex items-center justify-center transition-colors select-none truncate whitespace-nowrap",
        isOver ? "border-blue-400 bg-blue-50" : "border-gray-300"
      )}
    >
      {children}
    </div>
  );
}

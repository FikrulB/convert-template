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

/* ------------------------- Helpers ------------------------- */
function getExcelColumnName(index: number): string {
  let name = "";
  while (index >= 0) {
    name = String.fromCharCode((index % 26) + 65) + name;
    index = Math.floor(index / 26) - 1;
  }
  return name;
}

/* ------------------------- Types & Constants ------------------------- */
type Cell = { id: string; content: string | null };
const INITIAL_KEYS = [
  "No Form",
  "Tgl Pesanan",
  "No Pelanggan",
  "No PO",
  "No Alamat",
  "Kena PPN",
  "Total Termasuk PPN",
  "Diskon Pesanan (Rp)",
  "Diskon Pesanan (%)",
  "Keterangan",
  "Nama Cabang",
  "Pengiriman",
  "Tgl Pengiriman",
  "FOB",
  "Syarat Pembayaran",
  "Syarat Pembayaran & Ketentuan",
].map((key) => ({ key }));

/* ---------------------------- Main Page ---------------------------- */
export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [cells, setCells] = useState<Cell[]>(
    Array.from({ length: 25 }, (_, i) => ({
      id: getExcelColumnName(i),
      content: null,
    }))
  );
  const [draggables, setDraggables] = useState(INITIAL_KEYS);
  const [files, setFiles] = useState<File[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const dropZoneRef = useRef<FileInputDropZoneRef>(null);

  useEffect(() => setIsMounted(true), []);

  /* ------------------------- Handlers ------------------------- */
  const handleAddFile = useCallback((file: File | null) => {
    if (file) setFiles((prev) => [...prev, file]);
  }, []);

  const handleDrop = useCallback(
    (cellId: string, itemId: string) => {
      setCells((prevCells) =>
        prevCells.map((cell) => {
          const isTargetCell = cell.id === cellId;
          const hasSameContent = cell.content === itemId;

          if (isTargetCell)
            return { ...cell, content: hasSameContent ? null : itemId };

          if (hasSameContent) return { ...cell, content: null };

          return cell;
        })
      );

      setDraggables((prev) => {
        const replacedKey = cells.find((c) => c.id === cellId)?.content;
        const updated = replacedKey
          ? [...prev, { key: replacedKey }]
          : [...prev];
        return updated.filter((d) => d.key !== itemId);
      });
    },
    [cells]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { over } = event;
      if (over && activeId) handleDrop(over.id as string, activeId);
      setActiveId(null);
    },
    [activeId, handleDrop]
  );

  const addColumn = useCallback(() => {
    setCells((prev) => [
      ...prev,
      { id: getExcelColumnName(prev.length), content: null },
    ]);
  }, []);

  if (!isMounted) return null;

  /* ---------------------------- Render ---------------------------- */
  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      <main className="flex flex-col w-full px-16 bg-white py-24">
        {/* File Input */}
        <FileInputDropZone
          ref={dropZoneRef}
          className="mb-6 h-36 rounded-lg border-2 border-dashed border-gray-300 transition-colors hover:border-blue-400"
          acceptedFormat={["xlsx"]}
          onChange={(e) => handleAddFile(e.target.files?.[0] ?? null)}
          onDrop={(e) => handleAddFile(e.dataTransfer.files?.[0] ?? null)}
        />

        {/* DnD Context */}
        <DndContext
          onDragStart={(e) => setActiveId(e.active.id as string)}
          onDragCancel={() => setActiveId(null)}
          onDragEnd={handleDragEnd}
        >
          {/* Draggables */}
          <div className="mb-6 grid grid-cols-12 gap-2">
            {draggables.map(({ key }) => (
              <DraggableBox key={key} id={key} label={key} />
            ))}
          </div>

          {/* Drop Zone */}
          <div className="border-2 border-black rounded-md p-3 flex flex-nowrap overflow-x-auto gap-3 max-w-full scroll-smooth scroll-auto-hide">
            {cells.map((cell) => (
              <DroppableCell key={cell.id} id={cell.id}>
                {cell.content && cell.content !== null && (
                  <DraggableBox
                    key={cell.content}
                    id={cell.content}
                    label={cell.content ? cell.content : "iUh"}
                    // label="IUH"
                  />
                  // <div className="bg-blue-500 text-white text-center rounded-md whitespace-nowrap w-40 h-12 flex justify-center items-center shrink-0 p-3">
                  //   <MarqueeText text={cell.content} />
                  // </div>
                )}
              </DroppableCell>
            ))}

            {/* Add Column Button */}
            <button
              onClick={addColumn}
              className="w-16 h-12 border-2 border-dashed border-gray-400 rounded-md flex items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-400 transition shrink-0"
            >
              <PlusIcon />
            </button>
          </div>

          {/* Drag Overlay */}
          {createPortal(
            <DragOverlay>
              {activeId && (
                <DraggableBox id={activeId} label={activeId} isOverlay />
              )}
            </DragOverlay>,
            document.body
          )}
        </DndContext>
      </main>
    </div>
  );
}

/* ---------------------------- Components ---------------------------- */
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
        transition: "transform 0.1s ease, opacity 0.1s ease",
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
        transition: "transform 0.08s ease-out",
        opacity: isDragging ? 0 : 1,
      };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className={twMerge(
        "select-none p-3 rounded-md text-white shadow-md text-center col-span-2 truncate whitespace-nowrap flex justify-center items-center shrink-0 w-full",
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
// <div className="bg-blue-500 text-white text-center rounded-md whitespace-nowrap w-40 h-12 flex justify-center items-center shrink-0 p-3">

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
        "w-40 shrink-0 h-12 rounded-md flex items-center justify-center transition-colors select-none truncate whitespace-nowrap",
        isOver ? "border-blue-400 bg-blue-50" : "border-gray-300",
        children ? "" : "border-2 border-dashed"
      )}
    >
      {children}
    </div>
  );
}

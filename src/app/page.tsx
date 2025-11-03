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
  const [rows, setRows] = useState<Record<number, Cell[]>>(
    Object.fromEntries(
      Array.from({ length: 30 }, (_, index) => [
        index,
        Array.from({ length: 26 }, (_, idx) => ({
          id: `${getExcelColumnName(idx)}${index + 1}`,
          content: null,
        })),
      ])
    )
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
    (cellId: string, content: string) => {
      setRows((prev) => {
        const targetKey = Number(cellId.replace(/[A-Za-z]+/g, "")) - 1;

        const updatedRows = Object.entries(prev).reduce((acc, [key, row]) => {
          const rowIndex = Number(key);
          acc[rowIndex] = row.map((cell) => {
            const isTarget = rowIndex === targetKey && cell.id === cellId;
            const hasSameContent = cell.content === content;

            if (isTarget)
              return { ...cell, content: hasSameContent ? null : content };

            if (hasSameContent) return { ...cell, content: null };

            return cell;
          });

          return acc;
        }, {} as Record<number, (typeof prev)[number]>);

        return updatedRows;
      });

      setDraggables((prev) => {
        const replacedKey = cells.find((c) => c.id === cellId)?.content;
        const updated = replacedKey
          ? [...prev, { key: replacedKey }]
          : [...prev];
        return updated.filter((d) => d.key !== content);
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
    setRows((prev) => {
      const newRows = { ...prev };
      Object.entries(newRows).forEach(([i, cell], idx) => {
        const newRow = [...newRows[Number(i)]];
        newRow.push({
          id: `${getExcelColumnName(newRow.length)}${idx + 1}`,
          content: null,
        });
        newRows[Number(i)] = newRow;
      });
      return newRows;
    });
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
          <div className="relative flex border-2 border-black rounded-md gap-3 max-h-80 group">
            {/* Konten scrollable */}
            <div className="flex flex-col gap-3 items-start overflow-auto p-3 pr-24 w-full">
              {Object.entries(rows).map(([row, columns], idx) => (
                <div key={`${row}-${idx}`} className="flex flex-nowrap gap-3">
                  {columns.map((cell, i) => (
                    <DroppableCell key={cell.id} id={cell.id}>
                      {cell.content && (
                        <DraggableBox id={cell.content} label={cell.content} />
                      )}
                    </DroppableCell>
                  ))}
                </div>
              ))}
            </div>

            {/* Tombol fixed di kanan */}
            <div className="absolute top-0 right-0 bottom-0 w-20 bg-white shadow shadow-gray-400 p-3 transition-all duration-300 opacity-0 group-hover:opacity-100">
              <button
                onClick={addColumn}
                className="w-full h-full border-2 border-dashed border-gray-400 rounded-md flex items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-400"
              >
                <PlusIcon />
              </button>
            </div>
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
        children ? "" : "border-2 border-dashed text-gray-300"
      )}
    >
      {children ?? id}
    </div>
  );
}

"use client";

import { FileIcon, Upload } from "lucide-react";
import React, { useCallback, useId, useState } from "react";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";

export type Format = "jpg" | "png" | "gif" | "pdf" | "jpeg" | "xlsx" | "xls";

export interface FileInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  acceptedFormat: Format[];
  classLabel?: string;
  children?: React.ReactNode;
  title?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
  multiple?: boolean;
  disabled?: boolean;
}

export interface FileInputDropZoneRef {
  resetFile: () => void;
}

const mimeMap: Record<Format, string> = {
  jpg: "image/jpg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  pdf: "application/pdf",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xls: "application/vnd.ms-excel",
};

function EmptyState({ acceptedFormat }: { acceptedFormat: string[] }) {
  return (
    <>
      <Upload className="mb-3 h-8 w-8 text-gray-500 dark:text-gray-400" />
      <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
        Klik atau seret dokumen ke sini
      </p>
      <div className="flex flex-col items-center justify-center">
        <span className="text-xs text-gray-400">Format diperbolehkan:</span>
        <span className="text-xs text-gray-400">
          {acceptedFormat.join(" / ")}
        </span>
      </div>
    </>
  );
}

function FileState({ file }: { file: File }) {
  return (
    <>
      <FileIcon className="h-8 w-8 text-blue-500" />
      <p className="truncate text-sm font-medium text-gray-700">{file.name}</p>
      <span className="text-xs text-gray-900">
        {(file.size / 1024).toFixed(1)} KB
      </span>
    </>
  );
}

export const FileInputDropZone = React.forwardRef<
  FileInputDropZoneRef,
  FileInputProps
>(
  (
    {
      className,
      classLabel,
      acceptedFormat,
      children,
      onChange,
      onDrop,
      multiple,
      disabled,
      ...props
    },
    ref
  ) => {
    const reactId = useId();
    const [uniqueId] = React.useState(() => `file-input-${reactId}`);
    const [isDragOver, setIsDragOver] = useState(false);
    const [file, setFile] = useState<File>();
    const acceptedMimes = acceptedFormat.map((f) => mimeMap[f]);
    const inputRef = React.useRef<HTMLInputElement | null>(null);

    React.useImperativeHandle(ref, () => ({
      resetFile: () => {
        setFile(undefined);
        if (inputRef.current) {
          inputRef.current.value = "";
        }
      },
    }));

    const handleFile = useCallback(
      (selectedFile: File | null) => {
        if (!selectedFile) return false;
        if (!acceptedMimes.includes(selectedFile.type)) {
          toast.error(
            "Tipe file salah. Harap pilih sesuai format yang diperbolehkan."
          );
          return false;
        }
        return true;
      },
      [acceptedMimes]
    );

    const handlerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newFile = e.target.files?.[0] ?? null;
      if (handleFile(newFile)) {
        setFile(newFile!);
        onChange?.(e);
      }
    };

    const handleDropFile = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      const newFile = e.dataTransfer.files?.[0] ?? null;
      if (handleFile(newFile)) {
        setFile(newFile!);
        onDrop?.(e);
      }
    };

    return (
      <div
        className={twMerge(
          "w-full rounded-lg border-2 border-dashed border-gray-300",
          !disabled &&
            "transition hover:border-blue-500 hover:bg-blue-50/40 dark:border-gray-600 dark:hover:border-blue-400 dark:hover:bg-blue-900/20",
          isDragOver && "border-blue-500 bg-blue-50/40",
          className
        )}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragOver(true);
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragOver(false);
        }}
        onDrop={!disabled ? handleDropFile : undefined}
      >
        <label
          htmlFor={uniqueId}
          className={twMerge(
            "flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 p-4 text-center",
            classLabel
          )}
        >
          {multiple ? (
            <EmptyState acceptedFormat={acceptedFormat} />
          ) : !file ? (
            <EmptyState acceptedFormat={acceptedFormat} />
          ) : (
            <FileState file={file} />
          )}
          <input
            id={uniqueId}
            type="file"
            multiple={multiple}
            accept={acceptedMimes.join(", ")}
            className="hidden"
            disabled={disabled}
            ref={inputRef}
            onChange={handlerChange}
            {...props}
          />
        </label>
        {children}
      </div>
    );
  }
);

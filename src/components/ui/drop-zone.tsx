"use client";

import { useState, useCallback, DragEvent } from "react";
import { Upload, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropZoneProps {
  onFiles: (files: File[]) => void;
  accept: string;
  loading?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function DropZone({ onFiles, accept, loading, className, children }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer?.items?.length) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOut = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer?.files?.length) {
        const files = Array.from(e.dataTransfer.files).filter((file) => {
          const acceptTypes = accept.split(",").map((t) => t.trim());
          return acceptTypes.some((type) => {
            if (type.endsWith("/*")) {
              return file.type.startsWith(type.replace("/*", "/"));
            }
            return file.type === type;
          });
        });
        if (files.length) onFiles(files);
      }
    },
    [accept, onFiles]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      onFiles(Array.from(e.target.files));
      e.target.value = "";
    }
  };

  return (
    <label
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={cn(
        "flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer transition-colors",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-border hover:border-muted-foreground/50 hover:bg-muted/30",
        loading && "pointer-events-none opacity-50",
        className
      )}
    >
      <input
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={handleChange}
        disabled={loading}
      />
      {loading ? (
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      ) : children ? (
        children
      ) : (
        <>
          <Upload className="w-6 h-6 text-muted-foreground mb-2" />
          <span className="text-xs text-muted-foreground">Drop or click</span>
        </>
      )}
    </label>
  );
}

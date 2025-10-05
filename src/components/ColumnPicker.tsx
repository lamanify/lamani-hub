import { useState, useEffect } from "react";
import { Columns3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface Column {
  key: string;
  label: string;
  isCore?: boolean;
}

interface ColumnPickerProps {
  columns: Column[];
  selectedColumns: string[];
  onColumnsChange: (columns: string[]) => void;
}

export function ColumnPicker({ columns, selectedColumns, onColumnsChange }: ColumnPickerProps) {
  const [open, setOpen] = useState(false);

  const coreColumns = columns.filter((c) => c.isCore);
  const customColumns = columns.filter((c) => !c.isCore);

  const toggleColumn = (columnKey: string) => {
    if (selectedColumns.includes(columnKey)) {
      onColumnsChange(selectedColumns.filter((k) => k !== columnKey));
    } else {
      onColumnsChange([...selectedColumns, columnKey]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Columns3 className="h-4 w-4" />
          Columns
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-3">Core Fields</h4>
            <div className="space-y-2">
              {coreColumns.map((column) => (
                <div key={column.key} className="flex items-center gap-2">
                  <Checkbox
                    id={`col-${column.key}`}
                    checked={true}
                    disabled={true}
                  />
                  <Label
                    htmlFor={`col-${column.key}`}
                    className="text-sm text-muted-foreground cursor-not-allowed"
                  >
                    {column.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {customColumns.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold mb-3">Custom Fields</h4>
                <div className="space-y-2">
                  {customColumns.map((column) => (
                    <div key={column.key} className="flex items-center gap-2">
                      <Checkbox
                        id={`col-${column.key}`}
                        checked={selectedColumns.includes(column.key)}
                        onCheckedChange={() => toggleColumn(column.key)}
                      />
                      <Label
                        htmlFor={`col-${column.key}`}
                        className="text-sm cursor-pointer"
                      >
                        {column.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

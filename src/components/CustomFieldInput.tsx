import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

interface CustomFieldInputProps {
  field: {
    key: string;
    label: string;
    data_type: string;
    description: string | null;
    is_required: boolean;
  };
  value: any;
  onChange: (key: string, value: any) => void;
  error?: string;
}

export function CustomFieldInput({ field, value, onChange, error }: CustomFieldInputProps) {
  const renderInput = () => {
    switch (field.data_type) {
      case "number":
        return (
          <Input
            type="number"
            value={value ?? ""}
            onChange={(e) => onChange(field.key, e.target.value ? parseFloat(e.target.value) : null)}
            placeholder={field.description || undefined}
            required={field.is_required}
          />
        );

      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={value === true}
              onCheckedChange={(checked) => onChange(field.key, checked)}
            />
            <span className="text-sm text-muted-foreground">
              {value === true ? "Yes" : "No"}
            </span>
          </div>
        );

      case "date":
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !value && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value ? format(new Date(value), "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={value ? new Date(value) : undefined}
                onSelect={(date) => onChange(field.key, date?.toISOString())}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        );

      case "email":
        return (
          <Input
            type="email"
            value={value ?? ""}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={field.description || undefined}
            required={field.is_required}
          />
        );

      case "phone":
        return (
          <Input
            type="tel"
            value={value ?? ""}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={field.description || undefined}
            required={field.is_required}
          />
        );

      case "url":
        return (
          <Input
            type="url"
            value={value ?? ""}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={field.description || undefined}
            required={field.is_required}
          />
        );

      default: // string
        return (
          <Input
            type="text"
            value={value ?? ""}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={field.description || undefined}
            required={field.is_required}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {field.label}
        {field.is_required && <span className="text-destructive ml-1">*</span>}
      </label>
      {renderInput()}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

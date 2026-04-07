"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { type DateRange } from "react-day-picker";
import { useRouter } from "next/navigation";

interface DateRangeFilterProps {
  defaultFrom?: string;
  defaultTo?: string;
}

export function DateRangeFilter({
  defaultFrom,
  defaultTo,
}: DateRangeFilterProps) {
  const router = useRouter();

  const [date, setDate] = React.useState<DateRange | undefined>({
    from: defaultFrom ? new Date(defaultFrom + "T00:00:00") : new Date(),
    to: defaultTo ? new Date(defaultTo + "T00:00:00") : new Date(),
  });

  const handleFilter = () => {
    if (!date?.from) return;
    const from = format(date.from, "yyyy-MM-dd");
    const to = date.to ? format(date.to, "yyyy-MM-dd") : from;
    router.push(`/dashboard?from=${from}&to=${to}`);
  };

  const handleReset = () => {
    const today = new Date();
    setDate({ from: today, to: today });
    router.push("/dashboard");
  };

  return (
    <div className="flex gap-3 items-end flex-wrap">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Periode</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="justify-start px-3 font-normal min-w-[260px]"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "dd MMM yyyy")} –{" "}
                    {format(date.to, "dd MMM yyyy")}
                  </>
                ) : (
                  format(date.from, "dd MMM yyyy")
                )
              ) : (
                <span>Pilih tanggal</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={setDate}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      <Button onClick={handleFilter}>Filter</Button>
      <Button variant="outline" onClick={handleReset}>
        Reset
      </Button>
    </div>
  );
}

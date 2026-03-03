"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function DatePicker({ date, setDate }: { date?: Date; setDate: (date?: Date) => void }) {
    return (
        <Popover>
            <PopoverTrigger className="w-full">
                <Button
                    variant="outline"
                    data-empty={!date}
                    className={cn("w-full justify-between text-left font-normal", !date && "text-muted-foreground")}
                    type="button"
                >
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                    <ChevronDownIcon className="h-4 w-4 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={date} onSelect={setDate} />
            </PopoverContent>
        </Popover>
    );
}

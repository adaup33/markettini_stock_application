"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StockSymbolSearchProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function StockSymbolSearch({ value, onChange, placeholder = "Search symbol..." }: StockSymbolSearchProps) {
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [stocks, setStocks] = useState<Array<{ symbol: string; name: string }>>([]);
    const [loading, setLoading] = useState(false);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Debounce search
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        if (searchTerm.length < 1) {
            setStocks([]);
            return;
        }

        debounceTimer.current = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/search-stocks?q=${encodeURIComponent(searchTerm)}`);
                if (res.ok) {
                    const data = await res.json();
                    const formatted = (Array.isArray(data) ? data : [])
                        .slice(0, 10)
                        .map((s: any) => ({
                            symbol: s.symbol,
                            name: s.name || s.symbol,
                        }));
                    setStocks(formatted);
                }
            } catch (e) {
                console.error("Failed to search stocks", e);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, [searchTerm]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between bg-gray-900/60 border-gray-800 hover:bg-gray-900 hover:border-gray-700"
                >
                    {value || placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 bg-gray-900 border-gray-800">
                <Command className="bg-gray-900">
                    <CommandInput 
                        placeholder="Type to search..." 
                        value={searchTerm}
                        onValueChange={setSearchTerm}
                        className="bg-gray-900 text-gray-100"
                    />
                    <CommandList className="bg-gray-900">
                        {loading ? (
                            <div className="flex items-center justify-center py-6">
                                <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                            </div>
                        ) : (
                            <>
                                <CommandEmpty className="text-gray-500 py-6 text-center">
                                    {searchTerm.length > 0 ? "No stocks found." : "Start typing to search..."}
                                </CommandEmpty>
                                {stocks.length > 0 && (
                                    <CommandGroup className="bg-gray-900">
                                        {stocks.map((stock) => (
                                            <CommandItem
                                                key={stock.symbol}
                                                value={stock.symbol}
                                                onSelect={(currentValue) => {
                                                    onChange(currentValue.toUpperCase());
                                                    setOpen(false);
                                                    setSearchTerm("");
                                                }}
                                                className="cursor-pointer hover:bg-gray-800 text-gray-100"
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        value === stock.symbol ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{stock.symbol}</span>
                                                    <span className="text-xs text-gray-500">{stock.name}</span>
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                )}
                            </>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

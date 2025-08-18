'use client'

import { Popover, PopoverTrigger, PopoverContent } from '@radix-ui/react-popover'
import {
    DayPicker,
} from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import { format, parseISO } from 'date-fns'
import { CalendarDaysIcon, Check, ChevronDown } from 'lucide-react'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import * as RadixSelect from '@radix-ui/react-select'

interface CustomDatePickerProps {
    value?: string
    onChange?: (val: string) => void
    disabled?: boolean
    className?: string
    buttonClassName?: string
    calendarClassName?: string
    id?: string
    formatValue?: string
}

export default function CustomDatePicker({
    value,
    onChange,
    disabled = false,
    className = '',
    buttonClassName = '',
    calendarClassName = '',
    id,
    formatValue = 'PPP',
}: CustomDatePickerProps) {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(
        value ? parseISO(value) : undefined
    )

    useEffect(() => {
        if (value && !selectedDate) {
            setSelectedDate(parseISO(value))
        }
    }, [value])

    const handleDateSelect = (date?: Date) => {
        setSelectedDate(date)
        if (date && onChange) {
            const formatted = format(date, formatValue)
            onChange(formatted)
        }
    }

    return (
        <div className={clsx('w-full', className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        id={id}
                        disabled={disabled}
                        className={clsx(
                            'w-full flex items-center justify-between border rounded-[10px] px-4 py-3 text-left text-sm sm:text-base transition-all duration-300 bg-white',
                            selectedDate
                                ? 'border-gray-300 text-gray-900'
                                : 'border-gray-300 text-gray-700',
                            'focus:outline-none focus:ring-1 focus:ring-gray-400',
                            disabled && 'cursor-not-allowed opacity-50',
                            buttonClassName
                        )}
                    >
                        {selectedDate ? format(selectedDate, formatValue) : 'DD/MM/YYYY'}
                        <CalendarDaysIcon className="ml-2 h-5 w-5 opacity-70" />
                    </button>
                </PopoverTrigger>
                <PopoverContent
                    side="bottom"
                    align="end"
                    className="z-50 rounded-xl border border-gray-200 bg-white shadow-xl p-2 overflow-visible"
                >
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    >
                        <DayPicker
                            mode="single"
                            selected={selectedDate}
                            onSelect={handleDateSelect}
                            defaultMonth={selectedDate}
                            disabled={disabled}
                            className={clsx('rounded-md text-sm', calendarClassName)}
                            captionLayout="dropdown"
                            fromYear={1900}
                            toYear={new Date().getFullYear()}
                            components={{
                                DropdownNav: ({ children }) => (
                                    <div className="flex gap-2 items-center justify-between">
                                        {children}
                                    </div>
                                ),
                                Dropdown: ({ options, value, onChange, name, id }) => (
                                    <RadixSelect.Root
                                        value={value?.toString()}
                                        onValueChange={(val) => {
                                            if (onChange) {
                                                const event = {
                                                    target: { value: val },
                                                } as unknown as React.ChangeEvent<HTMLSelectElement>
                                                onChange(event)
                                            }
                                        }}
                                    >
                                        <RadixSelect.Trigger
                                            id={id}
                                            name={name}
                                            className="inline-flex items-center justify-between h-8 min-w-[100px] rounded-[10px] border border-gray-300 bg-white px-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                                        >
                                            <RadixSelect.Value className="truncate" />
                                            <RadixSelect.Icon className="ml-1">
                                                <ChevronDown className="h-4 w-4 text-gray-500" />
                                            </RadixSelect.Icon>
                                        </RadixSelect.Trigger>

                                        <RadixSelect.Portal>
                                            <RadixSelect.Content
                                                side="bottom"
                                                align="start"
                                                position="popper"
                                                sideOffset={4}
                                                className="z-50 max-h-48 w-[var(--radix-select-trigger-width)] overflow-auto rounded-md border border-gray-200 bg-white p-1 shadow-lg"
                                            >
                                                <RadixSelect.Viewport>
                                                    {options?.map((opt) => (
                                                        <RadixSelect.Item
                                                            key={opt.value}
                                                            value={opt.value.toString()}
                                                            className="relative flex cursor-pointer select-none items-center justify-between rounded-md px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                                        >
                                                            <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
                                                            <RadixSelect.ItemIndicator>
                                                                <Check className="h-4 w-4 text-gray-500" />
                                                            </RadixSelect.ItemIndicator>
                                                        </RadixSelect.Item>
                                                    ))}
                                                </RadixSelect.Viewport>
                                            </RadixSelect.Content>
                                        </RadixSelect.Portal>
                                    </RadixSelect.Root>
                                ),
                            }}
                        />
                    </motion.div>
                </PopoverContent>
            </Popover>
        </div>
    )
}

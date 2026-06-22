import { useState, useEffect, useRef, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { MultiSelect, type Option } from '@/components/ui/multi-select';

const DEBOUNCE_MS = 600;

export const StringInput = ({
    label,
    value,
    onChange,
    placeholder,
    description,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    description?: string;
}) => {
    const [localValue, setLocalValue] = useState(value);
    const [prevValue, setPrevValue] = useState(value);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const onChangeRef = useRef(onChange);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    if (value !== prevValue) {
        setPrevValue(value);
        setLocalValue(value);
    }

    const handleChange = useCallback((newValue: string) => {
        setLocalValue(newValue);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            onChangeRef.current(newValue);
        }, DEBOUNCE_MS);
    }, []);

    return (
        <div className="mt-4">
            <Label htmlFor={label} className="mb-2">
                {label}
            </Label>
            {description && <p className="mb-2 text-sm text-muted-foreground">{description}</p>}
            <Input
                id={label}
                value={localValue}
                onChange={(e) => handleChange(e.target.value)}
                placeholder={placeholder}
            />
        </div>
    );
};

export const DebouncedInput = ({
    value,
    onChange,
    placeholder,
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}) => {
    const [localValue, setLocalValue] = useState(value);
    const [prevValue, setPrevValue] = useState(value);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const onChangeRef = useRef(onChange);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    if (value !== prevValue) {
        setPrevValue(value);
        setLocalValue(value);
    }

    const handleChange = useCallback((newValue: string) => {
        setLocalValue(newValue);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            onChangeRef.current(newValue);
        }, DEBOUNCE_MS);
    }, []);

    return (
        <Input
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder}
        />
    );
};

export const ImmediateStringInput = ({
    label,
    value,
    onChange,
    placeholder,
    description,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    description?: string;
}) => (
    <div className="mt-4">
        <Label htmlFor={label} className="mb-2">
            {label}
        </Label>
        {description && <p className="mb-2 text-sm text-muted-foreground">{description}</p>}
        <Input
            id={label}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
        />
    </div>
);

export const BooleanInput = ({
    label,
    checked,
    onChange,
}: {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}) => (
    <div className="mt-4 flex items-center gap-3">
        <Switch id={label} checked={checked} onCheckedChange={onChange} />
        <Label htmlFor={label}>{label}</Label>
    </div>
);

export const SelectInput = ({
    label,
    options,
    value,
    onChange,
    placeholder,
    description,
}: {
    label: string;
    options: { value: string; label: string }[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    description?: string;
}) => (
    <div className="mt-4">
        <Label htmlFor={label} className="mb-2">
            {label}
        </Label>
        {description && <p className="mb-2 text-sm text-muted-foreground">{description}</p>}
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="w-full">
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    </div>
);

export const MultiSelectInput = ({
    label,
    options,
    selected,
    onChange,
    description,
    allowCustom,
}: {
    label: string;
    options: Option[];
    selected: string[];
    onChange: (selected: string[]) => void;
    description?: string;
    allowCustom?: boolean;
}) => (
    <div className="mt-4">
        <Label className="mb-2">{label}</Label>
        {description && <p className="mb-2 text-sm text-muted-foreground">{description}</p>}
        <MultiSelect
            options={options}
            selected={selected}
            onChange={onChange}
            allowCustom={allowCustom}
        />
    </div>
);

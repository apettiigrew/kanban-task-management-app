import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldError } from '@/components/ui/form-error';
import { ArrowLeft } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface CopyListFormProps {
    originalTitle: string;
    onCopyList: (title: string) => void;
    onCancel: () => void
}

export function CopyListForm({
    originalTitle,
    onCopyList,
    onCancel,
}: CopyListFormProps) {
    const [listTitle, setListTitle] = useState(originalTitle);
    const [validationError, setValidationError] = useState<string>('');
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus the input when component mounts
    useEffect(() => {
        const focusInput = () => {
            if (inputRef.current) {
                inputRef.current.focus();
                inputRef.current.select();
            }
        };

        const timeoutId = setTimeout(focusInput, 100);

        return () => clearTimeout(timeoutId);
    }, []);

    // Validate input on change
    const validateInput = useCallback((value: string) => {
        if (value.trim().length === 0) {
            setValidationError('title is required');
            return false;
        }
        setValidationError('');
        return true;
    }, []);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setListTitle(value);
        validateInput(value);
    }, [validateInput]);

    const handleSubmit = useCallback(() => {
        const trimmedTitle = listTitle.trim();
        if (trimmedTitle && validateInput(trimmedTitle)) {
            onCopyList(trimmedTitle);
        }
    }, [listTitle, onCopyList, validateInput]);

    const handleCancel = useCallback(() => {
        onCancel();
    }, [onCancel]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && listTitle.trim()) {
            e.preventDefault();
            handleSubmit();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            handleCancel();
        }
    }, [listTitle, handleSubmit, handleCancel]);

    return (
        <div className="flex flex-col gap-3 p-4">
            {/* Header with back button */}
            <div className="flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                    className="h-8 w-8 p-0"
                    aria-label="Back to menu options"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h3 className="text-sm font-semibold text-gray-900">
                    Copy list
                </h3>
            </div>

            {/* Form content */}
            <div className="space-y-3">
                <div>
                    <label
                        htmlFor="copy-list-title"
                        className="block text-sm font-medium text-gray-700 mb-1"
                    >
                        List title
                    </label>
                    <Input
                        id="copy-list-title"
                        ref={inputRef}
                        className={`text-sm ${validationError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                        value={listTitle}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Enter list title"
                        maxLength={50}
                        aria-describedby="copy-list-description"
                        aria-invalid={!!validationError}
                    />
                    <FieldError error={validationError} />
                </div>

                {/* Action buttons */}
                <div className="flex justify-end gap-2">
                    <Button
                        variant="outline"
                        onClick={handleCancel}
                        size="sm"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={!listTitle.trim() || !!validationError}
                        size="sm">
                        Create list
                    </Button>
                </div>
            </div>
        </div>
    );
}

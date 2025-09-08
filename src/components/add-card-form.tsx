import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useOutsideClick } from '@/hooks/use-outside-click';
import { X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface AddCardFormProps {
    onAddCard: (card: { title: string, position: 'top' | 'bottom' }) => void;
    onCancel: () => void;
    placeholder?: string;
    position?: 'top' | 'bottom';
}

export function AddCardForm(props: AddCardFormProps) {
    const { onAddCard, onCancel, placeholder = "Enter a title or paste a link", position = 'bottom' } = props;
    const [cardTitle, setCardTitle] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const handleOutsideClick = useCallback(() => {
        if (!cardTitle.trim()) {
            onCancel();
        }
    }, [cardTitle, onCancel]);

    const formRef = useOutsideClick(handleOutsideClick);

    useEffect(() => {
        const focusInput = () => {
            if (inputRef.current) {
                inputRef.current.focus();
            }
        };
        
        const timeoutId = setTimeout(focusInput, 100);
        
        return () => clearTimeout(timeoutId);
    }, [inputRef.current]);

    const handleSubmit = useCallback(() => {
        const trimmedCardTitle = cardTitle.trim();
        if (trimmedCardTitle) {
            const tempCard = {
                title: trimmedCardTitle,
                position: position,
            }
            onAddCard(tempCard);
            setCardTitle('');
        }

        setCardTitle('');

    }, [cardTitle, onAddCard]);

    const handleCancel = useCallback(() => {
        onCancel();
        setCardTitle('');
    }, [onCancel]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && cardTitle.trim()) {
            handleSubmit();
        }
        if (e.key === 'Escape') {
            handleCancel();
        }
    }, [cardTitle, handleSubmit, handleCancel]);

    return (
        <div ref={formRef} className="flex flex-col gap-2 p-1">
            <Input
                ref={inputRef}
                className="text-sm font-medium"
                value={cardTitle}
                onChange={(e) => setCardTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                autoFocus
            />
            <div className="flex justify-between gap-3">
                <Button
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={!cardTitle.trim()}>
                    Add card
                </Button>
                <Button
                    onClick={handleCancel}
                    variant="ghost"
                    size="sm"
                    aria-label="Cancel adding card">
                    <X />
                </Button>
            </div>
        </div>
    );
}

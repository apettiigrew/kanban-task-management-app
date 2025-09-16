import { Button } from '@/components/ui/button';
import { ArrowLeft, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { SortType } from '@/utils/data';



const sortOptions = [
    {
        value: 'newest-first' as const,
        label: 'newest first',
        description: 'Sort by creation date (newest first)'
    },
    {
        value: 'oldest-first' as const,
        label: 'oldest first',
        description: 'Sort by creation date (oldest first)'
    },
    {
        value: 'alphabetical' as const,
        label: 'Card name (alphabetically)',
        description: 'Sort by card title (A-Z)'
    }
];

interface SortCardsFormProps {
    columnId: string;
    onSortCards: (sortType: SortType) => void;
    onCancel: () => void;
}



export function SortCardsForm({
    columnId,
    onSortCards,
    onCancel,
}: SortCardsFormProps) {
    const [selectedSortType, setSelectedSortType] = useState<SortType | null>(null);


    // Handle sort option selection
    const handleSortOptionSelect = useCallback((sortType: SortType) => {
        setSelectedSortType(sortType);
    }, []);

    // Handle form submission
    const handleSubmit = useCallback(() => {
        if (selectedSortType) {
            onSortCards(selectedSortType);
        }
    }, [selectedSortType, onSortCards]);

    // Handle cancel
    const handleCancel = useCallback(() => {
        onCancel();
    }, [onCancel]);

    // Handle keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            handleCancel();
        } else if (e.key === 'Enter' && selectedSortType) {
            e.preventDefault();
            handleSubmit();
        }
    }, [selectedSortType, handleSubmit, handleCancel]);

    return (
        <div className="flex flex-col" onKeyDown={handleKeyDown}>
            {/* Header with back button and close button */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancel}
                        className="h-8 w-8 p-0 border-2 border-orange-500 rounded-md"
                        aria-label="Back to menu options"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h3 className="text-sm font-semibold text-gray-900">
                        Sort list
                    </h3>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                    className="h-8 w-8 p-0"
                    aria-label="Close"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* Sort options */}
            <ul className="p-1" role="radiogroup" aria-label="Sort options">
                {sortOptions.map((option, index) => {
                    const isSelected = selectedSortType === option.value;
                    return (
                        <li key={option.value}>
                            <p
                                onClick={() => {
                                    handleSortOptionSelect(option.value);
                                    setTimeout(() => {
                                        onSortCards(option.value);
                                    }, 100);
                                }}
                                className="w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                                role="radio"
                                aria-checked={isSelected}
                            >
                                {option.label}
                            </p>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

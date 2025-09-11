import { Button } from '@/components/ui/button';
import { useColumns } from '@/hooks/queries/use-columns';
import { ArrowLeft, X } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';

interface MoveAllCardsFormProps {
    columnId: string;
    currentProjectId: string;
    onMoveAllCards: (data: { columnId: string; targetColumnId: string }) => void;
    onCancel: () => void;
}

export function MoveAllCardsForm({
    columnId,
    currentProjectId,
    onMoveAllCards,
    onCancel,
}: MoveAllCardsFormProps) {
    const firstColumnRef = useRef<HTMLButtonElement>(null);

    // Fetch columns for the current project
    const { data: columns = [], isLoading } = useColumns({ 
        projectId: currentProjectId,
        includeTasks: false 
    });

    // Focus the first selectable column when component mounts
    useEffect(() => {
        const focusFirstColumn = () => {
            if (firstColumnRef.current) {
                firstColumnRef.current.focus();
            }
        };

        const timeoutId = setTimeout(focusFirstColumn, 100);
        return () => clearTimeout(timeoutId);
    }, [columns]);

    // Handle column selection
    const handleColumnSelect = useCallback((targetColumnId: string) => {
        if (targetColumnId === columnId) {
            // Don't allow moving to the same column
            return;
        }
        onMoveAllCards({ columnId, targetColumnId });
    }, [columnId, onMoveAllCards]);

    // Handle keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            onCancel();
        }
    }, [onCancel]);

    if (isLoading) {
        return (
            <div className="flex flex-col gap-3 p-4">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onCancel}
                        className="h-8 w-8 p-0"
                        aria-label="Back to menu options"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h3 className="text-sm font-semibold text-gray-900">
                        Move all cards in list
                    </h3>
                </div>
                <div className="text-sm text-gray-500">Loading columns...</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3 p-4" onKeyDown={handleKeyDown}>
            {/* Header with back button and close button */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onCancel}
                        className="h-8 w-8 p-0"
                        aria-label="Back to menu options"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h3 className="text-sm font-semibold text-gray-900">
                        Move all cards in list
                    </h3>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onCancel}
                    className="h-8 w-8 p-0"
                    aria-label="Close"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* List of columns */}
            <div className="space-y-1">
                {columns.map((column, index) => {
                    const isCurrentColumn = column.id === columnId;
                    const isFirstSelectable = !isCurrentColumn && index === 0;
                    
                    return (
                        <button
                            key={column.id}
                            ref={isFirstSelectable ? firstColumnRef : undefined}
                            onClick={() => !isCurrentColumn && handleColumnSelect(column.id)}
                            disabled={isCurrentColumn}
                            className={`
                                w-full text-left px-3 py-2 text-sm rounded-md transition-colors
                                ${isCurrentColumn 
                                    ? 'text-gray-400 cursor-not-allowed bg-gray-50' 
                                    : 'text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1'
                                }
                            `}
                            aria-label={isCurrentColumn ? `${column.title} (current list)` : `Move all cards to ${column.title}`}
                        >
                            <div className="flex items-center justify-between">
                                <span>{column.title}</span>
                                {isCurrentColumn && (
                                    <span className="text-xs text-gray-400">(current)</span>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Cancel button */}
            <div className="flex justify-end pt-2">
                <Button
                    variant="outline"
                    onClick={onCancel}
                    size="sm"
                    className="px-4"
                >
                    Cancel
                </Button>
            </div>
        </div>
    );
}

import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/form-error';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type MoveColumn, type RepositionColumn } from '@/lib/validations/column';
import { useProjects } from '@/hooks/queries/use-projects';
import { useColumns } from '@/hooks/queries/use-columns';
import { ArrowLeft } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface MoveListFormProps {
    columnId: string;
    currentProjectId: string;
    currentColumnPosition: number;
    onMoveList: (data: MoveColumn | RepositionColumn) => void;
    onCancel: () => void;
}

export function MoveListForm({
    columnId,
    currentProjectId,
    currentColumnPosition,
    onMoveList,
    onCancel,
}: MoveListFormProps) {
    const [selectedProjectId, setSelectedProjectId] = useState<string>(currentProjectId || '');
    const [selectedPosition, setSelectedPosition] = useState<string>('');
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const boardSelectRef = useRef<HTMLButtonElement>(null);

    // Fetch projects and columns data
    const { data: projects = [], isLoading: projectsLoading } = useProjects();
    const { data: currentColumns = [] } = useColumns({ projectId: currentProjectId });
    const { data: targetColumns = [] } = useColumns({ 
        projectId: selectedProjectId, 
        enabled: selectedProjectId !== currentProjectId 
    });

    // Focus the board selector when component mounts
    useEffect(() => {
        const focusBoardSelect = () => {
            if (boardSelectRef.current) {
                boardSelectRef.current.focus();
            }
        };

        const timeoutId = setTimeout(focusBoardSelect, 100);
        return () => clearTimeout(timeoutId);
    }, []);

    // Clear validation errors when component mounts with valid data
    useEffect(() => {
        if (currentProjectId && !validationErrors.projectId) {
            setValidationErrors({});
        }
    }, [currentProjectId, validationErrors.projectId]);

    // Calculate available positions based on selected board
    const availablePositions = selectedProjectId === currentProjectId 
        ? currentColumns.length 
        : Math.max(targetColumns.length, 1); // Ensure at least 1 position for empty boards

    // Generate position options (1 to total columns)
    const positionOptions = Array.from({ length: availablePositions }, (_, index) => {
        const position = index + 1;
        const isCurrentPosition = selectedProjectId === currentProjectId && position === currentColumnPosition;
        const label = isCurrentPosition ? `${position} (Current)` : position.toString();
        return {
            value: position.toString(),
            label: label
        };
    });

    // Validate form data
    const validateForm = useCallback(() => {
        const errors: Record<string, string> = {};

        if (!selectedProjectId || selectedProjectId === '') {
            errors.projectId = 'Board selection is required';
        }

        if (!selectedPosition || selectedPosition === '') {
            errors.position = 'Position selection is required';
        } else {
            const position = parseInt(selectedPosition);
            if (isNaN(position) || position < 1 || position > availablePositions) {
                errors.position = 'Invalid position selected';
            }
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    }, [selectedProjectId, selectedPosition, availablePositions]);

    // Handle form submission
    const handleSubmit = useCallback(() => {
        if (isSubmitting) return;

        // Validate form first
        if (!validateForm()) {
            return;
        }

        const position = parseInt(selectedPosition);
        
        // If moving within the same board and position hasn't changed, don't make API call
        if (selectedProjectId === currentProjectId && position === currentColumnPosition) {
            onCancel();
            return;
        }

        setIsSubmitting(true);

        try {
            if (selectedProjectId === currentProjectId) {
                // Repositioning within same board
                const repositionData: RepositionColumn = {
                    columnId,
                    position,
                };
                onMoveList(repositionData);
            } else {
                // Moving to different board
                const moveData: MoveColumn = {
                    columnId,
                    targetProjectId: selectedProjectId,
                    position,
                };
                onMoveList(moveData);
            }
        } catch (error) {
            console.error('Error submitting move list form:', error);
            setIsSubmitting(false);
        }
    }, [validateForm, isSubmitting, selectedProjectId, selectedPosition, columnId, currentProjectId, currentColumnPosition, onMoveList, onCancel]);

    // Handle cancel
    const handleCancel = useCallback(() => {
        onCancel();
    }, [onCancel]);

    // Handle keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isSubmitting) {
            e.preventDefault();
            handleSubmit();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            handleCancel();
        }
    }, [handleSubmit, handleCancel, isSubmitting]);

    // Reset position when project changes
    useEffect(() => {
        setSelectedPosition('');
        setValidationErrors({});
    }, [selectedProjectId]);

    // Clear validation errors when position is selected
    useEffect(() => {
        if (selectedPosition && validationErrors.position) {
            setValidationErrors(prev => {
                const { position, ...rest } = prev;
                return rest;
            });
        }
    }, [selectedPosition, validationErrors.position]);

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
                    Move list
                </h3>
            </div>

            {/* Form content */}
            <div className="space-y-3" onKeyDown={handleKeyDown}>
                {/* Board selector */}
                <div>
                    <label
                        htmlFor="move-list-board"
                        className="block text-sm font-medium text-gray-700 mb-1"
                    >
                        Board
                    </label>
                    <Select
                        value={selectedProjectId}
                        onValueChange={setSelectedProjectId}
                        disabled={projectsLoading}
                    >
                        <SelectTrigger
                            ref={boardSelectRef}
                            id="move-list-board"
                            className={`text-sm ${validationErrors.projectId ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                            aria-describedby="board-description"
                            aria-invalid={validationErrors.projectId ? 'true' : 'false'}
                        >
                            <SelectValue placeholder="Select a board" />
                        </SelectTrigger>
                        <SelectContent>
                            {projects.map((project) => (
                                <SelectItem key={project.id} value={project.id}>
                                    {project.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FieldError error={validationErrors.projectId} />
                    <p id="board-description" className="text-xs text-gray-500 mt-1">
                        Choose which board to move this list to
                    </p>
                </div>

                {/* Position selector */}
                <div>
                    <label
                        htmlFor="move-list-position"
                        className="block text-sm font-medium text-gray-700 mb-1"
                    >
                        Position
                    </label>
                    <Select
                        value={selectedPosition}
                        onValueChange={setSelectedPosition}
                        disabled={!selectedProjectId || projectsLoading}
                    >
                        <SelectTrigger
                            id="move-list-position"
                            className={`text-sm ${validationErrors.position ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                            aria-describedby="position-description"
                            aria-invalid={validationErrors.position ? 'true' : 'false'}
                        >
                            <SelectValue placeholder="Select position" />
                        </SelectTrigger>
                        <SelectContent>
                            {positionOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FieldError error={validationErrors.position} />
                    <p id="position-description" className="text-xs text-gray-500 mt-1">
                        Choose where to place this list in the target board
                    </p>
                </div>

                {/* Action buttons */}
                <div className="flex justify-end gap-2">
                    <Button
                        variant="outline"
                        onClick={handleCancel}
                        size="sm"
                        disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={
                            !selectedProjectId || 
                            !selectedPosition || 
                            !!Object.keys(validationErrors).length
                        }
                        size="sm">
                        Move
                    </Button>
                </div>
            </div>
        </div>
    );
}

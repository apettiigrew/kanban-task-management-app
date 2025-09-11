import { useCallback, useState } from "react";
import { MoveColumn } from "@/lib/validations";
import { RepositionColumn } from "@/lib/validations";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Archive, ChevronRight, Copy, MoreHorizontal, Move, Plus, Trash2, Users } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CopyListForm } from "./copy-list-form";
import { MoveListForm } from "./move-list-form";

interface MenuIconProps {
    icon: React.ComponentType<{ className?: string }>;
}

const MenuIcon = ({ icon: Icon }: MenuIconProps) => (
    <Icon className="h-4 w-4 mr-2" />
);


interface ColumnHeaderProps {
    columnId: string;
    columnTitle: string;
    isEditingTitle: boolean;
    titleInputRef: React.RefObject<HTMLInputElement | null>;
    onTitleChange: (title: string) => void;
    onEditingChange: (isEditing: boolean) => void;
    onTitleSave: () => void;
    onTitleCancel: () => void;
    onDelete: () => void;
    onDisplayAddCardForm: (position: 'top' | 'bottom') => void;
    onCopyList: (title: string, columnId: string) => void;
    isCopyingList?: boolean;
    onMoveList: (data: { columnId: string; targetProjectId: string; position: number } | { columnId: string; position: number }) => void;
    isMovingList?: boolean;
    currentProjectId: string;
    totalColumns?: number;
    currentPosition?: number;
}

export function ColumnHeader({
    columnId,
    columnTitle,
    isEditingTitle,
    titleInputRef,
    onTitleChange,
    onEditingChange,
    onTitleSave,
    onTitleCancel,
    onDelete,
    onDisplayAddCardForm,
    onCopyList,
    isCopyingList = false,
    onMoveList,
    isMovingList = false,
    currentProjectId,
    totalColumns = 1,
    currentPosition = 1,
}: ColumnHeaderProps) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [dropdownView, setDropdownView] = useState<'menu' | 'copy-form' | 'move-form'>('menu');

    const handleCopyListClick = useCallback(() => {
        setDropdownView('copy-form');
    }, []);

    const handleCopyListCancel = useCallback(() => {
        setDropdownView('menu');
    }, []);

    const handleCopyListSubmit = useCallback((title: string) => {
        onCopyList(title, columnId);
        setDropdownView('menu');
        setIsDropdownOpen(false);
    }, [onCopyList]);

    const handleMoveListClick = useCallback(() => {
        setDropdownView('move-form');
    }, []);

    const handleMoveListCancel = useCallback(() => {
        setDropdownView('menu');
    }, []);

    const handleMoveListSubmit = useCallback((data: MoveColumn | RepositionColumn) => {
        onMoveList(data);
        setDropdownView('menu');
        setIsDropdownOpen(false);
    }, [onMoveList]);

    const handleDropdownOpenChange = useCallback((open: boolean) => {
        setIsDropdownOpen(open);
        if (!open) {
            setDropdownView('menu');
        }
    }, []);

    const handleDropdownItemClick = useCallback((callback: () => void) => {
        return (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            callback();
        };
    }, []);

    return (
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 flex-1">
                {isEditingTitle ? (
                    <Input
                        ref={titleInputRef}
                        className="text-sm font-semibold text-gray-500"
                        value={columnTitle}
                        onChange={(e) => onTitleChange(e.target.value)}
                        onBlur={onTitleSave}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                onTitleSave();
                            } else if (e.key === 'Escape') {
                                e.preventDefault();
                                onTitleCancel();
                            }
                        }}
                        placeholder="Enter column title..."
                    />
                ) : (
                    <h2
                        onClick={() => onEditingChange(true)}
                        className="text-sm font-semibold text-black-500 cursor-pointer hover:text-gray-700 transition-colors flex-1"
                        title="Click to edit title"
                    >
                        {columnTitle}
                    </h2>
                )}
            </div>

            {!isEditingTitle && (
                <DropdownMenu open={isDropdownOpen} onOpenChange={handleDropdownOpenChange}>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open column menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56"
                        onCloseAutoFocus={(e) => e.preventDefault()}
                    >
                        {dropdownView === 'menu' ? (
                            <>
                                <DropdownMenuItem className="font-medium text-gray-600 cursor-default" onSelect={(e) => e.preventDefault()}>
                                    List actions
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                    onSelect={(e) => e.preventDefault()}
                                    onClick={handleDropdownItemClick(() => {
                                        setIsDropdownOpen(false);
                                        onDisplayAddCardForm('top');
                                    })}>
                                    <MenuIcon icon={Plus} />
                                    Add card
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                    onSelect={(e) => e.preventDefault()}
                                    onClick={handleDropdownItemClick(handleCopyListClick)}>
                                    <MenuIcon icon={Copy} />
                                    Copy list
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                    onSelect={(e) => e.preventDefault()}
                                    onClick={handleDropdownItemClick(handleMoveListClick)}>
                                    <MenuIcon icon={Move} />
                                    Move list
                                </DropdownMenuItem>

                                <DropdownMenuItem>
                                    <MenuIcon icon={Move} />
                                    Move all cards in this list
                                </DropdownMenuItem>

                                <DropdownMenuItem>
                                    <MenuIcon icon={Users} />
                                    Watch
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem className="text-blue-600">
                                    <div className="h-4 w-4 mr-2 bg-blue-500 rounded flex items-center justify-center">
                                        <div className="text-white text-xs font-bold">J</div>
                                    </div>
                                    Add list from Jira work items
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem className="justify-between">
                                    <span>Automation</span>
                                    <ChevronRight className="h-4 w-4" />
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem>
                                    <MenuIcon icon={Archive} />
                                    Archive this list
                                </DropdownMenuItem>

                                <DropdownMenuItem>
                                    <MenuIcon icon={Archive} />
                                    Archive all cards in this list
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                    className="text-red-600 focus:text-red-600"
                                    onSelect={(e) => e.preventDefault()}
                                    onClick={handleDropdownItemClick(onDelete)}
                                >
                                    <MenuIcon icon={Trash2} />
                                    Delete column
                                </DropdownMenuItem>
                            </>
                        ) : dropdownView === 'copy-form' ? (
                            <CopyListForm
                                originalTitle={columnTitle}
                                onCopyList={handleCopyListSubmit}
                                onCancel={handleCopyListCancel}
                            />
                        ) : (
                            <MoveListForm
                                columnId={columnId}
                                currentProjectId={currentProjectId}
                                currentColumnPosition={currentPosition}
                                onMoveList={handleMoveListSubmit}
                                onCancel={handleMoveListCancel}
                            />
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    );
}

import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Separator } from "../ui/separator";
import { ChevronDown, Heading1, Heading2, Heading3, Heading4, Heading5, Heading6, Italic, List, ListOrdered, Minus, Quote, Redo2, Strikethrough, TextIcon, Type, Undo2 } from "lucide-react";
import { memo } from "react";
import { Bold } from "lucide-react";
import { Code } from "lucide-react";

interface EditorToolbarProps {
    editor: any
}

export const MenuBar = memo(({ editor }: EditorToolbarProps) => {
    if (!editor) return null

    const getHeadingIcon = () => {
        if (editor.isActive('heading', { level: 1 })) return <Heading1 className="h-4 w-4" />
        if (editor.isActive('heading', { level: 2 })) return <Heading2 className="h-4 w-4" />
        if (editor.isActive('heading', { level: 3 })) return <Heading3 className="h-4 w-4" />
        if (editor.isActive('heading', { level: 4 })) return <Heading4 className="h-4 w-4" />
        if (editor.isActive('heading', { level: 5 })) return <Heading5 className="h-4 w-4" />
        if (editor.isActive('heading', { level: 6 })) return <Heading6 className="h-4 w-4" />
        return <Type className="h-4 w-4" />
    }

    return (
        <div className="flex items-center gap-1 p-2 border-b bg-background">
            {/* Undo/Redo Group */}
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                className="h-8 w-8 p-0"
                aria-label="Undo"
            >
                <Undo2 className="h-4 w-4" />
            </Button>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                className="h-8 w-8 p-0"
                aria-label="Redo"
            >
                <Redo2 className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="mx-1 h-6" />

            {/* Headings Dropdown */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 gap-1"
                        aria-label="Text formatting"
                    >
                        {getHeadingIcon()}
                        <ChevronDown className="h-3 w-3" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuItem
                        onClick={() => editor.chain().focus().setParagraph().run()}
                        className={editor.isActive('paragraph') ? 'bg-accent' : ''}
                    >
                        <Type className="h-4 w-4 mr-2" />
                        Paragraph
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        className={editor.isActive('heading', { level: 1 }) ? 'bg-accent' : ''}
                    >
                        <Heading1 className="h-4 w-4 mr-2" />
                        Heading 1
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        className={editor.isActive('heading', { level: 2 }) ? 'bg-accent' : ''}
                    >
                        <Heading2 className="h-4 w-4 mr-2" />
                        Heading 2
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                        className={editor.isActive('heading', { level: 3 }) ? 'bg-accent' : ''}
                    >
                        <Heading3 className="h-4 w-4 mr-2" />
                        Heading 3
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
                        className={editor.isActive('heading', { level: 4 }) ? 'bg-accent' : ''}
                    >
                        <Heading4 className="h-4 w-4 mr-2" />
                        Heading 4
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()}
                        className={editor.isActive('heading', { level: 5 }) ? 'bg-accent' : ''}
                    >
                        <Heading5 className="h-4 w-4 mr-2" />
                        Heading 5
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => editor.chain().focus().toggleHeading({ level: 6 }).run()}
                        className={editor.isActive('heading', { level: 6 }) ? 'bg-accent' : ''}
                    >
                        <Heading6 className="h-4 w-4 mr-2" />
                        Heading 6
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Separator orientation="vertical" className="mx-1 h-6" />

            {/* Text Formatting Group */}
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`h-8 w-8 p-0 ${editor.isActive('bold') ? 'bg-accent' : ''}`}
                aria-label="Bold"
            >
                <Bold className="h-4 w-4" />
            </Button>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`h-8 w-8 p-0 ${editor.isActive('italic') ? 'bg-accent' : ''}`}
                aria-label="Italic"
            >
                <Italic className="h-4 w-4" />
            </Button>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={`h-8 w-8 p-0 ${editor.isActive('strike') ? 'bg-accent' : ''}`}
                aria-label="Strikethrough"
            >
                <Strikethrough className="h-4 w-4" />
            </Button>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleCode().run()}
                className={`h-8 w-8 p-0 ${editor.isActive('code') ? 'bg-accent' : ''}`}
                aria-label="Code"
            >
                <Code className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="mx-1 h-6" />

            {/* Lists Group */}
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`h-8 w-8 p-0 ${editor.isActive('bulletList') ? 'bg-accent' : ''}`}
                aria-label="Bullet list"
            >
                <List className="h-4 w-4" />
            </Button>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`h-8 w-8 p-0 ${editor.isActive('orderedList') ? 'bg-accent' : ''}`}
                aria-label="Ordered list"
            >
                <ListOrdered className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="mx-1 h-6" />

            {/* Block Elements Group */}
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                className={`h-8 w-8 p-0 ${editor.isActive('codeBlock') ? 'bg-accent' : ''}`}
                aria-label="Code block"
            >
                <Code className="h-4 w-4" />
            </Button>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={`h-8 w-8 p-0 ${editor.isActive('blockquote') ? 'bg-accent' : ''}`}
                aria-label="Blockquote"
            >
                <Quote className="h-4 w-4" />
            </Button>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                className="h-8 w-8 p-0"
                aria-label="Horizontal rule"
            >
                <Minus className="h-4 w-4" />
            </Button>
        </div>
    )
});

MenuBar.displayName = 'MenuBar'
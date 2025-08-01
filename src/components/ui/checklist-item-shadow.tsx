export function ChecklistItemShadow({ dragging }: { dragging: DOMRect }) {
    return <div className="flex-shrink-0 rounded-md bg-slate-900 opacity-50 mx-2 my-1" style={{ height: dragging.height }} />;
}
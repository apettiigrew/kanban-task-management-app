export function ChecklistShadow({ dragging }: { dragging: DOMRect }) {
    return <div className="flex-shrink-0 rounded-md bg-slate-900 opacity-50" style={{ height: dragging.height }} />;
  }
  
import { FileText } from "lucide-react";

export default function Brand() {
  return (
    <div className="brand-lockup">
      <div className="brand-mark"><FileText size={19} strokeWidth={2.2} /></div>
      <div>
        <div className="brand-name">Enterprise Doc AI</div>
        <div className="brand-caption">Intelligence workspace</div>
      </div>
    </div>
  );
}

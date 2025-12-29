import { useState } from "react";
import { XCircle } from "lucide-react";

interface NotificationRibbonProps {
  message: string;
  type?: "info" | "warning" | "success" | "error";
}

const ribbonColors = {
  info: "bg-blue-100 text-blue-800 border-blue-300",
  warning: "bg-yellow-100 text-yellow-800 border-yellow-300",
  success: "bg-green-100 text-green-800 border-green-300",
  error: "bg-red-100 text-red-800 border-red-300",
};

const NotificationRibbon = ({ message, type = "info" }: NotificationRibbonProps) => {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div
      className={`w-full border-b px-4 py-2 flex items-center justify-between text-sm font-medium ${ribbonColors[type]}`}
    >
      <span>{message}</span>
      <button onClick={() => setVisible(false)} className="ml-4 hover:opacity-75">
        <XCircle className="w-5 h-5" />
      </button>
    </div>
  );
};

export default NotificationRibbon;

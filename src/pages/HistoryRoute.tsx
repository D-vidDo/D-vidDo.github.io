import { useParams } from "react-router-dom";
import History from "./History";

export default function HistoryRoute() {
  const { seasonId } = useParams<{ seasonId: string }>();

  if (!seasonId) return <div>Invalid season</div>;

  return <History seasonId={Number(seasonId)} />;
}

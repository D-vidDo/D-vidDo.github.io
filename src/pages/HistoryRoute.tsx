import { useParams } from "react-router-dom";
import History from "./History";

export default function HistoryRoute() {
  const { seasonId } = useParams<{ seasonId: string }>();

  const parsedSeasonId = Number(seasonId);

  if (!seasonId || isNaN(parsedSeasonId)) {
    return <div>Invalid season</div>;
  }

  return <History seasonId={parsedSeasonId} />;
}

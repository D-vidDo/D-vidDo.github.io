import { useParams } from "react-router-dom";
import History from "./History";

export default function HistoryRoute() {
  const { season_id } = useParams<{ season_id: string }>();

  if (!season_id) return <div>Invalid season</div>;

  return <History season_id={Number(season_id)} />;
}

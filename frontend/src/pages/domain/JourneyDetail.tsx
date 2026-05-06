import { useParams } from "react-router-dom";
export default function JourneyDetail() {
  const { journeyId } = useParams();
  return <div className="text-zinc-100"><h1 className="text-xl font-bold">Journey: {journeyId}</h1><p className="text-zinc-500 mt-2">Migration pending</p></div>;
}

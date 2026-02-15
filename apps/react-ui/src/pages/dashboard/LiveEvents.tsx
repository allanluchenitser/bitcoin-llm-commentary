import ButtonOne from "@/shared-components/ButtonOne";
import { useState } from "react";

type ChildProps = {
  events: string[];
};

const LiveEvents: React.FC<ChildProps> = ({ events }) => {
  const [showHeartBeats, setShowHeartBeats] = useState<boolean>(true);
  const [showUpdates, setShowUpdates] = useState<boolean>(true);
  const [showSnapshots, setShowSnapshots] = useState<boolean>(true);

  const processedEvents = events
    .map((ev) => {
      try {
        const parsed = JSON.parse(ev);
        // return JSON.stringify(parsed, null, 2);
        return parsed;
      } catch {
        return ev;
      }
    })
    .filter((eb) => {
      if (showHeartBeats && eb.channel === "heartbeat") return true;
      if (showUpdates && eb.channel === "ticker" && eb.type === "update") return true;
      if (showSnapshots && eb.channel === "ticker" && eb.type === "snapshot") return true;
      return false;
    })

  return (
    <div className="h-full text-lg font-semibold">
        <div>
          <h3>Live Events</h3>
          <div className="event-filters my-1 flex gap-1">
            <ButtonOne
              onClick={() => setShowHeartBeats(!showHeartBeats)}
              isActive={showHeartBeats}
            >
              HeartBeats
            </ButtonOne>
            <ButtonOne
              onClick={() => setShowUpdates(!showUpdates)}
              isActive={showUpdates}
            >
              Updates
            </ButtonOne>
            <ButtonOne
              onClick={() => setShowSnapshots(!showSnapshots)}
              isActive={showSnapshots}
            >
              Snapshots
            </ButtonOne>
          </div>
        </div>
        <div className="border rounded p-2 h-60 overflow-auto bg-white">
          {
            events.length === 0
              ? <div className="text-gray-500">No events yet…</div>
              : (
                <table className="text-xs space-y-1 w-full">
                  <tbody>
                    {processedEvents.map((ev, i) => (
                      <tr key={i} className="font-mono">
                          <td key={i} className="font-mono"><pre>{JSON.stringify(ev, null, 2)}</pre></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
          }
        </div>
    </div>
  )
}

export default LiveEvents
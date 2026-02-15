import { useState } from "react";

type ChildProps = {
  events: string[];
};

const LiveEvents: React.FC<ChildProps> = ({ events }) => {
  const [showHeartBeats, setShowHeartBeats] = useState<boolean>(true);
  const [showUpdates, setShowUpdates] = useState<boolean>(true);
  const [showSnapshots, setShowSnapshots] = useState<boolean>(true);

  const processedEvents = events.map((e) => {
    try {
      const parsed = JSON.parse(e);
      // return JSON.stringify(parsed, null, 2);
      return parsed;
    } catch {
      return e;
    }
  });

  return (
    <div className="h-full text-lg font-semibold">
        <div>
          <h3>Live Events</h3>
          <div className="event-filters">
            <button
              onClick={() => setShowHeartBeats(!showHeartBeats) }
              className={ showHeartBeats ? "active" : "" }>
              HeartBeats
            </button>
            <button
              onClick={() => setShowUpdates(!showUpdates) }
              className={ showUpdates ? "active" : "" }>
              Updates
            </button>
            <button
              onClick={() => setShowSnapshots(!showSnapshots) }
              className={ showSnapshots ? "active" : "" }>
              Snapshots
            </button>
          </div>
        </div>
        <div className="border rounded p-2 h-60 overflow-auto bg-white">
          {
            events.length === 0
              ? <div className="text-gray-500">No events yet…</div>
              : (
                <table className="text-xs space-y-1 w-full">
                  <tbody>
                    {processedEvents.map((x, i) => (
                      <tr key={i} className="font-mono">
                          <td key={i} className="font-mono"><pre>{JSON.stringify(x, null, 2)}</pre></td>
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
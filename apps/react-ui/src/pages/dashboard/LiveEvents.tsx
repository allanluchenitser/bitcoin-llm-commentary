import ButtonOne from "@/shared-components/ButtonOne";
import { useState, useMemo } from "react";
import { type KrakenTickerEvent } from '@blc/contracts';
import { formatUtcMonthDayTime } from "./dashboardHelpers";

type ChildProps = {
  events: string[];
};

const LiveEvents: React.FC<ChildProps> = ({ events }) => {
  const [showUpdates, setShowUpdates] = useState<boolean>(true);
  const [showSnapshots, setShowSnapshots] = useState<boolean>(false);
  const [showHeartBeats, setShowHeartBeats] = useState<boolean>(false);

  const [tableMode, setTableMode] = useState<boolean>(true)

  const processedEvents: KrakenTickerEvent[] = useMemo(() =>  {
    return events
      .map((ev) => {
        try {
          const parsed = JSON.parse(ev);
          parsed.data[0].timestamp = formatUtcMonthDayTime(parsed.data[0].timestamp);
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
  }, [events, showHeartBeats, showUpdates, showSnapshots]);


  return (
    <div className="h-full text-lg font-semibold">
        <div>
          <h3>Live Events</h3>
          <div className="buttons-menu flex justify-between">
            <div className="event-filters my-1 flex gap-1">
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
              <ButtonOne
                onClick={() => setShowHeartBeats(!showHeartBeats)}
                isActive={showHeartBeats}
              >
                HeartBeats
              </ButtonOne>

            </div>
            <div className="flex items-center">
              <ButtonOne
                onClick={() => setTableMode(!tableMode)}
                variant="clear"
              >
                { tableMode ? 'TABLE' : 'JSON' }
              </ButtonOne>
            </div>
          </div>
        </div>
        <div className="border rounded p-2 h-60 overflow-auto bg-white">
          {
            events.length === 0
              ? <div className="text-gray-500">No events yet…</div>
              : (
                <table className="text-xs space-y-1 w-full">
                  {
                    tableMode && (
                      <thead>
                        <tr className="text-left [&>th]:pb-1">
                          <th>type</th>
                          <th>symbol</th>
                          <th>last</th>
                          <th>time</th>
                          <th>high</th>
                          <th>low</th>
                        </tr>
                      </thead>
                    )
                  }
                  <tbody>
                  {
                    tableMode
                      ? // <table> view
                      processedEvents.map((ev: KrakenTickerEvent, i: number) => (
                        <tr key={i} className="font-mono">
                            <td>{ ev.type ?? "" }</td>
                            <td>{ ev.data[0]?.symbol ?? "" }</td>
                            <td>{ ev.data[0]?.last ?? "" }</td>
                            <td>{ ev.data[0]?.timestamp ?? "" }</td>
                            <td>{ ev.data[0]?.high ?? "" }</td>
                            <td>{ ev.data[0]?.low ?? "" }</td>
                        </tr>
                      ))
                      : // JSON view
                      processedEvents.map((ev: KrakenTickerEvent, i: number) => (
                        <tr key={i} className="font-mono">
                          <td key={i} className="font-mono text-[0.65rem]"><pre>{JSON.stringify(ev, null, 2)}</pre></td>
                        </tr>
                      ))
                  }
                  </tbody>
                </table>
              )
          }
        </div>
    </div>
  )
}

export default LiveEvents
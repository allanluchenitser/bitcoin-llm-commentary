import ButtonOne from "@/shared-components/ButtonOne";
import { useState, useMemo } from "react";
import type { KrakenEvent } from '@blc/contracts';
import { formatUtcMonthDayTime } from "./dashboardHelpers";

type ChildProps = {
  events: KrakenEvent[];
};

const LiveEvents: React.FC<ChildProps> = ({ events }) => {
  const [showUpdates, setShowUpdates] = useState<boolean>(true);
  const [showSnapshots, setShowSnapshots] = useState<boolean>(false);
  const [showHeartBeats, setShowHeartBeats] = useState<boolean>(false);

  const [tableMode, setTableMode] = useState<boolean>(true)

  function isDataEvent(ev: KrakenEvent): ev is Extract<KrakenEvent, { data: any[] }> {
    return "data" in ev && Array.isArray(ev.data);
  }

  const processedTickerEvents: KrakenEvent[] = useMemo(() =>  {
    return events
      .filter(ev => ev.channel !== "heartbeat")
      .map((ev) => {
        try {
          if (!ev.data?.[0] || ev.data.length === 0) return ev
          ev.data[0].timestamp = formatUtcMonthDayTime(ev.data[0].timestamp);
          return ev;
        } catch {
          return ev;
        }
      })
      .filter((eb) => {
        console.log(eb);
        if (showUpdates && eb.channel === "ticker" && eb.type === "update") return true;
        if (showSnapshots && eb.channel === "ticker" && eb.type === "snapshot") return true;
        return false
      })
      .filter(isDataEvent)

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
                      processedTickerEvents.map((ev, i) => {
                        return (
                          <tr key={i} className="font-mono">
                              <td>{ ev.type ?? "" }</td>
                              <td>{ ev.data[0]?.symbol ?? "" }</td>
                              <td>{ ev.data[0]?.last ?? "" }</td>
                              <td>{ ev.data[0]?.timestamp ?? "" }</td>
                              <td>{ ev.data[0]?.high ?? "" }</td>
                              <td>{ ev.data[0]?.low ?? "" }</td>
                          </tr>
                        );
                      })
                      : // JSON view
                      processedTickerEvents.map((ev, i) => (
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
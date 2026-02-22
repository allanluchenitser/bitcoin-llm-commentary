import ButtonOne from "@/shared-components/ButtonOne";
import { useState, useMemo } from "react";
import { type OHLCVRow } from '@blc/contracts';
import { formatUtcMonthDayTime } from "./dashboardHelpers";

const LiveEvents: React.FC<{ ohlcvData: OHLCVRow[] }> = ({ ohlcvData }) => {
  // const [showUpdates, setShowUpdates] = useState<boolean>(true);
  // const [showSnapshots, setShowSnapshots] = useState<boolean>(false);

  const [tableMode, setTableMode] = useState<boolean>(true)

  const processedTickerEvents: OHLCVRow[] = useMemo(() =>  {
    return ohlcvData
      .map((ohclv) => {
          const ts = formatUtcMonthDayTime(ohclv.ts);
          return { ...ohclv, ts }
      })
  }, [ohlcvData]);

  return (
    <div className="h-full text-lg font-semibold">
        <div>
          <div className="buttons-menu flex justify-between">
            <h3>Live Events</h3>
            <div className="event-filters my-1 flex gap-1">
              {/* <ButtonOne
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
              </ButtonOne> */}
            </div>
            <div className="flex items-center mb-1">
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
            ohlcvData.length === 0
              ? <div className="text-gray-500">No events yet…</div>
              : (
                <table className="text-xs space-y-1 w-full">
                  {
                    tableMode && (
                      <thead>
                        <tr className="text-left [&>th]:pb-1">
                          <th>ex</th>
                          <th>symbol</th>
                          <th>close</th>
                          <th>time</th>
                          {/* <th>high</th>
                          <th>low</th> */}
                          <th>vol</th>
                        </tr>
                      </thead>
                    )
                  }
                  <tbody>
                  {
                    tableMode
                      ? // <table> view
                      processedTickerEvents.map((price, i) => {
                        return (
                          <tr key={i} className="font-mono">
                              <td>{ price.exchange ?? "" }</td>
                              <td>{ price.symbol ?? "" }</td>
                              <td>{ price.close ? Number(price.close).toFixed(1) : "" }</td>
                              <td>{ price.ts ?? "" }</td>
                              {/* <td>{ price.high ? Number(price.high).toFixed(1) : "" }</td>
                              <td>{ price.low ? Number(price.low).toFixed(1) : "" }</td> */}
                              <td>{ price.volume ? Number(price.volume).toFixed(1) : "" }</td>
                          </tr>
                        );
                      })
                      : // JSON view
                      processedTickerEvents.map((price, i) => (
                        <tr key={i} className="font-mono">
                          <td key={i} className="font-mono text-[0.65rem]"><pre>{JSON.stringify(price, null, 2)}</pre></td>
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
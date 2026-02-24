import ButtonOne from "@/shared-components/ButtonOne";
import { useState, useMemo } from "react";
import { type OHLCVRow } from '@blc/contracts';
import { formatUtcMonthDayTime } from "./dashboardHelpers";

const LiveEvents: React.FC<{ ohlcvData: OHLCVRow[] }> = ({ ohlcvData }) => {
  const [tableMode, setTableMode] = useState<boolean>(true);

  const widths = {
    exchange: "16%",
    symbol: "16%",
    close: "16%",
    time: "24%",
    volume: "20%"
  }

  const processedTickerEvents: OHLCVRow[] = useMemo(() =>  {
    return ohlcvData
      .map((ohlcv) => {
          const ts = formatUtcMonthDayTime(ohlcv.ts);
          return { ...ohlcv, ts }
      })
  }, [ohlcvData]);

  return (
    <div className="h-full text-lg font-semibold">
        <div className="buttons-menu flex justify-between">
          <h3>Live Events</h3>

          <div className="flex items-center mb-1">
            <ButtonOne
              onClick={() => setTableMode(!tableMode)}
              variant="clear"
            >
              { tableMode ? 'TABLE' : 'JSON' }
            </ButtonOne>
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
                          <th style={{ width: widths.exchange }}>ex</th>
                          <th style={{ width: widths.symbol }}>symbol</th>
                          <th style={{ width: widths.close }}>close</th>
                          <th style={{ width: widths.time }}>time</th>
                          <th style={{ width: widths.volume }}>vol</th>
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
                              <td style={{ width: widths.exchange }}>{ price.exchange ?? "" }</td>
                              <td style={{ width: widths.symbol }}>{ price.symbol ?? "" }</td>
                              <td style={{ width: widths.close }}>{ price.close ? Number(price.close).toFixed(1) : "" }</td>
                              <td style={{ width: widths.time }}>{ price.ts ?? "" }</td>
                              <td style={{ width: widths.volume }}>{ price.volume ? price.volume : "" }</td>
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
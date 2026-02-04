type ChildProps = {
  events: string[];
};

const LiveEvents: React.FC<ChildProps> = ({ events }) => {
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
        <h3 >Live Events</h3>
        <div className="border rounded p-2 h-60 overflow-auto bg-white">
          {events.length === 0 ? (
            <div className="text-gray-500">No events yet…</div>
          ) : (
            <table className="text-xs space-y-1 w-full">
              {processedEvents.map((x, i) => (
                <tr key={i} className="font-mono">
                    <td key={i} className="font-mono"><pre>{JSON.stringify(x, null, 2)}</pre></td>
                    {/* <td>
                      {x.type}
                    </td>
                    <td>
                      {x.source}
                    </td>
                    <td>
                      {x.symbol}
                    </td>
                    <td>
                      {x.data.ask}
                    </td>
                    <td>
                      {x.data.volume.toFixed(2)}
                    </td> */}
                </tr>
              ))}
            </table>
          )}
        </div>
    </div>
  )
}

export default LiveEvents
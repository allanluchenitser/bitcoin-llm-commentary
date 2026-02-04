type ChildProps = {
  events: string[];
};

const LiveEvents: React.FC<ChildProps> = ({ events }) => {
  const processedEvents = events.map((e) => {
    try {
      const parsed = JSON.parse(e);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return e;
    }
  });

  return (
    <div className="h-full text-lg font-semibold">
        <h3 >Live Events</h3>
        <div className="border rounded p-2 h-48 overflow-auto bg-white">
          {events.length === 0 ? (
            <div className="text-gray-500">No events yet…</div>
          ) : (
            <ul className="text-xs space-y-1">
              {processedEvents.map((x, i) => (
                <li key={i} className="font-mono">{x}</li>
              ))}
            </ul>
          )}
        </div>
    </div>
  )
}

export default LiveEvents
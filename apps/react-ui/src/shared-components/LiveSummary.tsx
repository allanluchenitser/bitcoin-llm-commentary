type ChildProps = {
  events: string[];
};

const LiveSummary: React.FC<ChildProps> = ({ events }) => {
return (
    <div className="text-lg font-semibold mb-2">
      <div className="border rounded p-2 h-48 overflow-auto bg-white">
        <h3 >Live Events</h3>
        {events.length === 0 ? (
          <div className="text-gray-500">No events yet…</div>
        ) : (
          <ul className="text-xs space-y-1">
            {events.map((x, i) => (
              <li key={i} className="font-mono break-words">{x}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default LiveSummary
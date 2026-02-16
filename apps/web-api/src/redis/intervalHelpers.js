function tickerSubscriptionLoop() {
  subscriptionTimer = setTimeout(
    () => {
      if (stopSubscription) return;

      // random value
      events.push(random(100))
      count++;
      tickerSubscriptionLoop()
    },

    // frequency of ticker data
    random(500, { min: 50 })
  )
}


function counterInterval() {
  counterTimer = setInterval(
    () => {
      counts.push(count)
      counts = counts.slice(-10);
      events = events.slice(-10);

      eventsPerSecond = arrayAverage(counts);
      averageValue = arrayAverage(events)

      console.log([
        `events this second \t${count}`,
        `eventsPerSecond \t${eventsPerSecond}`,
        `aveageValue \t\t${averageValue}`
      ].join('\n'))

      count = 0;
    },
    1000
  )
}

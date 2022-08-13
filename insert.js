const fs = require('fs');
const { parse } = require('csv-parse/sync');
const Database = require("@replit/database")
const db = new Database()

const input = fs.readFileSync('stops.txt', { encoding: 'utf-8', flag: 'r' });

console.log('parsing stops')
const stops = parse(input, {
  columns: true,
  skip_empty_lines: true
});

let cleanedBusStops = {};
let cleanedTrainStations = {};

stops.forEach(async (stop, i, arr) => {
  if (stop.parent_station.length == 0) {
    if (Number(stop.stop_id) < 30000) {
      cleanedBusStops[stop.stop_id] = stop
    }

    if (Number(stop.stop_id) > 39999) {
      cleanedTrainStations[stop.stop_id] = stop
    }
    
  }
   
  //db.set(stop.stop_id, stop);
  if (i % 25 === 0) {
    console.log(`${i} / ${arr.length} (${Math.floor((i/arr.length)*100)}%)`)
  }
})

db.set('stations', Object.keys(cleanedTrainStations))
db.set('stops', Object.keys(cleanedBusStops))
db.set('lastposted', new Date().valueOf())
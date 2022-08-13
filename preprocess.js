//takes in stops.txt and poops out stops.json

const fs = require('fs');
const { parse } = require('csv-parse/sync');

const input = fs.readFileSync('stops.txt', { encoding: 'utf-8', flag: 'r' });

const stops = parse(input, {
  columns: true,
  skip_empty_lines: true
});

let final = {};
stops.forEach((stop) => {
  final[stop.stop_id] = stop;
});

fs.writeFileSync('stops.json', JSON.stringify(final, null, 2))
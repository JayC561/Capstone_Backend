const axios = require('axios');
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());

const quakes = {
  data: [],
  lastUpdated: ""
};
let quakesMag1 = {
  data: [],
  lastUpdated: ""
};
let quakesMag2 = {
  data: [],
  lastUpdated: ""
};
let quakesMag4 = {
  data: [],
  lastUpdated: ""
};
let coordinates = [];

const paginatedResult = (model, req, res, next) =>{
  const page = parseInt(req.query.page) || 1;
  const limit = 10;

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  let result = {};
  result.result = model.data.slice(startIndex, endIndex);
  if(startIndex > 0){
    result.previous = {
      page: page - 1
    }
  }
  if(endIndex < model.data.length){
    result.next = {
      page: page + 1
    }
  }
  console.log((new Date(model.lastUpdated)).toString());
  return res.status(200).json(result);
}

const unknownEndPoint = (req, res, next) =>{
  return res.status(400).send({'error':'unknown endpoint'});
}

const fetchAndSave = (url, dataStore, next) =>{
  axios.get(url)
    .then(result => result.data)
    .then(json =>{
      dataStore.data = json.features;
      dataStore.lastUpdated = new Date().getTime();
      next(dataStore);
    })
}

const timeExceeded = (lastUpdated) =>{
  return (lastUpdated + (12 * 60 * 60 * 1000) < (new Date()).getTime());
}

app.get('/api/quakes', (req, res, next) =>{
  if(quakes.data.length){
    if(timeExceeded(quakes.lastUpdated)){
      fetchAndSave('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson', quakes, next);
    }
    else{
      next(quakes);
    }
  }
  else{
    fetchAndSave('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson', quakes, next);
  }
})

app.get('/api/quakes/:mag', (req, res, next) =>{
  const mag = req.params.mag;
  switch(mag){
    case '1.0': {
      if(quakesMag1.data.length){
        if(timeExceeded(quakesMag1.lastUpdated)){
          fetchAndSave('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/1.0_week.geojson', quakesMag1, next);
        }
        else{
          next(quakesMag1);
        }
      }
      else{
        fetchAndSave('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/1.0_week.geojson', quakesMag1, next);
      }
      break;
    }
    case '2.5': {
      if(quakesMag2.data.length){
        if(timeExceeded(quakesMag2.lastUpdated)){
          fetchAndSave('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson', quakesMag2, next)
        }
        else{
          next(quakesMag2);
        }
      }
      else{
        fetchAndSave('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson', quakesMag2, next)
      }
      break;
    }
    case '4.5': {
      if(quakesMag4.data.length){
        if(timeExceeded(quakesMag4.lastUpdated)){
          fetchAndSave('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson', quakesMag4, next);
        }
        else{
          next(quakesMag4);
        }
      }
      else{
        fetchAndSave('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson', quakesMag4, next);
      }
      break;
    }
    default: res.status(400).send({'error':'unknown endpoint'});
  }
})

app.get('/api/coordinates', (req, res, next) =>{
  if(coordinates.length){
    res.send(coordinates);
  }
  else{
    coordinates = quakes.data.map(quake =>{
      return [quake.geometry.coordinates[1], quake.geometry.coordinates[0]];
    });
    res.send(coordinates);
  }
})

app.use(paginatedResult);
app.use(unknownEndPoint);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () =>{
  console.log(`Server running on port ${PORT}`);
})

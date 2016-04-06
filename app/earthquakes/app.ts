const QUAKE_URL = 'http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojsonp';

function getRowFromEvent(table: HTMLTableElement, eventName: string){
    return Rx.Observable.fromEvent<UIEvent>(table, eventName).filter(evt => {
        let el = evt.target as HTMLElement;
        return el.tagName === "TD" && !!el.parentElement.id;
    })
    .map(evt => (event.target as HTMLElement).parentElement)
    .distinctUntilChanged();
}

function isJsonpSuccessResponse<T>(data: any): data is Rx.DOM.JsonpSuccessResponse<T> {
    return data && data.response != null;
}

function makeRow(props: EarthQuakes.EarthQuakeProperties) {
  var row = document.createElement('tr');
  row.id = props.net + props.code;

  var date = new Date(props.time);
  var time = date.toString();
  [props.place, props.mag, time].forEach(function(text: any) {
    var cell = document.createElement('td');
    cell.textContent = text;
    row.appendChild(cell);
  });

  return row;
}

var quakes$ = Rx.Observable.interval(5000)
    .flatMap(() => {
        return Rx.DOM.jsonpRequest<EarthQuakes.Dataset>({
            url: QUAKE_URL,
            jsonpCallback: "eqfeed_callback"
        }).retry(3);
    })
    .flatMap((data) => {
        if (isJsonpSuccessResponse(data)) {
            return Rx.Observable.from(data.response.features);
        } else {
            return Rx.Observable.from([] as EarthQuakes.EarthQuake[]);
        }
    })
    .distinct(quake => quake.properties["code"]).publish();

let quakesMapInfo$ = quakes$
    .map(quake => {
        return {
            id: quake.id,
            lat: quake.geometry.coordinates[1],
            lng: quake.geometry.coordinates[0],
            mag: quake.properties.mag,
            size: quake.properties.mag * 10000
        };
    });

let quakeTableRows$ = quakes$
    .pluck<EarthQuakes.EarthQuakeProperties>('properties')
    .map(makeRow)
    .bufferWithTime(500)
    .filter(rows => rows.length > 0)
    .map(rows => {
        var fragment = document.createDocumentFragment();
        rows.forEach(function(row) {
            fragment.appendChild(row);
        });
        return fragment;
    });
    

function run() {
    var socket = Rx.DOM.fromWebSocket('ws://127.0.0.1:8080', null);
    
    var map = L.map('map').setView([43.804133, -120.554201], 7); //<!-- (3) -->
    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png').addTo(map); //<!-- (4) -->
    
    let codeLayers: { [name: string]: string } = {};
    let quakeLayer = L.layerGroup([]).addTo(map);


    quakesMapInfo$.subscribe(quake => {
        let circle = L.circle([quake.lat, quake.lng], quake.size).addTo(map);
        quakeLayer.addLayer(circle);
        codeLayers[quake.id] = quakeLayer.getLayerId(circle).toString();
    });
    
    quakesMapInfo$.bufferWithCount(100)
        .subscribe(quakes => {
            socket.onNext(JSON.stringify({quakes}));
        });
        
    socket.subscribe((message: { data: string }) => {
        console.log(JSON.parse(message.data));
    });
    
    var table = document.getElementById('quakes_info') as HTMLTableElement;
    quakeTableRows$
        .subscribe(function(fragment) { 
            table.appendChild(fragment); 
        });
        
    let rowEnter$ = getRowFromEvent(table, "mouseover").pairwise();
    rowEnter$.subscribe(rows => {
        var prevCircle = quakeLayer.getLayer(codeLayers[rows[0].id]);
        var currCircle = quakeLayer.getLayer(codeLayers[rows[1].id]);

        prevCircle.setStyle({ color: '#0000ff' });
        currCircle.setStyle({ color: '#ff0000' });
    });
    
    
    let quakeSelected$ = getRowFromEvent(table, "click");
    quakeSelected$.subscribe(row => {
       var circle = quakeLayer.getLayer(codeLayers[row.id]);
       map.panTo(circle.getLatLng()); 
    });
    
    quakes$.connect();
}

export default run;
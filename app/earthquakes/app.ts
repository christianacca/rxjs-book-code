const QUAKE_URL = 'http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojsonp';

function isJsonpSuccessResponse<T>(data: any): data is Rx.DOM.JsonpSuccessResponse<T> {
    return data && data.response != null;
}

var quakesFeed = Rx.Observable.interval(5000)
    .flatMap(() => {
        return Rx.DOM.jsonpRequest<EarthQuakes.Dataset>({
            url: QUAKE_URL,
            jsonpCallback: "eqfeed_callback"
        }).retry(3);
    });

let quakes = quakesFeed
    .flatMap((data) => {
        if (isJsonpSuccessResponse(data)) {
            return Rx.Observable.from(data.response.features);
        } else {
            return Rx.Observable.from([] as EarthQuakes.EarthQuake[]);
        }
    })
    .distinct(quake => quake.properties["code"])
    .map(quake => {
        return {
            lat: quake.geometry.coordinates[1],
            lng: quake.geometry.coordinates[0],
            size: quake.properties.mag * 10000
        };
    });

function run() {
    var map = L.map('map').setView([43.804133, -120.554201], 7); //<!-- (3) -->
    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png').addTo(map); //<!-- (4) -->
    
    experiment();

    quakes.subscribe(quake => {
        L.circle([quake.lat, quake.lng], quake.size).addTo(map);
    });
}

function experiment() {
    var id = 1;
    var delayed = Rx.Observable.range(1, 4).map(value => {
        return {
            id: id++
        }
    }).delay(1000);

    var asyncSource = new Rx.AsyncSubject<{ id: number }>();
    delayed.subscribe(asyncSource);


    asyncSource.subscribe(x => {
        console.log(`Subscriber 1: ${x.id}`);
    });


    setTimeout(() => {
        console.log(`Before subscription 2 created`);
        asyncSource.subscribe(x => {
            console.log(`Subscriber 2: ${x.id}`);
        });
        console.log(`After subscription 2 created`);
    }, 1000);
}

export default run;
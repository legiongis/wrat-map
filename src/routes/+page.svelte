<script>
    import 'ol/ol.css';
    import 'ol-ext/dist/ol-ext.css';
    import '../style.css';

    import { env } from '$env/dynamic/public';
    import { onMount } from 'svelte';

    import Map from 'ol/Map';
    import View from 'ol/View';
    import Feature from 'ol/Feature';
    import {
        Circle as CircleStyle,
        Fill,
        RegularShape,
        Stroke,
        Style,
        Text,
        Icon,
    } from 'ol/style.js';

    import Stamen from 'ol/source/Stamen.js';
    import XYZ from 'ol/source/XYZ';
    import VectorSource from 'ol/source/Vector';

    import TileLayer from 'ol/layer/Tile';
    import VectorLayer from 'ol/layer/Vector';
    import LayerGroup from 'ol/layer/Group';

    import Point from 'ol/geom/Point.js';
    import {fromLonLat, toLonLat} from 'ol/proj.js';

    let showStudioList = false;
    let showSponsorList = false;

    const spreadsheetId = env.PUBLIC_GOOGLE_SHEET_ID;
    const googleApiKey = env.PUBLIC_GOOGLE_API_KEY;

    const apiUrl = 'https://sheets.googleapis.com/v4/spreadsheets/'

    const sponsorStyle = new Style({
        image: new RegularShape({
            fill: new Fill({
                color: '#ff5a34',
            }),
            stroke: new Stroke({
                color: 'rgba(50, 50, 50, 0.8)',
                width: 2,
            }),
            points: 5,
            radius: 12,
            radius2: 6,
            angle: 0,
        }),
    })
    let sponsorLayer = new VectorLayer({
        source: new VectorSource(),
        style: sponsorStyle,
        zIndex: 1,
    });
    let studioLayer = new VectorLayer({
        source: new VectorSource(),
        style: function (feature) {
            return new Style({
                image: new Icon({
                    anchor: [0.5, 46],
                    anchorXUnits: 'fraction',
                    anchorYUnits: 'pixels',
                    src: '/icons/stop-icon-' + feature.get('Number') + '.png',
                    scale: .28,
                }),
            })
        },
        zIndex: 2,
    });

    const sponsorList = [];
    const studioList = [];
    async function addSheetDataToLayer(sheetName, layer, featureList) {
        const url = apiUrl + spreadsheetId + "/values/" + sheetName + "?key=" + googleApiKey
        return fetch(url)
            .then(response => response.json())
            .then(result => {
                const headers = result.values[0];
                result.values.forEach( function(row, n) {
                    if (n != 0) {
                        const feature = new Feature({
                            geometry: new Point(fromLonLat([
                                row[headers.indexOf("Lon")],
                                row[headers.indexOf("Lat")]
                            ])),
                        })
                        const properties = {};
                        headers.forEach((k, i) => {properties[k] = row[i]})
                        properties['source'] = sheetName;
                        feature.setProperties(properties)
                        
                        layer.getSource().addFeature(feature)
                        featureList.push(properties)
                    }
                })
            })
            .catch(error => {
                console.error('hmmmmm:', error);
            })
    }

    const mbk = 'pk.eyJ1IjoibGVnaW9uZ2lzIiwiYSI6ImNsYmNvazRvdTB2YWQzdm50YzRmcG5wYjAifQ.eOGJmZJHrXLo46_yTdftqQ'
    const mbSatellite = {
        id: 'mbSatellite',
        layer: new TileLayer({
            source: new XYZ({
                url: 'https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v10/tiles/{z}/{x}/{y}?access_token='+mbk,
                tileSize: 512,
            })
        })
    }
    const mbOutdoors = {
        id: 'mbOutdoors',
        layer: new TileLayer({
            source: new XYZ({
                url: 'https://api.mapbox.com/styles/v1/legiongis/cldf5vrjm000w01pasy9x4lwm/tiles/{z}/{x}/{y}?access_token='+mbk,
                tileSize: 512,
            }),
            zIndex: 0,
        })
    }

    const watercolor = {
        id: 'watercolor',
        layer: new TileLayer({
            source: new Stamen({
                layer: 'watercolor',
            }),
        })
    }

    const watercolorLabels = {
        id: 'watercolorLabels',
        layer: new LayerGroup({
            layers: [
                watercolor.layer,
                new TileLayer({
                    source: new Stamen({
                        layer: 'terrain-labels',
                    }),
                }),
            ],
            zIndex: 0,
        })
    }
    const stamenTerrain = {
        id: 'stamenTerrain',
        layer: new TileLayer({
            source: new Stamen({
                layer: 'terrain',
            }),
            zIndex: 0,
        })
    }
    const basemaps = [
        mbOutdoors,
        watercolorLabels,
        stamenTerrain,
    ]
    function setBasemap(layerId) {
        basemaps.forEach( function (layerDef) {
            if (layerDef.id == layerId){
                map.addLayer(layerDef.layer)
            } else {
                map.removeLayer(layerDef.layer)
            }
        })
    }

    let showAboutPanel = false;
    let showLayerPanel = true;
    let layerBtnLabel;
    $: showLayerPanel ? layerBtnLabel = "×" : layerBtnLabel = "i"

    function zoomAndPopup(featureProps, zoomLevel) {
        if (map) {
            map.getView().animate({
                center: fromLonLat([featureProps.Lon, featureProps.Lat]),
                zoom: zoomLevel,
            })
            popupSponsor.hide();
            popupStudio.hide();
            if (featureProps.source == "2023-sponsors") {
                handleSponsorPopup(featureProps)
            } else if (featureProps.source == "2023-studios") {
                handleStudioPopup(featureProps)
            }
        }
    }

    function handleSponsorPopup (featureProps) {
        let popContent = `<h2>${featureProps.Name}</h2>`
        popContent = popContent + `<p><a href="https://www.google.com/maps/dir//${featureProps.Lat},${featureProps.Lon}/" target="_blank">get directions &rarr;</a></p>`
        popupSponsor.show(fromLonLat([featureProps.Lon, featureProps.Lat]), popContent);
    }
    function handleStudioPopup (featureProps) {
        let artistList = ""
        featureProps.Artists.split(";").forEach( function (artist) {
            artistList = artistList + `<li>${artist}</li>`
        })
        let popContent = `<h2>${featureProps.Name}</h2>
            <p><em>${featureProps.Address}</em><p>
            <ul>${artistList}</ul>
            `
        popContent = popContent + `<p><a href="https://www.google.com/maps/dir//${featureProps.Lat},${featureProps.Lon}/" target="_blank">get directions &rarr;</a></p>`
        popupStudio.show(fromLonLat([featureProps.Lon, featureProps.Lat]), popContent);
    }

    let map;
    let popupSponsor;
    let popupStudio;
    async function initMap() {
        map = new Map({
            target: document.getElementById('map'),
            layers: [
                basemaps[0].layer,
                sponsorLayer,
                studioLayer,
            ],
            overlays: [popupStudio, popupSponsor]
        });
        await addSheetDataToLayer("2023-sponsors", sponsorLayer, sponsorList);
        await addSheetDataToLayer("2023-studios", studioLayer, studioList);
        
        map.getView().fit(studioLayer.getSource().getExtent(), {padding: [50,50,50,50]});
        // change mouse cursor when over marker
        map.on('pointermove', function (e) {
            const pixel = map.getEventPixel(e.originalEvent);
            const hit = map.hasFeatureAtPixel(pixel);
            map.getTarget().style.cursor = hit ? 'pointer' : '';
        });
        // display popup on click
        map.on('click', function (evt) {
            popupSponsor.hide();
            popupStudio.hide();
            const feature = map.forEachFeatureAtPixel(evt.pixel, function (feature) {
                return feature;
            });
            if (feature) {
                zoomAndPopup(feature.getProperties(), 14)
            }
        });
        return map
    }

    let mapEl;
    $: {
        if (mapEl) {
            if (showLayerPanel) {
                document.getElementById("map").style.width = "calc(100% - 250px)"
            } else {
                document.getElementById("map").style.width = "100%"
            }
        }
    }

    onMount(async () => {
        
        // Tried a lot of different methods for creating a popup, ended
        // up with this one from ol-ext.
        // HOWEVER: this import must happen here because the Popup
        // lib uses the global `window` variable (in ol-ext/utils/input/Base.js).
        // Importing at the top of the file causes npm run build to fail with
        // a 'window is not defined' error.
        const Popup = (await import('ol-ext/overlay/Popup')).default;
        popupSponsor = new Popup ({
            popupClass: "shadow default", //"tooltips", "warning" "black" "default", "tips", "shadow",
            closeBox: false,
            autoPan: {
                animation: {
                    duration: 100
                }
            }
        });
        popupStudio = new Popup ({
            popupClass: "shadow tips", //"tooltips", "warning" "black" "default", "tips", "shadow",
            closeBox: false,
            autoPan: {
                animation: {
                    duration: 100
                }
            }
        });
        await initMap()
        showStudioList = true;
        showSponsorList = true;
        mapEl = document.getElementById("map");
    });

</script>
{#if showAboutPanel}
<div class="about-modal-bg">
    <div class="about-modal-content">
        <h1>Enjoy the tours!</h1>
        <button on:click={() => {showAboutPanel=false}}>close</button>
    </div>
</div>
{/if}
<main>
    {#if showLayerPanel}
    <div id="layer-panel">
        <div>
            <h1 hidden=true>Winding Roads Art Tour</h1>
            <img src="/logo_green.png" alt="Winding Roads Art Tour logo" style="max-width: 100%;"/>
        </div>
        <div>
            <p>Basemap testing
            <button on:click={() => {setBasemap('mbOutdoors')}}>1</button>
            <button on:click={() => {setBasemap('stamenTerrain')}}>2</button>
            <button on:click={() => {setBasemap('watercolorLabels')}}>3</button>
            <button on:click={() => {showAboutPanel=true}}>learn more</button>
            </p>
        </div>
        <div class="panel-content">
            <div class=layer-section>
                <div><button class="layer-header" on:click={() => {showSponsorList=!showSponsorList}}>Visit our sponsors! {@html showSponsorList ? '&blacktriangledown;' : '&blacktriangleright;'}</button></div>
                {#if showSponsorList}
                <div class="layer-item-list">
                    <ul>
                        {#each sponsorList as s}
                        <li>
                            <button class="zoom-to" on:click={() => {zoomAndPopup(s, 16)}}>{s.Name}</button>
                        </li>
                        {/each}
                    </ul>
                </div>
                {/if}
            </div>
            <div class=layer-section>
                <div><button class="layer-header" on:click={() => {showStudioList=!showStudioList}}>Tour Stops {@html showStudioList ? '&blacktriangledown;' : '&blacktriangleright;'}</button></div>
                {#if showStudioList}
                <div class="layer-item-list">
                    <ul>
                        {#each studioList as s}
                        <li>
                            <button class="zoom-to" on:click={() => {zoomAndPopup(s, 16)}}><strong>{s.Number}:</strong> {s.Name}</button>
                        </li>
                        {/each}
                    </ul>
                </div>
                {/if}
            </div>
        </div>
    </div>
    {/if}
    <div id="map"></div>
</main>
<div id="panel-btn"><button on:click={() => {showLayerPanel=!showLayerPanel}} style="{showLayerPanel ? 'border-color:#333; color:#333;' : ''};">{layerBtnLabel}</button></div>
<style>

    main {
        display: flex;
    }
    #map {
        height: 100vh;
    }
    #panel-btn {
        position: absolute;
        top: .5em;
        right: .5em;
        width: 35px;
        height: 1.5em;
        text-align: center;
        z-index: 1000;
    }

    #panel-btn button {
        color: #666666;
        background: white;
        border-radius: 4px;
        border: 1px solid rgba(255, 255, 255, 0.75);
        cursor: pointer;
        width: 35px;
        font-size: 1.2em;
    }

    #panel-btn button:hover {
        color: #333333;
        border-color: #333333;
    }

    #layer-panel {
        display: flex;
        flex-direction: column;
        color: #333333;
        width: 250px;
        max-width: 100%;
        max-height: 100vh;
        background: white;
        border-right: 1px solid #333333;
        padding: 15px;
        align-items: center;
        z-index: 999;
        overflow-y:scroll;
    }

    .layer-item-list {
        overflow-y: scroll;
    }

    .panel-content ul {
        list-style: none;
        padding-left: 0px;
    }

    .panel-content button {
        border: none;
        background: none;
        text-align: left;
        cursor: pointer;
    }

    .panel-content button.layer-header {
        border: none;
        /* background: red; */
        width: 100%;
    }

    .panel-content button.zoom-to {
        border: none;
        font-weight: 300;
        width: unset;
    }
    .panel-content button.zoom-to:hover {
        text-decoration: underline;
    }

    .p-modal-bg {
        position: absolute;
        background: white;
        z-index: 1000000;
        height: 100vh;
        width: 100%;
    }
    .p-modal-content {
        position: absolute;
        top: 3em;
        right: 0;
        left: 0;
        margin: auto;
        width: 200px;
    }

    .about-modal-bg {
        position: absolute;
        background: rgba(255, 255, 255, .6);
        z-index: 999999;
        height: 100vh;
        width: 100%;
    }
    .about-modal-content {
        position: absolute;
        background: white;
        border-radius: 4px;
        top: 3em;
        right: 0;
        left: 0;
        margin: auto;
        width: 400px;
        max-width: 80%;
        padding: 10px;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .panel-content {
        width: 100%;
    }

    .layer-item {
        display: flex;
        justify-content: space-between;
    }

    /* .ol-popup {
        max-width: 350px;
    } */
    /*
    .ol-popup:after, .ol-popup:before {
        top: 100%;
        border: solid transparent;
        content: " ";
        height: 0;
        width: 0;
        position: absolute;
        pointer-events: none;
    }
    .ol-popup:after {
        border-top-color: white;
        border-width: 10px;
        left: 48px;
        margin-left: -10px;
    }
    .ol-popup:before {
        border-top-color: #cccccc;
        border-width: 11px;
        left: 48px;
        margin-left: -11px;
    }
    .ol-popup-closer {
        text-decoration: none;
        position: absolute;
        top: 2px;
        right: 8px;
    }
    .ol-popup-closer:after {
        content: "✖";
    } */
</style>
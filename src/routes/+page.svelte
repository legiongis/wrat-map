<script>
    import {onMount} from 'svelte';
    import 'ol/ol.css';

    import { browser } from '$app/environment';
    // import logo from '$lib/assets/logo_green.png';

    // import filter1893 from '$lib/filters/1893.geojson';
    // import filter1908 from '$lib/filters/1908.geojson';

    import Map from 'ol/Map';
    import View from 'ol/View';

    import OSM from 'ol/source/OSM';
    import Stamen from 'ol/source/Stamen.js';
    import XYZ from 'ol/source/XYZ';

    import TileLayer from 'ol/layer/Tile';
    import {WebGLTile as WebGLTileLayer} from 'ol/layer';
    import LayerGroup from 'ol/layer/Group';

    import {fromLonLat} from 'ol/proj.js';

    let showStudioList = false;

    let studioList = [
        {
            name: "studio 1",
            hours: "etc"
        },
        {
            name: "studio 2"
        }
    ]

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
            })
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
            ]
        })
    }
    
    const stamenTerrain = {
        id: 'stamenTerrain',
        layer: new TileLayer({
            source: new Stamen({
                layer: 'terrain',
            }),
        })
    }

    const basemaps = [
        mbOutdoors,
        watercolorLabels,
        stamenTerrain,
    ]

    function setBasemap(layerId) {
        basemaps.forEach( function (layerDef) {
            console.log(layerDef.id)
            if (layerDef.id == layerId){
                map.addLayer(layerDef.layer)
            } else {
                map.removeLayer(layerDef.layer)
            }
        })
    }

    const osmLayer = new TileLayer({
        source: new OSM(),
    })

    let showAboutPanel = false;
    let showLayerPanel = true;
    let layerBtnLabel;
    $: showLayerPanel ? layerBtnLabel = "×" : layerBtnLabel = "•••"

    const layerLookup = {
        studios: {
            name: "Sanborn 1950",
            visible: true,
            opacity: 100,
            layer: null,
            locLink: "https://www.loc.gov/resource/g4014nm.g03376195009/?sp=9&st=image",
        },
        sponsors: {
            name: "Sanborn 1937",
            visible: false,
            opacity: 100,
            layer: null,
            locLink: "https://www.loc.gov/resource/g4014nm.g03376193709/?sp=9&st=image",
        }
    }

    let map;
    onMount(() => {
        map = new Map({
            target: 'map',
            layers: [
                basemaps[0].layer,
            ],
            view: new View({
                center: fromLonLat([-90.8608076, 43.5300224]),
                zoom: 13,
            })
        })
    });

    // GOOGLE SHEETS DATA ACQUISITION
    // content pulled from elsewhere, needs to be reworked for Svelte
    // paste in your published Google Sheets URL from the browser address bar
    // var googleDocURL = 'https://docs.google.com/spreadsheets/d/1UHiOfqLCCfbyj--BZM1Y/edit#gid=0';

    // // insert your own Google Sheets API key from https://console.developers.google.com
    // var googleApiKey = 'fffffff-fffff';
    // $.ajax({
    //    url:'./Options.csv',
    //    type:'HEAD',
    //    error: function() {
    //      // Options.csv does not exist in the root level, so use Tabletop to fetch data from
    //      // the Google sheet

    //      if (typeof googleApiKey !== 'undefined' && googleApiKey) {

    //       var parse = function(res) {
    //         return Papa.parse(Papa.unparse(res[0].values), {header: true} ).data;
    //       }

    //       var apiUrl = 'https://sheets.googleapis.com/v4/spreadsheets/'
    //       var spreadsheetId = googleDocURL.indexOf('/d/') > 0
    //         ? googleDocURL.split('/d/')[1].split('/')[0]
    //         : googleDocURL

    //       $.getJSON(
    //         apiUrl + spreadsheetId + '?key=' + googleApiKey
    //       ).then(function(data) {
    //           var sheets = data.sheets.map(function(o) { return o.properties.title })

</script>
{#if showAboutPanel}
<div class="about-modal-bg">
    <div class="about-modal-content">
        <h1>Enjoy the tours!</h1>
        <button on:click={() => {showAboutPanel=false}}>close</button>
    </div>
</div>
{/if}
<div id="map"></div>
<div id="panel-btn"><button on:click={() => {showLayerPanel=!showLayerPanel}} style="{showLayerPanel ? 'border-color:#333; color:#333;' : ''};">{layerBtnLabel}</button></div>
{#if showLayerPanel}
<div id="layer-panel">
    <div>
        <h1 hidden=true>Winding Roads Art Tour</h1>
        <img src="/logo_green.png" alt="Winding Roads Art Tour logo" style="max-width: 100%;"/>
        <p>Visit our studios and sponsors!</p>
    </div>
    <div>
        <p>Basemap testing</p>
        <button on:click={() => {setBasemap('mbOutdoors')}}>outdoors</button>
        <button on:click={() => {setBasemap('stamenTerrain')}}>terrain</button>
        <button on:click={() => {setBasemap('watercolorLabels')}}>watercolor</button>
    </div>
    <hr>
    <div class="layer-item-list">
        <button on:click={() => {showStudioList=!showStudioList}}>Studios Locations</button>
        {#if showStudioList}
        <ul>
            {#each studioList as studio}
            <li>{studio.name}</li>
            {/each}
        </ul>
        {/if}
    </div>
    <hr>
    <div class="panel-footer"><button on:click={() => {showAboutPanel=true}}>learn more</button></div>
</div>
{/if}
<style>
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
        color: #333333;
        position: absolute;
        top: .5em;
        right: .5em;
        width: 250px;
        max-width: 100%;
        background: white;
        border-radius: 4px;
        border: 1px solid #333333;
        padding: 15px;
        display: flex;
        flex-direction: column;
        align-items: center;
        z-index: 999;
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
</style>
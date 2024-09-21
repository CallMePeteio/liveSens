


const ADD_DATAPOINT_CIRCLE_CHECKBOX = document.getElementById("datapoint-circle");
const UPDATE_LIVE_CHECKBOX = document.getElementById("update-live");

const DATAPOINT_SLIDER_COUNTER = document.getElementById("slider-value");
const DATAPOINT_SLIDER = document.getElementById("datapoint-slider");
const FROM_DATE_INPUT = document.getElementById("from-date");
const TO_DATE_INPUT = document.getElementById("to-date");

const RELOAD_BUTTON = document.getElementById("reload-graph");
const LOADING_ICON = document.getElementById("loading");


const API_KEY = "iUvKoZ9W$h4Mgq9Xb";
let TRACE_STYLE = {    
    mode: 'lines+markers',
    line: { width: 4 },  // Refined Google-like blue
    marker: { color: '#4285F4', size: 10, symbol: 'circle' },  // Larger markers
    hoverinfo: 'y+x',  // Show y and x values on hover
    hoverlabel: { bgcolor: '#fff', bordercolor: '#4285F4', font: { color: '#000' } }
}
const TIME_OPTIONS = {
    timeZone: 'Europe/Oslo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
};

const DATAPOINT_SLIDER_VALS = {small: {min: 500, max:5000, red: 7500}, big: {min: 10000, max: 100000, red: 90000}}

let chartDiv = document.getElementById('chart'); 
let lastSensorRetrivedTime = undefined;
let makeSliderRedOver = 90000;
let sensorDataAmount = 25000; // SETS DEFAULT AMOUNT OF DATAPOINTS TO GET
let letExtendGraph = false;


//---------------------- GRAPH INPUT

function formatDate(date) {
    const yy = String(date.getFullYear()).slice(-2); // Get last two digits of the year
    const mm = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed, so add 1
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
  
    return `20${yy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

async function updateGraph(){
    
    const fromDate = FROM_DATE_INPUT.value || undefined;
    const toDate = TO_DATE_INPUT.value || undefined;

    const dataPointCircle = ADD_DATAPOINT_CIRCLE_CHECKBOX.checked
    const updateLive = UPDATE_LIVE_CHECKBOX.checked
    const dataSlider = DATAPOINT_SLIDER.value

    if (dataPointCircle === true){
        TRACE_STYLE.mode = 'lines+markers'
    }else{
        TRACE_STYLE.mode = 'lines'
    }


    let fromDateUTC;
    if (fromDate != undefined){
        const parsedDate = new Date(fromDate);

        if (!isNaN(parsedDate.getTime())){
            fromDateUTC = new Date(new Date(parsedDate).setHours(parsedDate.getHours() - 2));
            fromDateUTC = formatDate(fromDateUTC);
        }else{
            alert("Ikke gyldig verdi under Fra Dato. Bruk YYYY-MM-DD TIME:MIN")
        }

    }

    let toDateUTC;
    if (toDate != undefined){
        const parsedDate = new Date(toDate);

        if (!isNaN(parsedDate.getTime())){
            toDateUTC = new Date(new Date(parsedDate).setHours(parsedDate.getHours() - 2));
            toDateUTC = formatDate(toDateUTC);
        }else{
            alert("Ikke gyldig verdi under Til Dato. Bruk YYYY-MM-DD TIME:MIN")
        }

    }
        
    sensorDataAmount = dataSlider; // UPDATES HOW MANY DATAPOINTS SHULD BE LOADED
    letExtendGraph = updateLive;

    LOADING_ICON.style.display = "block";
    makeGraph(fromDateUTC, toDateUTC);
}



//---------------------- GRAPH GENRATING & STYLE

function randomColor() {
    // Expand the hue range a bit to include more shades of blue, cyan, and purple-blues
    let hue = Math.floor(Math.random() * 100) + 180; // 180° to 280°
    
    // Broaden the saturation range to get both more muted and more vibrant shades
    let saturation = Math.floor(Math.random() * 50) + 20; // 20% to 70%
    
    // Allow lightness to vary more, from deeper blues to lighter blues
    let lightness = Math.floor(Math.random() * 50) + 30; // 30% to 80%

    // Return the HSL color string
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// JUST A BUNCH OF STYLING, DONT WORRY ABOUT IT :)
var layout = {
    title: {
        text: 'Sensor Data',
        font: {
            family: 'Inter, sans-serif',
            size: 28,
            color: '#202124'
        },
        x: 0.05,  // Left-aligned title
        xanchor: 'left'
    },
    xaxis: {
        title: {
            font: { size: 20, color: '#202124', family: 'Inter, sans-serif' }
        },
        showgrid: true,
        gridcolor: '#E0E0E0',  // Light gray grid
        zeroline: false,  // Show zero line for visual separation
        zerolinecolor: '#000',  // Make the zero line black for clarity
        zerolinewidth: 2,  // Increase width of the zero line to act as an outline
        tickangle: -45,  // Rotated ticks for clarity
        tickfont: { size: 14, color: '#5f6368', family: 'Inter, sans-serif' },
    },
    yaxis: {
        title: {
            text: 'Value',
            font: { size: 20, color: '#202124', family: 'Inter, sans-serif' }
        },
        showgrid: true,
        gridcolor: '#E0E0E0',
        zeroline: true,  // Add a zeroline as an outline for the Y axis
        zerolinecolor: '#000',
        zerolinewidth: 1,
        tickfont: { size: 14, color: '#5f6368', family: 'Inter, sans-serif' },
    },
    plot_bgcolor: '#ffffff',  // Clean white background
    paper_bgcolor: '#ffffff',  // Soft neutral outer background
    legend: {
        orientation: 'h',  // Horizontal legend
        x: 0.5,
        xanchor: 'center',
        y: -0.2,
        font: { size: 16, family: 'Inter, sans-serif' },
        bordercolor: '#E0E0E0',
        borderwidth: 1,
    },
    margin: {
        l: 100, r: 60, t: 80, b: 10,  // Adjust margins for more space
        pad: 0  // Padding between plot and outer border
    },
    hovermode: 'closest',  // Precise hover interactions
    transition: {
        duration: 500,
        easing: 'cubic-in-out'  // Smooth animation on update
    }
};

async function getSensData(API_KEY, sensorDataAmount, startTime=undefined, endTime=undefined) {
    
    let url;

 
    if (startTime !== undefined && startTime != undefined){
        url = `/api/data/all/${API_KEY}/${sensorDataAmount}/${startTime}/${endTime}`; 
    } else if (startTime !== undefined){
        url = `/api/data/all/${API_KEY}/${sensorDataAmount}/${startTime}`;
    } else if (endTime !== undefined){
        url = `/api/data/all/${API_KEY}/${sensorDataAmount}/undefined/${endTime}`
    } else{
        url = `/api/data/all/${API_KEY}/${sensorDataAmount}`;
    }

    try {
      const response = await fetch(url);  // Wait for the fetch request to complete
  
      if (!response.ok) {  // Check if the response is not OK (e.g., 401, 404)
        throw new Error(`Error: ${response.status}`);
      }
  
      const data = await response.json();  // Parse the response as JSON
      return data;  // Return the parsed JSON data
    } catch (error) {
      console.error("Error fetching data:", error);  // Handle any errors
      return null;  // Return null in case of error
    }
}

async function makeTraces(TRACE_STYLE, sensorDataAmount, lastSensorRetrivedTime, fromDate=undefined, toDate=undefined){
    const sensorData = await getSensData(API_KEY, sensorDataAmount, lastSensorRetrivedTime, fromDate, toDate);


    let traces = [];
    console.log(`Retrived new datapoints: ${(sensorData[Object.keys(sensorData)[0]].data.length) * 4}`)
    for (const [sensor, data] of Object.entries(sensorData)){

        const dataSize = data.data.length;
        let timeData = new Array(dataSize);
        let valueData = new Array(dataSize);
        let tempData = new Array(dataSize);

        for (let i = 0; i < dataSize; i++){

            let dataPoint = data.data[i]

            lastSensorRetrivedTime = dataPoint.created_at;
            
            const time = new Date(dataPoint.created_at)
            const norwegianTime = new Date(new Date(time).setHours(time.getHours() + 2));

            timeData[i] = (norwegianTime);
            valueData[i] = (dataPoint.value);
            tempData[i] = (dataPoint.temp);
        }

        const name = `${sensor} ${data.mesureType}`

        const traceData = { x: timeData, y: valueData, name: name, line: { color: randomColor() } };
        const trace = { ...TRACE_STYLE, ...traceData }; // MERGES TRACE STYLE AND TRACE DATA
        traces.push(trace)

    }

    return {traces:traces, lastSensorRetrivedTime:lastSensorRetrivedTime}
}

async function makeGraph(fromDate=undefined, toDate=undefined){
    const result = await makeTraces(TRACE_STYLE, sensorDataAmount, fromDate, toDate);

    lastSensorRetrivedTime = result.lastSensorRetrivedTime
    LOADING_ICON.style.display = "none";
    Plotly.newPlot('chart', result.traces, layout, { responsive: true });

}

async function extendGraph(){
    if (letExtendGraph === true){
        const result = await makeTraces(TRACE_STYLE, sensorDataAmount, lastSensorRetrivedTime);  // Get new data points

        lastSensorRetrivedTime = result.lastSensorRetrivedTime;
        const newTraces = result.traces;

        console.log(lastSensorRetrivedTime)


        for (let i = 0; i < newTraces.length; i++) {
            const update = {
                x: [newTraces[i].x],
                y: [newTraces[i].y]
            };

            Plotly.extendTraces(chartDiv, update, [i]);  // 'i' is the trace index
        }
    }
}


RELOAD_BUTTON.onclick = updateGraph;
DATAPOINT_SLIDER_COUNTER.textContent = "Verdi:" + sensorDataAmount;
DATAPOINT_SLIDER.value = sensorDataAmount


DATAPOINT_SLIDER.addEventListener("input", function (){
    const sliderVal = DATAPOINT_SLIDER.value;
    DATAPOINT_SLIDER_COUNTER.textContent = "Verdi:" + sliderVal;

    if (sliderVal >= makeSliderRedOver){
        DATAPOINT_SLIDER.classList.add("accent-red-500");
    }else{
        DATAPOINT_SLIDER.classList.remove("accent-red-500");  
    }
})


// CHANGES THE SCALE OF SLIDEBAR, WHEN USER CLICKS "Datapunkt Sirkel" CHECKBOX
ADD_DATAPOINT_CIRCLE_CHECKBOX.addEventListener("click", function () {

    if (!ADD_DATAPOINT_CIRCLE_CHECKBOX.checked){
        DATAPOINT_SLIDER.max = DATAPOINT_SLIDER_VALS.big.max;
        DATAPOINT_SLIDER.min = DATAPOINT_SLIDER_VALS.big.min;

        document.getElementById("max-slider-text").textContent = DATAPOINT_SLIDER_VALS.big.max
        document.getElementById("min-slider-text").textContent = DATAPOINT_SLIDER_VALS.big.min;

        DATAPOINT_SLIDER.value = DATAPOINT_SLIDER_VALS.big.max/2
        DATAPOINT_SLIDER_COUNTER.textContent = "Verdi: " + DATAPOINT_SLIDER_VALS.big.max/2;

        makeSliderRedOver = DATAPOINT_SLIDER_VALS.big.red
    } else{
        DATAPOINT_SLIDER.max = DATAPOINT_SLIDER_VALS.small.max;
        DATAPOINT_SLIDER.min = DATAPOINT_SLIDER_VALS.small.min;

        document.getElementById("max-slider-text").textContent = DATAPOINT_SLIDER_VALS.small.max;
        document.getElementById("min-slider-text").textContent = DATAPOINT_SLIDER_VALS.small.min;

        DATAPOINT_SLIDER.value = DATAPOINT_SLIDER_VALS.small.max/2
        DATAPOINT_SLIDER_COUNTER.textContent = "Verdi: " + DATAPOINT_SLIDER_VALS.small.max/2;

        makeSliderRedOver = DATAPOINT_SLIDER_VALS.small.red
    }
})


updateGraph() // MAKES GRAPH, BASED ON DEFAULT SETTINGS GOTTEN FROM SETTINGS
setInterval(extendGraph, 60000)
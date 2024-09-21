



const SENSOR_CONTAINER = document.getElementById("sensor-data");
const API_KEY = "iUvKoZ9W$h4Mgq9Xb";


async function getSensData(API_KEY) {
    const url = `/api/gather/sensData/${API_KEY}`;  // Construct the URL with the API key
  
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
  

function makeSensHtml(value, type, temp){
    const html = `
    <div class="flex items-center justify-between border-b py-2">
     <div class="text-gray-800 font-bold text-2xl">${value}</div>
     <div class="text-sm">
      <div>${type}</div>
      <div>${temp} °C</div>
     </div>
    </div>`


    return html
}


function main(){
    getSensData(API_KEY).then(fullSensData => {
      if (fullSensData) {

        let htmlString = ""
        for (const [sensor, data] of Object.entries(fullSensData)){
            const newHtml = makeSensHtml(data.value, data.type, data.temp) 
            htmlString += newHtml;
        }

        SENSOR_CONTAINER.innerHTML = htmlString;

    } else {
        console.log("There was an error retriving sensor data.");
      } 
    }); 
}

main()
setInterval(main, 1000)

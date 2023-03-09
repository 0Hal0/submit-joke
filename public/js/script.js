//DELIVER_JOKE_URI = "http://localhost:3000/"
DELIVER_JOKE_URI = "https://172.187.200.30:3000/"
//SUBMIT_JOKE_URI = "http://localhost:3000/"
SUBMIT_JOKE_URI = "https://20.117.201.109:3000/"

async function getJokeTypes(){
    var dropdown = document.getElementById("type-select")

    
    try{
        //get the up to date joke types from the deliver_joke service
        jokeTypes = await getRequest(DELIVER_JOKE_URI + "joke-types")
    }
    catch{
        console.log(err);
    }
    if(jokeTypes != null){
        for (let i = 0; i < jokeTypes.length; i++){
            var jokeType = document.createElement("option")
            jokeType.text = jokeTypes[i]["type"]
            jokeType.value = jokeTypes[i]["type"]
            dropdown.add(jokeType)
        }
        //update the local copy of joke types
        var body = JSON.stringify(jokeTypes)
        try{
            let response = await fetch(SUBMIT_JOKE_URI + "joke-types", {
                method: "PUT",
                body : body,
                headers: {
                    "Content-type": "application/json; charset=UTF-8"
                }
            });
        }catch(err){
            console.log(err);
        }
    }
    else{
        //Get the most up to date local copy of joke types
        try{
            jokeTypes = await getRequest(SUBMIT_JOKE_URI + "joke-types")
        }catch(err){
            console.log(err)
        }

        //date the dropdown list with the up to date joke types
        for (let i = 0; i < jokeTypes.length; i++){
            var jokeType = document.createElement("option")
            jokeType.text = jokeTypes[i]["type"]
            jokeType.value = jokeTypes[i]["type"]
            dropdown.add(jokeType)
        }
    }
        

    

}

async function getRequest(uri) {
    try {
      //let response = await fetch(uri);
      console.log(uri)
      let response = await fetch(uri);
      let jsonObj = await response.json();
      //console.log('Type: ', jsonObj[0].type);
      return jsonObj;
    } catch (error) {
      console.log(error);
    }
}

async function submitJoke(){
    document.getElementById("message").innerHTML = ""
    var type = document.getElementById("type-select").value
    var setup = document.getElementById("setup").value
    var punchline = document.getElementById("punchline").value

    if(setup == "" || punchline == ""){
        document.getElementById("message").innerHTML = "Please make sure all fields are filled out before submitting the joke."
        return
    }

    var body = JSON.stringify({
        type: type,
        setup: setup,
        punchline: punchline })
    
    console.log(body)

    try{
        let response = await fetch(SUBMIT_JOKE_URI + "joke", {
            method: "POST",
            body : body,
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            }
        })
    }catch (error){
        console.log(error);
        document.getElementById("message").innerHTML = "Error submitting the joke"
        return;
    }
    document.getElementById("message").innerHTML = "Successfully submitted joke"

}

var https = require('https');
var fs = require("fs");
var express = require('express');
var app = express();

var searchEngineId = "004509529013402017404:iaeoohlh7uy";

var latestSearch = [];


// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

app.get("/api/imagesearch/*", function(req, res){
  var offset = req.query.hasOwnProperty("offset") ? (parseInt(req.query.offset) * 10) : 1;
  var userSearch = req.url.replace("/api/imagesearch/", "").split("?")[0];
  
  if(userSearch.length > 0){
    var searchUrl = getSearchUrl(userSearch, offset);
    
    https.get(searchUrl, (response) => {
      let data = "";
      response.on("data", (chunk) => {data += chunk;});
      response.on("end", () => {
        var fullResults = JSON.parse(data);
        
        var thisPageArray = [];
        for(var j=0; j < 10; j++){
          thisPageArray.push({
                  "url": fullResults.items[j].link,
                  "snippet": fullResults.items[j].snippet,
                  "thumbnail": fullResults.items[j].image.thumbnailLink,
                  "context": fullResults.items[j].image.contextLink
                });
        }
        
        //set latest search
        
        fs.readFile('latest.json', 'utf8', (err, data) => {
          latestSearch = JSON.parse(data);
          if(latestSearch.length < 10){
            latestSearch.unshift({"term": userSearch, "when": new Date(Date.now()).toUTCString()});
          }
          else{
            latestSearch.pop();
            latestSearch.unshift({"term": userSearch, "when": new Date(Date.now()).toUTCString()});
          }
          
          var json = JSON.stringify(latestSearch);
          fs.writeFile("latest.json", json, 'utf8', (err) => {
            if(err){console.error(err);}
          });        
        });
        
        res.json(thisPageArray);
      });
    })
    .on("error", (err) => {console.error(err);});
  }
  
  else{
    res.json({"error": "You must search for something!"});
  }
  
});

app.get("/api/latest", function(req, res){
  fs.readFile('latest.json', 'utf8', (err, data) => {
          latestSearch = JSON.parse(data);
          res.json(latestSearch);
    });
});

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});


function getSearchUrl(s, n){
  s = s.replace("%20", "+");
  var search = "https://www.googleapis.com/customsearch/v1?cx=" + searchEngineId;
  search += "&q=" + s + "&key=" + process.env.KEY + "&searchType=image" + "&start=" + n.toString();
  
  return search;
}


var express = require('express');
var fs      = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();

var bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: false }));

var fsMeilleursAgents = fs.readFileSync("meilleursAgents.json");
var meilleursAgents = JSON.parse(fsMeilleursAgents);

var fsLeBonCoin = fs.readFileSync("leBonCoin.json");
var leBonCoin = JSON.parse(fsLeBonCoin);


const SERVER_PORT = 2000;

/////////////////////////////////////////////////////////////////////////////////////////
app.listen(SERVER_PORT);
console.log('--------------Server Launched--------------');
//exports = module.exports = app;

/////////////////////////////////////////////////////////////////////////////////////////

app.get('/', (request, response) => {response.sendFile(__dirname+'/index.html')});
app.get('/index', (request, response) => {response.sendFile(__dirname+'/index.html')});

/////////////////////////////////////////////////////////////////////////////////////////
app.post('/', function(req, res){
    var urlLebonCoin = req.body.url;//we get back Url from the form
    console.log(urlLebonCoin);
    
    request( urlLebonCoin, function(error, response, html){

        if(!error){
            //we load the html page of the url given by the user
            var $ = cheerio.load(html);

            //we get the 4 elements that iteres us
            var price=$('#adview > section > section > section.properties.lineNegative > div:nth-child(5) > h2 > span.value');
            price=price.text();

            var surface=$('#adview > section > section > section.properties.lineNegative > div:nth-child(9) > h2 > span.value');
            surface=surface.text();

            var town=$('#adview > section > section > section.properties.lineNegative > div.line.line_city > h2 > span.value');
            town=town.text();

            var type=$('#adview > section > section > section.properties.lineNegative > div:nth-child(7) > h2 > span.value');
            type=type.text();

            //clean variable
            price=cleanPrice(price);
            
            surface=surface.replace(" ","");
            surface=surface.replace("m2","");

            town=town.trim();
            town=convert_accented_characters(town);
            town=town.toLowerCase()

            type=type.trim();

            //convert into the right type
            price=parseInt(price);
            surface=parseInt(surface);

            //print to console to be sure
            console.log(price);
            console.log(surface);
            console.log(town);
            console.log(type);

            //save in json file
            leBonCoin.price=price;
            leBonCoin.surface=surface;
            leBonCoin.town=town;
            leBonCoin.type=type;
            leBonCoin.priceSquareMeter=leBonCoin.price/leBonCoin.surface;
        }

        var urlMeilleursAgents="https://www.meilleursagents.com/prix-immobilier/"+leBonCoin.town;
        
        request( urlMeilleursAgents, function(error2, response2, html2){//assycrone have to be 1 in the other to avoid pb

            if(!error2){
                //we load the html page of the url given by the user
                var $ = cheerio.load(html2);

                //we get the 6 elements that iteres us
                var lowMaison=$("#synthese > div.prices-summary.baseline > div.prices-summary__values > div:nth-child(3) > div.small-4.medium-2.medium-offset-0.columns.prices-summary__cell--muted");
                lowMaison=lowMaison.text();

                var mediumMaison=$("#synthese > div.prices-summary.baseline > div.prices-summary__values > div:nth-child(3) > div.small-4.medium-2.columns.prices-summary__cell--median");
                mediumMaison=mediumMaison.text();

                var highMaison=$("#synthese > div.prices-summary.baseline > div.prices-summary__values > div:nth-child(3) > div:nth-child(4)");
                highMaison=highMaison.text();

                var lowAppartement=$("#synthese > div.prices-summary.baseline > div.prices-summary__values > div:nth-child(2) > div.small-4.medium-2.medium-offset-0.columns.prices-summary__cell--muted");
                lowAppartement=lowAppartement.text();

                var mediumAppartement=$("#synthese > div.prices-summary.baseline > div.prices-summary__values > div:nth-child(2) > div.small-4.medium-2.columns.prices-summary__cell--median");
                mediumAppartement=mediumAppartement.text();

                var highAppartement=$("#synthese > div.prices-summary.baseline > div.prices-summary__values > div:nth-child(2) > div:nth-child(4)");
                highAppartement=highAppartement.text();
    
                //clean variable
                lowMaison=cleanPrice(lowMaison);
                mediumMaison=cleanPrice(mediumMaison);
                highMaison=cleanPrice(highMaison);
                lowAppartement=cleanPrice(lowAppartement);
                mediumAppartement=cleanPrice(mediumAppartement);
                highAppartement=cleanPrice(highAppartement);

                //convert into the right type
                lowMaison=parseInt(lowMaison);
                mediumMaison=parseInt(mediumMaison);
                highMaison=parseInt(highMaison);
                lowAppartement=parseInt(lowAppartement);
                mediumAppartement=parseInt(mediumAppartement);
                highAppartement=parseInt(highAppartement);

                //print to console to be sure
                console.log(lowMaison);
                console.log(mediumMaison);
                console.log(highMaison);
                console.log(lowAppartement);
                console.log(mediumAppartement);
                console.log(highAppartement);

                //save in json file
                meilleursAgents.maison.low=lowMaison;
                meilleursAgents.maison.medium=mediumMaison;
                meilleursAgents.maison.high=highMaison;
                meilleursAgents.appartement.low=lowAppartement;
                meilleursAgents.appartement.medium=mediumAppartement;
                meilleursAgents.appartement.high=highAppartement;
                

                //We save the result of meilleur agent
                fs.writeFile('meilleursAgents2.json', JSON.stringify(meilleursAgents, null, 4), function(err){
                    console.log('File meilleursAgents2 successfully written!');
                });
                fs.writeFile('leBonCoin2.json', JSON.stringify(leBonCoin, null, 4), function(err){
                    console.log('File leBonCoin2 successfully written!');
                });

                

                if(leBonCoin.type="Maison"){
                    if(leBonCoin.priceSquareMeter<meilleursAgents.maison.low){res.redirect('..?deal=1#estimation');}
                    else if(meilleursAgents.maison.low<leBonCoin.priceSquareMeter && leBonCoin.priceSquareMeter<meilleursAgents.maison.medium){res.redirect('..?deal=2#estimation');}
                    else if(meilleursAgents.maison.medium<leBonCoin.priceSquareMeter && leBonCoin.priceSquareMeter<meilleursAgents.maison.high){res.redirect('..?deal=3#estimation');}
                    else{res.redirect('..?deal=4#estimation');}
                }
                else{
                    if(leBonCoin.priceSquareMeter<meilleursAgents.appartement.low){res.redirect('..?deal=1#estimation');}
                    else if(meilleursAgents.appartement.low<leBonCoin.priceSquareMeter && leBonCoin.priceSquareMeter<meilleursAgents.appartement.medium){res.redirect('..?deal=2#estimation');}
                    else if(meilleursAgents.appartement.medium<leBonCoin.priceSquareMeter && leBonCoin.priceSquareMeter<meilleursAgents.appartement.high){res.redirect('..?deal=3#estimation');}
                    else{res.redirect('..?deal=4#estimation');}
                }
            }
        });
    });

    
});
/////////////////////////////////////dependencies//////////////////////////////////////////
app.get('/vendor/bootstrap/css/bootstrap.min.css', (request, response) => {response.sendFile(__dirname+'/vendor/bootstrap/css/bootstrap.min.css')});
app.get('/vendor/font-awesome/css/font-awesome.min.css', (request, response) => {response.sendFile(__dirname+'/vendor/font-awesome/css/font-awesome.min.css')});
app.get('/vendor/jquery/jquery.min.js', (request, response) => {response.sendFile(__dirname+'/vendor/jquery/jquery.min.js')});
app.get('/vendor/bootstrap/js/bootstrap.min.js', (request, response) => {response.sendFile(__dirname+'/vendor/bootstrap/js/bootstrap.min.js')});
app.get('/js/jqBootstrapValidation.js', (request, response) => {response.sendFile(__dirname+'/js/jqBootstrapValidation.js')});
app.get('/js/agency.min.js', (request, response) => {response.sendFile(__dirname+'/js/agency.min.js')});
app.get('/css/agency.min.css', (request, response) => {response.sendFile(__dirname+'/css/agency.min.css')});
app.get('/js/jqBootstrapValidation.js', (request, response) => {response.sendFile(__dirname+'/js/jqBootstrapValidation.js')});
app.get('/js/contact_me.js', (request, response) => {response.sendFile(__dirname+'/js/contact_me.js')});


app.get('https://fonts.googleapis.com/css?family=Montserrat:400,700', (request, response) => {response.sendFile('https://fonts.googleapis.com/css?family=Montserrat:400,700')});
app.get('https://fonts.googleapis.com/css?family=Kaushan+Script', (request, response) => {response.sendFile('https://fonts.googleapis.com/css?family=Kaushan+Script')});
app.get('https://fonts.googleapis.com/css?family=Droid+Serif:400,700,400italic,700italic', (request, response) => {response.sendFile('https://fonts.googleapis.com/css?family=Droid+Serif:400,700,400italic,700italic')});
app.get('https://fonts.googleapis.com/css?family=Roboto+Slab:400,100,300,700', (request, response) => {response.sendFile('https://fonts.googleapis.com/css?family=Roboto+Slab:400,100,300,700')});
app.get('https://cdnjs.cloudflare.com/ajax/libs/jquery-easing/1.3/jquery.easing.min.js', (request, response) => {response.sendFile('https://cdnjs.cloudflare.com/ajax/libs/jquery-easing/1.3/jquery.easing.min.js')});

app.get('/img/header-bg.jpg', (request, response) => {response.sendFile(__dirname+'/img/header-bg.jpg')});
app.get('/img/map-image.png', (request, response) => {response.sendFile(__dirname+'/img/map-image.png')});

app.get('vendor/font-awesome/fonts/fontawesome-webfont.woff2', (request, response) => {response.sendFile(__dirname+'vendor/font-awesome/fonts/fontawesome-webfont.woff2')});
//app.get('http://localhost:2000/vendor/font-awesome/fonts/fontawesome-webfont.woff', (request, response) => {response.sendFile('http://localhost:2000/vendor/font-awesome/fonts/fontawesome-webfont.woff?v=4.6.3')});
/*app.get('/', (request, response) => {response.sendFile(__dirname+'/')});
app.get('/', (request, response) => {response.sendFile(__dirname+'/')});*/




/////////////////////////////////////Methodes////////////////////////////////////////////////////
function convert_accented_characters(str){
    var conversions = new Object();
    conversions['ae'] = 'ä|æ|ǽ';
    conversions['oe'] = 'ö|œ';
    conversions['ue'] = 'ü';
    conversions['Ae'] = 'Ä';
    conversions['Ue'] = 'Ü';
    conversions['Oe'] = 'Ö';
    conversions['A'] = 'À|Á|Â|Ã|Ä|Å|Ǻ|Ā|Ă|Ą|Ǎ';
    conversions['a'] = 'à|á|â|ã|å|ǻ|ā|ă|ą|ǎ|ª';
    conversions['C'] = 'Ç|Ć|Ĉ|Ċ|Č';
    conversions['c'] = 'ç|ć|ĉ|ċ|č';
    conversions['D'] = 'Ð|Ď|Đ';
    conversions['d'] = 'ð|ď|đ';
    conversions['E'] = 'È|É|Ê|Ë|Ē|Ĕ|Ė|Ę|Ě';
    conversions['e'] = 'è|é|ê|ë|ē|ĕ|ė|ę|ě';
    conversions['G'] = 'Ĝ|Ğ|Ġ|Ģ';
    conversions['g'] = 'ĝ|ğ|ġ|ģ';
    conversions['H'] = 'Ĥ|Ħ';
    conversions['h'] = 'ĥ|ħ';
    conversions['I'] = 'Ì|Í|Î|Ï|Ĩ|Ī|Ĭ|Ǐ|Į|İ';
    conversions['i'] = 'ì|í|î|ï|ĩ|ī|ĭ|ǐ|į|ı';
    conversions['J'] = 'Ĵ';
    conversions['j'] = 'ĵ';
    conversions['K'] = 'Ķ';
    conversions['k'] = 'ķ';
    conversions['L'] = 'Ĺ|Ļ|Ľ|Ŀ|Ł';
    conversions['l'] = 'ĺ|ļ|ľ|ŀ|ł';
    conversions['N'] = 'Ñ|Ń|Ņ|Ň';
    conversions['n'] = 'ñ|ń|ņ|ň|ŉ';
    conversions['O'] = 'Ò|Ó|Ô|Õ|Ō|Ŏ|Ǒ|Ő|Ơ|Ø|Ǿ';
    conversions['o'] = 'ò|ó|ô|õ|ō|ŏ|ǒ|ő|ơ|ø|ǿ|º';
    conversions['R'] = 'Ŕ|Ŗ|Ř';
    conversions['r'] = 'ŕ|ŗ|ř';
    conversions['S'] = 'Ś|Ŝ|Ş|Š';
    conversions['s'] = 'ś|ŝ|ş|š|ſ';
    conversions['T'] = 'Ţ|Ť|Ŧ';
    conversions['t'] = 'ţ|ť|ŧ';
    conversions['U'] = 'Ù|Ú|Û|Ũ|Ū|Ŭ|Ů|Ű|Ų|Ư|Ǔ|Ǖ|Ǘ|Ǚ|Ǜ';
    conversions['u'] = 'ù|ú|û|ũ|ū|ŭ|ů|ű|ų|ư|ǔ|ǖ|ǘ|ǚ|ǜ';
    conversions['Y'] = 'Ý|Ÿ|Ŷ';
    conversions['y'] = 'ý|ÿ|ŷ';
    conversions['W'] = 'Ŵ';
    conversions['w'] = 'ŵ';
    conversions['Z'] = 'Ź|Ż|Ž';
    conversions['z'] = 'ź|ż|ž';
    conversions['AE'] = 'Æ|Ǽ';
    conversions['ss'] = 'ß';
    conversions['IJ'] = 'Ĳ';
    conversions['ij'] = 'ĳ';
    conversions['OE'] = 'Œ';
    conversions['f'] = 'ƒ';
    conversions['-'] = '\'| ';

    for(var i in conversions){
        var re = new RegExp(conversions[i],"g");
        str = str.replace(re,i);
    }

    return str;
}

function cleanPrice(price){
    price=price.trim();
    price=price.replace('\xa0',"");//remove &nbsp caracter
    price=price.replace("€","");
    price=price.replace(" ","");
    return price;
}
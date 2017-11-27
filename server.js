require('dotenv').config();
var express     = require('express')
  , app 	    = express()
  , bodyParser  = require('body-parser')
  , cookieParser = require('cookie-parser')
  , session 	= require('express-session')
;
app.set('port', (process.env.PORT || 5000));
app.use(cookieParser(process.env.SECRET));
app.use(session({
    secret: process.env.SECRET,
    resave: true,
    cookie: { maxAge: 86400000 },
    saveUninitialized: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(req, res) {
  const state = req.query.state;
  const service = req.query.TARGET;
  if(req.cookies.ticket){
    return res.redirect(decodeURIComponent(service)+'?state='+state+'&ticket='+req.cookies.ticket);
  } else {
    return res.render('index',{
      state: state || '',
      service: service || '',
      favicon: process.env.URL_FAVICON,
      logo: process.env.URL_LOGO
    });
  }
});
app.post('/login', function(req, res) {
  const state = req.query.state;
  const service = req.query.TARGET;
  const ticket = encrypt(req.body.username)
  if(req.body.password==process.env.PASSWORD){
    res.cookie('ticket', ticket)
    return res.redirect( decodeURIComponent(service) + '?state='+state+'&ticket='+ticket);
  } else {
    return res.redirect('/?state='+state+'&TARGET='+service);
  }
});
app.get('/logout', function(req, res) {
  res.clearCookie("ticket");  
  return res.redirect(req.query.redirect);
});
app.get('/validate', function(req, res) {
  var UID_CUP = decrypt(req.query.ticket)
  return res.json({
    UID_CUP: UID_CUP,
    MAIL_CUP: UID_CUP,
    FIRST_NAME_CUP: UID_CUP,
    LAST_NAME_CUP: UID_CUP
  });
});
app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
// Nodejs encryption with CTR
var crypto = require('crypto'),
algorithm = 'aes-256-ctr',
password = 'd6F3Efeq';
function encrypt(text){
  var cipher = crypto.createCipher(algorithm,password)
  var crypted = cipher.update(text,'utf8','hex')
  crypted += cipher.final('hex');
  return crypted;
}
function decrypt(text){
  var decipher = crypto.createDecipher(algorithm,password)
  var dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('utf8');
  return dec;
}
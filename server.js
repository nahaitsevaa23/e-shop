const express = require("express");
const jsondb = require("simple-json-db")

const db = new jsondb("./DATA/uzivatele.json");

const app = express();
const session = require("express-session");
if (!db.has('pocitadlo')){
    db.set("pocitadlo", 0)
}




app.set("view engine", "ejs");
app.set("views", "./views")

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("./www"));

// session
app.use(session({
    secret: "ab",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));


app.get("/koupit.html", (req, res) => {
    const prihlaseny = req.session.prihlasenyUzivatel;

    if(typeof prihlaseny === 'undefined') {
        return res.redirect('/prihlaseni');
    }

    res.render("koupit", {
        chyba_prihlaseni: req.session.chyba_prihlaseni,
        chyba_registrace: req.session.chyba_registrace,
    })
})

app.get("/kosik.html", (req, res) => {
    const prihlaseny = req.session.prihlasenyUzivatel;
    
    if(typeof prihlaseny === 'undefined') {
        return res.redirect('/prihlaseni');
    }

    res.render("kosik", {
        chyba: req.query.chyba,
    })
})

app.get("/uzivatel.html", (req, res) => {
    const prihlaseny = req.session.prihlasenyUzivatel;
    
    if(typeof prihlaseny === 'undefined') {
        return res.redirect('/prihlaseni');
    }

    res.render("uzivatel", {
        chyba: req.query.chyba,
    })
})

app.post("/prihlaseni", (req, res) => {
    const jmeno = req.body.jmeno.trim();
    const heslo = req.body.heslo.trim();

    const uzivatele = db.JSON()
    
    let existujeUzivatel = false;
    let spravneHeslo = false;
    
    for (let jmenoDB in uzivatele) {
        if (jmenoDB == jmeno) {
            existujeUzivatel = true;
            if (uzivatele[jmeno].heslo == heslo) {
                spravneHeslo = true
                
            }
        }
    }


    if (!existujeUzivatel) {
        req.session.chyba_prihlaseni = "Špatné jméno"
        return res.redirect("/koupit.html")
    } else if (!spravneHeslo) {
        req.session.chyba_prihlaseni = "Špatné heslo"
        return res.redirect("/koupit.html")
    }

    req.session.prihlasenyUzivatel = jmeno;

    res.redirect("/index.html")
   
});

app.post("/registrace", (req, res) => {
    const jmeno = req.body.jmeno;
    const heslo = req.body.heslo;
    const heslo_znovu = req.body.heslo_znovu;
    let zvolenyZpusob = req.body.data;

    if (jmeno == '' || heslo == '') {
        req.session.chyba_registrace = "Není spravně zadané údaje"
        return res.redirect("/koupit.html")
    } else if (heslo != heslo_znovu) {
        req.session.chyba_registrace = "hesla se neschodují!"
        return res.redirect("/koupit.html")
    } else if (db.has(jmeno)) {
        req.session.chyba_registrace = "Uživatel již existuje!"
        return res.redirect("/koupit.html")
    } else if (heslo.length < 8) {
        req.session.chyba_registrace = "heslo musí být minimalně 8 znaků"
        return res.redirect("/koupit.html");
    } else if (!heslo.match('0') && !heslo.match("1") && !heslo.match ("2") && !heslo.match ("3") && !heslo.match ("4") && !heslo.match ("5") && !heslo.match ("6")&&!heslo.match ("7") && !heslo.match ("8") && !heslo.match ("9")){
        req.session.chyba_registrace = "heslo musí mít minimalně jedno číslo"
        return res.redirect("/koupit.html")
    } else if (jmeno.length < 3) {
        req.session.chyba_registrace = "jméno musí být minimalně 3 znaky"
        return res.redirect("/koupit.html");
    }

    db.set(jmeno, { heslo })
    res.redirect("/kosik.html")
});

app.post("/doprava", (req, res) =>{
    console.log('přijatá data:' + req.body.data) 

    const uzivatel = req.session.prihlasenyUzivatel;
    const doprava = req.body.data;
    let dataUzivatele = db.get(uzivatel);

    if(uzivatel && doprava && dataUzivatele) {
        dataUzivatele["doprava"] = doprava;
        db.set(uzivatel, dataUzivatele);
    }

   
})

app.post("/pridatDoKosiku",(req,res)=>{
    const prihlaseny = req.session.prihlasenyUzivatel;
    const co = req.body.zbozi;
    console.log('do košíku přidává uživatel:' + prihlaseny)
    const dataUzivatele = db.get(prihlaseny);
    if(!('kosik' in dataUzivatele)){
        dataUzivatele.kosik = {};
    }
    if(typeof dataUzivatele.kosik[co] === 'undefined'){
        dataUzivatele.kosik[co] = 1;
    }
    else{
        dataUzivatele.kosik[co] += 1;
    }
    db.set(prihlaseny, dataUzivatele);
    res.send();
});


app.post("/odebratZkosiku",(req,res)=>{
    const prihlaseny = req.session.prihlasenyUzivatel;
    const co = req.body.zbozi;
    console.log('z košíku odebírá uživatel:' + prihlaseny)
    const dataUzivatele = db.get(prihlaseny);
    if(!('kosik' in dataUzivatele)){
        dataUzivatele.kosik = {};
    }
    if(!(co in dataUzivatele.kosik)){
        dataUzivatele.kosik[co] = 0;
    }
    else if(dataUzivatele.kosik[co] > 0 ){
        dataUzivatele.kosik[co] -= 1;
    }
    db.set(prihlaseny, dataUzivatele);
    res.send();
});


app.get("/doprava", (req, res) => {
    const prihlaseny = req.session.prihlasenyUzivatel;
    
    if(typeof prihlaseny === 'undefined') {
        return res.redirect('/prihlaseni');
    }

    res.render("doprava", {
        chyba: req.query.chyba,
    })
})

app.get("/registrace", (req, res) => {
    res.render("registrace", {
        chyba: req.query.chyba,
    })
})

app.get("/prihlaseni", (req, res) => {
    res.render("prihlaseni", {
        chyba: req.query.chyba,
    })
})

app.get("/moje-objednavka", (req, res) => {
    const prihlaseny = req.session.prihlasenyUzivatel;
    
    if(typeof prihlaseny === 'undefined') {
        return res.redirect('/prihlaseni');
    }

    if(typeof prihlaseny === 'undefined') {
        return res.redirect('/prihlaseni');
    }

    const data = db.get(prihlaseny);
    console.log("data " + data);
    
    console.log("kosik " + data.kosik);
    res.render('moje-objednavka', {
        polozky: data.kosik
    })
})
app.post("/moje-objednavka", (req, res) => {
    const prihlaseny = req.session.prihlasenyUzivatel;
    const data = db.get(prihlaseny);
    data.kosik.zpusobDopravy = req.body.zpusobDopravy;
    data.kosik.datumVytvoreni = new Date();

    console.log("Košík před...");
    console.log(data.kosik);

    if(!data.objednavky) {
        data.objednavky = [];
    }

    data.objednavky.push(data.kosik);
    data.kosik = {};

    console.log("Košík po...");
    console.log(data.kosik);
    console.log("Objednávka...")
    console.log(data.objednavky);

    db.set(prihlaseny, data);
    res.redirect("/konec-objednavky.html")
})
app.post("/konec-objednavky", (req,res) => {

    const prihlaseny = req.session.prihlasenyUzivatel;
    const data = db.get(prihlaseny);


    const udajePlatebniKarty = req.body.udajePlatebniKarty
    console.log(udajePlatebniKarty)
     


    if(udajePlatebniKarty != "..."){
        db.set("pocitadlo", db.get("pocitadlo") + 1)
    }
})


app.listen(8000);

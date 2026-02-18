import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import * as d3 from "d3";
import { createClient } from "@supabase/supabase-js";

// ─── SUPABASE CONNECTION ───
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ─── TOPOJSON DECODER ───
function dt(t,o){const{arcs:ra,transform:{scale:[sx,sy],translate:[tx,ty]}}=t;const a=ra.map(a=>{let x=0,y=0;return a.map(([dx,dy])=>{x+=dx;y+=dy;return[x*sx+tx,y*sy+ty]})});const da=i=>i>=0?a[i].slice():a[~i].slice().reverse();const dr=ids=>{const p=[];ids.forEach(i=>{const q=da(i);if(p.length)q.shift();p.push(...q)});return p};const dg=g=>g.type==="Polygon"?{type:"Polygon",coordinates:g.arcs.map(dr)}:g.type==="MultiPolygon"?{type:"MultiPolygon",coordinates:g.arcs.map(p=>p.map(dr))}:{type:g.type,coordinates:[]};return{type:"FeatureCollection",features:t.objects[o].geometries.map(g=>({type:"Feature",id:g.id,properties:g.properties||{},geometry:dg(g)}))}}

// ─── CONSTANTS ───
const AI=new Set(["012","024","204","072","854","108","120","132","140","148","174","178","180","384","262","818","226","232","748","231","266","270","288","324","624","404","426","430","434","450","454","466","478","480","504","508","516","562","566","646","678","686","690","694","706","710","728","729","834","768","788","800","894","716","732"]);
const NM={"012":"Algerije","024":"Angola","204":"Benin","072":"Botswana","854":"Burkina Faso","108":"Burundi","120":"Kameroen","132":"Kaapverdië","140":"CAR","148":"Tsjaad","174":"Comoren","178":"Rep. Congo","180":"DR Congo","384":"Ivoorkust","262":"Djibouti","818":"Egypte","226":"Eq. Guinea","232":"Eritrea","748":"Eswatini","231":"Ethiopië","266":"Gabon","270":"Gambia","288":"Ghana","324":"Guinee","624":"Guinee-Bissau","404":"Kenia","426":"Lesotho","430":"Liberia","434":"Libië","450":"Madagaskar","454":"Malawi","466":"Mali","478":"Mauritanië","480":"Mauritius","504":"Marokko","508":"Mozambique","516":"Namibië","562":"Niger","566":"Nigeria","646":"Rwanda","678":"São Tomé","686":"Senegal","690":"Seychellen","694":"Sierra Leone","706":"Somalië","710":"Zuid-Afrika","728":"Zuid-Soedan","729":"Soedan","834":"Tanzania","768":"Togo","788":"Tunesië","800":"Oeganda","894":"Zambia","716":"Zimbabwe","732":"W. Sahara"};
const CL={"180":"Grote Meren","108":"Grote Meren","646":"Grote Meren","800":"Grote Meren","140":"Grote Meren","854":"Sahel","148":"Sahel","562":"Sahel","466":"Sahel","478":"Sahel","686":"West-Afrika","270":"West-Afrika","624":"West-Afrika","324":"West-Afrika","694":"West-Afrika","430":"West-Afrika","384":"West-Afrika","288":"West-Afrika","768":"West-Afrika","204":"West-Afrika","566":"West-Afrika","120":"West-Afrika","226":"West-Afrika","266":"West-Afrika","178":"West-Afrika","132":"West-Afrika","678":"West-Afrika","729":"Hoorn","706":"Hoorn","728":"Hoorn","262":"Hoorn","232":"Hoorn","231":"Hoorn","012":"Noord-Afrika","434":"Noord-Afrika","818":"Noord-Afrika","504":"Noord-Afrika","788":"Noord-Afrika","732":"Noord-Afrika","404":"Oost & Zuidelijk","834":"Oost & Zuidelijk","174":"Oost & Zuidelijk","450":"Oost & Zuidelijk","480":"Oost & Zuidelijk","690":"Oost & Zuidelijk","024":"Oost & Zuidelijk","508":"Oost & Zuidelijk","894":"Oost & Zuidelijk","716":"Oost & Zuidelijk","454":"Oost & Zuidelijk","072":"Oost & Zuidelijk","516":"Oost & Zuidelijk","710":"Oost & Zuidelijk","748":"Oost & Zuidelijk","426":"Oost & Zuidelijk"};
const P={"Grote Meren":{f:"#C03030",h:"#D64545"},"Sahel":{f:"#B8864E",h:"#CCA066"},"West-Afrika":{f:"#1B8553",h:"#25A268"},"Hoorn":{f:"#6E7A88",h:"#8591A0"},"Noord-Afrika":{f:"#2B6CB5",h:"#3A82D0"},"Oost & Zuidelijk":{f:"#C4A030",h:"#D4B448"}};
const TABS=["defence","economic","political"];
const TL={defence:"Defensie",economic:"Economie",political:"Politiek"};
const TC={defence:"#C03030",economic:"#1B8553",political:"#2B6CB5"};
const CLUSTERS=["Grote Meren","Sahel","West-Afrika","Hoorn","Noord-Afrika","Oost & Zuidelijk"];

// ─── DEFAULT DATA ───
const DEFAULT_DATA={
"180":{name:"DR Congo",s:"Afrika's dodelijkste conflict. M23 (gesteund door Rwanda) dreef defensie-uitgaven op tot $6 mrd.",defence:[{f:"🇨🇳",a:"China",d:"Norinco wapen-JV. CH-4 drones. $36 mln CATIC-deal."},{f:"🇹🇷",a:"Turkije",d:"4 Bayraktar TB2 (mid-2025)."},{f:"🇦🇪",a:"VAE",d:"100+ Kasser II pantservoertuigen (nov 2024)."}],economic:[{f:"🇨🇳",a:"China",d:"Dominant mijnbouw (kobalt, coltan, koper). 70% wereldwijd coltan."},{f:"🇺🇸",a:"VS",d:"Kritieke mineralen. Washington Akkoorden."}],political:[{f:"🇺🇸",a:"VS",d:"Hoofdonderhandelaar Washington Akkoorden. Sancties Rwandese functionarissen."},{f:"🇫🇷",a:"Frankrijk",d:"VN-penhouder DRC. MONUSCO-mandaten."}]},
"108":{name:"Burundi",s:"Buffer tegen M23/Rwanda in Oost-DRC. Beperkte partners na westerse isolatie.",defence:[{f:"🇨🇳",a:"China",d:"Militaire hulp, training sinds westerse hulpstop 2015."},{f:"🇷🇺",a:"Rusland",d:"Wapenleverancier. VN-vetorecht."}],economic:[{f:"🇨🇳",a:"China",d:"Grootste bilaterale investeerder."},{f:"🇪🇺",a:"EU",d:"Hervatting hulp na opschorting 2015."}],political:[{f:"🇨🇳",a:"China",d:"Diplomatieke steun. Non-interventie gewaardeerd."},{f:"🇷🇺",a:"Rusland",d:"VN-Veiligheidsraad schild."}]},
"646":{name:"Rwanda",s:"Meest militair actieve kleine staat. 4.000–5.000 troepen Mozambique. M23-beschuldigingen.",defence:[{f:"🇺🇸",a:"VS",d:"Trainingspartner maar sancties wegens M23."},{f:"🇬🇧",a:"VK",d:"Militaire samenwerking. Asieldeal (gepauzeerd)."},{f:"🇫🇷",a:"Frankrijk",d:"Verzoening na genocide-breuk. Macron erkende 'verantwoordelijkheid' (2021)."}],economic:[{f:"🇬🇧",a:"VK",d:"Grootste donor. Arsenal-sponsoring."},{f:"🇨🇳",a:"China",d:"Infrastructuurpartner. BRI-lid."}],political:[{f:"🇺🇸",a:"VS/VK",d:"Gesanctioneerd wegens M23 maar partner in Mozambique."},{f:"🇫🇷",a:"Frankrijk",d:"Relatie hersteld na Macrons Kigali-bezoek."}]},
"800":{name:"Oeganda",s:"VS-CT partner (al-Shabaab, ADF). Museveni sinds 1986. Anti-LHBTI-wet verstoorde banden.",defence:[{f:"🇺🇸",a:"VS",d:"CT-partner. ATMIS. Hulpstops na anti-LHBTI-wet."},{f:"🇷🇺",a:"Rusland",d:"Wapenverkoop. Museveni bezocht Moskou (2023)."}],economic:[{f:"🇨🇳",a:"China",d:"Entebbe Expressway, Karuma Dam."},{f:"🇫🇷",a:"TotalEnergies",d:"$10 mrd EACOP-pijpleiding."}],political:[{f:"🇺🇸",a:"VS",d:"Verstoord na anti-homowet. CT gaat door."},{f:"🇨🇳",a:"China",d:"Voorwaardenvrij partnerschap gewaardeerd."}]},
"140":{name:"CAR",s:"Ruslands diepste Afrikaanse voetafdruk. Wagner/Africa Corps sinds 2017.",defence:[{f:"🇷🇺",a:"Rusland (Africa Corps)",d:"Tot 2.100 man. Presidentiële garde. Basis naar 10.000."},{f:"🇫🇷",a:"Frankrijk",d:"Gemarginaliseerd. Invloed nul."}],economic:[{f:"🇷🇺",a:"Rusland",d:"Wagner-bedrijven: goud, diamant, hout, brouwerij, media."}],political:[{f:"🇷🇺",a:"Rusland",d:"Touadéra's nauwste bondgenoot. Lijfwachten + adviseurs."}]},
"854":{name:"Burkina Faso",s:"Post-coup draai Rusland. Frankrijk verdreven. Alliantie van Sahelstaten.",defence:[{f:"🇷🇺",a:"Rusland (Africa Corps)",d:"100+ man sinds jan 2024. Presidentiële beveiliging."},{f:"🇷🇺",a:"Rusland (staat)",d:"Roscosmos-satellietdeal. Sahel-strijdmacht (apr 2025)."}],economic:[{f:"🇷🇺",a:"Rusland",d:"Goudmijnconcessies. Rosatom nucleair."},{f:"🇨🇳",a:"China",d:"Groeiende infrastructuurrol."}],political:[{f:"🇷🇺",a:"Rusland",d:"Voornaamste patroon."},{f:"🇫🇷",a:"Frankrijk",d:"Verdreven feb 2023."}]},
"562":{name:"Niger",s:"VS/Frankrijk verdreven. Rusland nam $110 mln dronebasis over.",defence:[{f:"🇷🇺",a:"Rusland (Africa Corps)",d:"~100 man Airbase 101 met luchtverdediging."},{f:"🇺🇸",a:"VS (verdreven)",d:"~1.000 troepen weg sept 2024. $110 mln Airbase 201."}],economic:[{f:"🇷🇺",a:"Rusland",d:"Rosatom wil uranium (~15% Franse kernbrandstof)."},{f:"🇨🇳",a:"China",d:"CNOOC oliepijpleiding Benin (2024)."}],political:[{f:"🇷🇺",a:"Rusland",d:"Sahelministers in Moskou (apr 2025)."},{f:"🇺🇸",a:"VS",d:"Beschadigd. Hefboom verdwenen."}]},
"466":{name:"Mali",s:"Ruslands eerste Sahelpartner (2021). Wagner → Africa Corps. Frankrijk en VN verdreven.",defence:[{f:"🇷🇺",a:"Rusland (Africa Corps)",d:"Wagner vervangen (juni 2025). Basis Bamako uitgebreid."},{f:"🇹🇷",a:"Turkije",d:"Bayraktar TB2 drones."}],economic:[{f:"🇷🇺",a:"Rusland",d:"Yadran goudraffinaderij. Mijnconcessies."},{f:"🇨🇳",a:"China",d:"Infrastructuur en mijnbouw. BRI."}],political:[{f:"🇷🇺",a:"Rusland",d:"Goïta bezocht Poetin (juni 2025)."},{f:"🇫🇷",a:"Frankrijk",d:"Verdreven 2022. Diplomatieke breuk."}]},
"148":{name:"Tsjaad",s:"Frankrijk verdreef troepen jan 2025 na 60+ jaar. China domineert olie.",defence:[{f:"🇫🇷",a:"Frankrijk (verdreven)",d:"~1.000 troepen weg jan 2025."},{f:"🇺🇸",a:"VS",d:"Kleine aanwezigheid."}],economic:[{f:"🇨🇳",a:"China",d:"CNPC olievelden en raffinaderij."},{f:"🇪🇺",a:"EU",d:"Defensiehulp (nov 2025)."}],political:[{f:"🇫🇷",a:"Frankrijk",d:"Verdreven ondanks sterkste bondgenootschap."},{f:"🇷🇺",a:"Rusland",d:"Africa Corps lonkt."}]},
"478":{name:"Mauritanië",s:"Sahelgrensland, coups vermeden. G5 Sahel-HQ. Relatief stabiel.",defence:[{f:"🇫🇷",a:"Frankrijk",d:"CT-training. Vermeed anti-Franse wending."},{f:"🇺🇸",a:"VS",d:"Groeiend CT-partnerschap."}],economic:[{f:"🇨🇳",a:"China",d:"IJzererts, visserij. BRI."},{f:"🇦🇪",a:"VAE/Golf",d:"Visserij, landbouw, infrastructuur."}],political:[{f:"🇫🇷",a:"Frankrijk",d:"Een van weinige Frans-geallieerde Sahelstaten."},{f:"🇨🇳",a:"China",d:"Groeiende betrokkenheid."}]},
"566":{name:"Nigeria",s:"230 mln, grootste economie. Boko Haram, ISWAP. Uitgebreid Strategisch Partnerschap China (2024).",defence:[{f:"🇺🇸",a:"VS",d:"$1 mrd+ uitrusting. Super Tucano's, AH-1Z Vipers."},{f:"🇨🇳",a:"China",d:"NORINCO lokale wapenproductie (mrt 2025). CN¥1 mrd training."},{f:"🇮🇹",a:"Italië",d:"$618 mln voor 6 M-346 jets."}],economic:[{f:"🇨🇳",a:"China",d:"$22,6 mrd handel (2023). Grootste engineeringmarkt Afrika."},{f:"🇺🇸",a:"VS",d:"Oliesector. AGOA."}],political:[{f:"🇨🇳",a:"China",d:"Uitgebreid Strategisch Partnerschap (2024)."},{f:"🇺🇸",a:"VS",d:"Sleutelpartner. CT cruciaal."}]},
"288":{name:"Ghana",s:"Democratisch model. Goud en cacao. VS, China, VK concurreren.",defence:[{f:"🇺🇸",a:"VS",d:"AFRICOM-oefeningen. CT-training."},{f:"🇨🇳",a:"China",d:"Uitrustingsdonaties."}],economic:[{f:"🇨🇳",a:"China",d:"$2 mrd Sinohydro bauxiet-deal."},{f:"🇺🇸",a:"VS",d:"MCC-compact ($308 mln). AGOA."}],political:[{f:"🇺🇸",a:"VS",d:"Geprefereerde democratische partner."},{f:"🇨🇳",a:"China",d:"BRI-infrastructuurdiplomatie."}]},
"384":{name:"Ivoorkust",s:"Snelstgroeiende economie West-Afrika. Laatste Franse basis verdreven (feb 2025).",defence:[{f:"🇫🇷",a:"Frankrijk (verdreven)",d:"~900 troepen weg feb 2025."},{f:"🇺🇸",a:"VS",d:"Groeiende CT-samenwerking."}],economic:[{f:"🇫🇷",a:"Frankrijk",d:"Grootste investeerder ondanks vertrek."},{f:"🇨🇳",a:"China",d:"Metro Abidjan, snelwegen."}],political:[{f:"🇫🇷",a:"Frankrijk",d:"Economisch sterk ondanks militair vertrek."},{f:"🇨🇳",a:"China",d:"BRI-partner."}]},
"120":{name:"Kameroen",s:"Anglofone crisis en Boko Haram. Frankrijks veiligheidspartner.",defence:[{f:"🇫🇷",a:"Frankrijk",d:"Voornaamste militaire partner."},{f:"🇺🇸",a:"VS",d:"CT-hulp. Spanningen mensenrechten."}],economic:[{f:"🇨🇳",a:"China",d:"Kribi-haven, snelwegen. BRI."},{f:"🇫🇷",a:"Frankrijk",d:"Grootste handelspartner. CFA."}],political:[{f:"🇫🇷",a:"Frankrijk",d:"Nauwste bondgenoot. Steunt Biya."},{f:"🇷🇺",a:"Rusland",d:"Defensiesamenwerking-interesse."}]},
"768":{name:"Togo",s:"Rusland militair akkoord, Doema-geratificeerd (juli 2025).",defence:[{f:"🇫🇷",a:"Frankrijk",d:"Traditionele partner. CFA."},{f:"🇷🇺",a:"Rusland",d:"Akkoord geratificeerd (juli 2025)."}],economic:[{f:"🇨🇳",a:"China",d:"Haveninfrastructuur. BRI."},{f:"🇫🇷",a:"Frankrijk",d:"Bolloré haven. CFA-franc."}],political:[{f:"🇷🇺",a:"Rusland",d:"Actieve toenadering."},{f:"🇫🇷",a:"Frankrijk",d:"Afnemende invloed."}]},
"324":{name:"Guinee",s:"Junta sinds 2021. Bauxiet (grootste reserves). China en Rusland domineren.",defence:[{f:"🇷🇺",a:"Rusland",d:"Wapenleverancier. Training."},{f:"🇹🇷",a:"Turkije",d:"Opkomend. Drone-interesse."}],economic:[{f:"🇨🇳",a:"China",d:"Bauxiet. Simandou ijzererts ($15 mrd). BRI."},{f:"🇷🇺",a:"Rusland",d:"Rusal = grootste bauxiet/alumina-operator."}],political:[{f:"🇨🇳",a:"China",d:"Grootste investeerder. Non-interventie."},{f:"🇺🇸",a:"VS",d:"Opgeschort na coup."}]},
"694":{name:"Sierra Leone",s:"Post-conflict democratie. China investeerder. VK sterke banden.",defence:[{f:"🇬🇧",a:"VK",d:"Training sinds interventie 2000."},{f:"🇨🇳",a:"China",d:"Uitrustingsdonaties."}],economic:[{f:"🇨🇳",a:"China",d:"Wegen, gebouwen. IJzererts."},{f:"🇬🇧",a:"VK",d:"Grootste donor."}],political:[{f:"🇬🇧",a:"VK",d:"Sterkste partner."},{f:"🇨🇳",a:"China",d:"Infrastructuurdiplomatie."}]},
"430":{name:"Liberia",s:"Door VS gesticht. Sterke historische banden Washington.",defence:[{f:"🇺🇸",a:"VS",d:"Historische bondgenoot. Training."},{f:"🇨🇳",a:"China",d:"Groeiende hulp."}],economic:[{f:"🇨🇳",a:"China",d:"Infrastructuur, mijnbouw."},{f:"🇺🇸",a:"VS",d:"AGOA. Remittances."}],political:[{f:"🇺🇸",a:"VS",d:"Fundamentele relatie."},{f:"🇨🇳",a:"China",d:"Groeiende soft power."}]},
"270":{name:"Gambia",s:"Piepklein, omringd door Senegal. Turkije onverwachte partner.",defence:[{f:"🇹🇷",a:"Turkije",d:"Training. Patrouilleboten."},{f:"🇺🇸",a:"VS",d:"Kleinschalig."}],economic:[{f:"🇨🇳",a:"China",d:"Bruggen, gebouwen."},{f:"🇹🇷",a:"Turkije",d:"Hulp, bouw."}],political:[{f:"🇨🇳",a:"China",d:"Erkenning gewisseld van Taiwan (2016)."},{f:"🇹🇷",a:"Turkije",d:"Groeiende invloed."}]},
"624":{name:"Guinee-Bissau",s:"Instabiel. Cocaïne-doorvoer. Portugal culturele banden.",defence:[{f:"🇵🇹",a:"Portugal",d:"Training via CPLP."},{f:"🇷🇺",a:"Rusland",d:"Africa Corps-interesse."}],economic:[{f:"🇨🇳",a:"China",d:"Visserij. Infrastructuur."},{f:"🇪🇺",a:"EU",d:"Ontwikkelingshulp."}],political:[{f:"🇨🇳",a:"China",d:"Infrastructuurdiplomatie."},{f:"🇵🇹",a:"Portugal",d:"Lusofone banden."}]},
"204":{name:"Benin",s:"Stabiele kustdemocratie. Sahel-overspill zorgen.",defence:[{f:"🇫🇷",a:"Frankrijk",d:"CT-training tegen jihadistische overspill."},{f:"🇺🇸",a:"VS",d:"Veiligheidshulp. Grensbewaking."}],economic:[{f:"🇨🇳",a:"China",d:"Wegen, haven Cotonou. BRI."},{f:"🇫🇷",a:"Frankrijk",d:"CFA. Bolloré haven."}],political:[{f:"🇫🇷",a:"Frankrijk",d:"Nauwe partner. Pro-westers."},{f:"🇨🇳",a:"China",d:"Groeiend via infrastructuur."}]},
"266":{name:"Gabon",s:"Olierijk. Post-coup (aug 2023). Franse basis herzien.",defence:[{f:"🇫🇷",a:"Frankrijk",d:"~370 troepen Camp de Gaulle — herzien na coup."},{f:"🇺🇸",a:"VS",d:"Beperkt."}],economic:[{f:"🇨🇳",a:"China",d:"Olie (Sinopec/Addax). Hout, mangaan."},{f:"🇫🇷",a:"Frankrijk",d:"Total, Perenco olie."}],political:[{f:"🇫🇷",a:"Frankrijk",d:"Onzeker na coup."},{f:"🇨🇳",a:"China",d:"Non-interventie gewaardeerd door junta."}]},
"226":{name:"Eq. Guinea",s:"Africa Corps ~200 troepen (nov 2024). Obiang-regime (46 jr).",defence:[{f:"🇷🇺",a:"Rusland (Africa Corps)",d:"~200 instructeurs. VP Obiang beschermd."},{f:"🇺🇸",a:"VS",d:"Oliebelangen."}],economic:[{f:"🇺🇸",a:"VS",d:"ExxonMobil, Marathon, Hess."},{f:"🇨🇳",a:"China",d:"Groeiende olie. Leningen."}],political:[{f:"🇷🇺",a:"Rusland",d:"Regimebeveiliger."},{f:"🇺🇸",a:"VS",d:"Olie vs mensenrechten."}]},
"178":{name:"Rep. Congo",s:"Olieafhankelijk onder Sassou-Nguesso (sinds 1997).",defence:[{f:"🇫🇷",a:"Frankrijk",d:"Traditionele partner."},{f:"🇷🇺",a:"Rusland",d:"Historisch. Kleine wapens."}],economic:[{f:"🇨🇳",a:"China",d:"Olie-importeur en schuldeiser. BRI."},{f:"🇫🇷",a:"Frankrijk",d:"TotalEnergies. CFA."}],political:[{f:"🇫🇷",a:"Frankrijk",d:"Steunt Sassou-Nguesso."},{f:"🇨🇳",a:"China",d:"Hefboom via schuld en olie."}]},
"132":{name:"Kaapverdië",s:"Stabiele eilanddemocratie. Strategisch Atlantisch.",defence:[{f:"🇺🇸",a:"VS",d:"Anti-drugssmokkel. Kustwacht."},{f:"🇵🇹",a:"Portugal",d:"CPLP-training."}],economic:[{f:"🇪🇺",a:"EU/Portugal",d:"Speciaal partnerschap. Toerisme."},{f:"🇨🇳",a:"China",d:"Gebouwen, stadion."}],political:[{f:"🇪🇺",a:"EU",d:"Dichtstbij EU-model."},{f:"🇺🇸",a:"VS",d:"MCC-compact."}]},
"678":{name:"São Tomé",s:"Piepklein. Taiwan → China gewisseld (2016).",defence:[{f:"🇵🇹",a:"Portugal",d:"CPLP-kustwacht."},{f:"🇺🇸",a:"VS",d:"Minimaal."}],economic:[{f:"🇨🇳",a:"China",d:"Infrastructuur na erkenningswissel."},{f:"🇳🇬",a:"Nigeria",d:"Gezamenlijke offshore oliezon."}],political:[{f:"🇨🇳",a:"China",d:"Erkenning van Taiwan gewisseld (2016)."},{f:"🇵🇹",a:"Portugal",d:"CPLP. Taalkundige banden."}]},
"729":{name:"Soedan",s:"Burgeroorlog apr 2023. Proxyoorlog: VAE→RSF, Egypte/Iran/Turkije→SAF. 150.000+ doden.",defence:[{f:"🇦🇪",a:"VAE → RSF",d:"Voornaamste steun. Wapens via Tsjaad/Libië."},{f:"🇪🇬",a:"Egypte → SAF",d:"K-8 jets, munitie, training."},{f:"🇮🇷",a:"Iran → SAF",d:"Mohajer-6/Ababil drones."}],economic:[{f:"🇦🇪",a:"VAE",d:"Goudhandel. RSF controleert Darfur."},{f:"🇷🇺",a:"Rusland",d:"Goud via Wagner. Marinebasis opgeschort."}],political:[{f:"🇺🇸",a:"VS/Saoedi-Arabië",d:"'Quad'-vredeskader."},{f:"🇦🇪",a:"VAE",d:"Ontkent steun. SAF weigert bemiddeling."}]},
"706":{name:"Somalië",s:"Turkije vs VAE: havens en militaire invloed. Al-Shabaab.",defence:[{f:"🇹🇷",a:"Turkije",d:"TURKSOM-basis. 16.000+ getraind."},{f:"🇺🇸",a:"VS",d:"~500 troepen. Droneaanvallen."}],economic:[{f:"🇹🇷",a:"Turkije",d:"Haven/luchthaven Mogadishu."},{f:"🇦🇪",a:"VAE",d:"DP World Berbera ($440 mln)."}],political:[{f:"🇹🇷",a:"Turkije",d:"Sterkste partner sinds 2011."},{f:"🇦🇪",a:"VAE",d:"Via Puntland/Somaliland."}]},
"231":{name:"Ethiopië",s:"126 mln. GERD-dam existentieel voor Egypte. VAE-drones keerden Tigray.",defence:[{f:"🇦🇪",a:"VAE",d:"Bayraktar-drones — beslissend Tigray."},{f:"🇷🇺",a:"Rusland",d:"Su-30's, T-72's."}],economic:[{f:"🇨🇳",a:"China",d:"$4 mrd spoorlijn. AU-HQ."},{f:"🇦🇪",a:"VAE",d:"$3 mrd na Tigray."}],political:[{f:"🇺🇸",a:"VS",d:"Steunde vrede, sancties, nu opnieuw betrokken."},{f:"🇨🇳",a:"China",d:"AU-HQ. BRI-corridor."}]},
"262":{name:"Djibouti",s:"Dichtste basescluster ter wereld. VS, China, Frankrijk, Japan, Italië.",defence:[{f:"🇺🇸",a:"VS",d:"Camp Lemonnier. ~4.000 man."},{f:"🇨🇳",a:"China",d:"Eerste PLA-basis (2017). Kade voor vliegdekschepen."},{f:"🇫🇷",a:"Frankrijk",d:"~1.500 troepen. Sinds 1977."}],economic:[{f:"🇨🇳",a:"China",d:"$14,4 mrd infra. Helft schuld."},{f:"🇺🇸",a:"VS",d:"$63–70 mln huur. $1 mrd upgrade."}],political:[{f:"🇨🇳",a:"China",d:"Grootste schuldeiser. 70% bbp."},{f:"🇺🇸",a:"VS",d:"'Verslechterende positie.'"}]},
"232":{name:"Eritrea",s:"Geïsoleerd. Geen verkiezingen sinds 1993. VAE Assab-basis.",defence:[{f:"🇷🇺",a:"Rusland",d:"Wapens. Marinebezoeken Massawa."},{f:"🇦🇪",a:"VAE",d:"Assab marine/luchtbasis."}],economic:[{f:"🇨🇳",a:"China",d:"Mijnbouw ondanks isolatie."},{f:"🇦🇪",a:"VAE",d:"Assab-investering."}],political:[{f:"🇷🇺",a:"Rusland",d:"Anti-westerse solidariteit."},{f:"🇦🇪",a:"VAE",d:"Rode Zee-bondgenoot."}]},
"728":{name:"Zuid-Soedan",s:"Jongste land (2011). 90% inkomsten olie.",defence:[{f:"🇺🇸",a:"VS",d:"Grootste donor. UNMISS."},{f:"🇨🇳",a:"China",d:"UNMISS-troepen."}],economic:[{f:"🇨🇳",a:"China",d:"Dominante olie (CNPC)."},{f:"🇮🇳",a:"India",d:"ONGC Videsh petroleum."}],political:[{f:"🇺🇸",a:"VS",d:"Hielp onafhankelijkheid."},{f:"🇨🇳",a:"China",d:"Olie-voor-infrastructuur."}]},
"012":{name:"Algerije",s:"Grootste land, topwapenimporteur. ~70% Russisch. $25 mrd defensie.",defence:[{f:"🇷🇺",a:"Rusland",d:"~70%. $7 mrd deal. Su-57. 3e koper."},{f:"🇨🇳",a:"China",d:"YLC-2v radar. Defensie-industrie."},{f:"🇺🇸",a:"VS",d:"Eerste MoU (jan 2025)."}],economic:[{f:"🇨🇳",a:"China",d:"$36 mrd BRI. Sinopec."},{f:"🇫🇷",a:"Frankrijk/EU",d:"Investeerder. ~30% Frans gas."}],political:[{f:"🇷🇺",a:"Rusland",d:"Versterkt Partnerschap."},{f:"🇫🇷",a:"Frankrijk",d:"Crisis. W. Sahara. Uitwijzingen."}]},
"434":{name:"Libië",s:"Gesplitst: Tripoli (Turkije) vs Haftar (Rusland/VAE/Egypte).",defence:[{f:"🇷🇺",a:"Rusland → LNA",d:"2.000–2.500 op ~10 locaties."},{f:"🇹🇷",a:"Turkije → GNU",d:"Tot 2026. Drones, strijders."}],economic:[{f:"🇮🇹",a:"Italië",d:"ENI. Energiezekerheid."},{f:"🇹🇷",a:"Turkije",d:"Deals aan militaire aanwezigheid."}],political:[{f:"🇷🇺",a:"Rusland",d:"Haftar bij Poetin (mei 2025)."},{f:"🇺🇸",a:"VS",d:"Herinschakeling beide kanten."}]},
"818":{name:"Egypte",s:"$1,3 mrd/jr VS-hulp. Suezkanaal. Balanceert VS/Rusland/China/Golf.",defence:[{f:"🇺🇸",a:"VS",d:"$1,3 mrd/jr. F-16's, Abrams, Apaches."},{f:"🇷🇺",a:"Rusland",d:"Su-35 ($2 mrd). Ka-52's."},{f:"🇫🇷",a:"Frankrijk",d:"Rafales ($7 mrd+). Mistrals."}],economic:[{f:"🇦🇪",a:"VAE/Golf",d:"$35 mrd Ras el-Hekma (2024)."},{f:"🇨🇳",a:"China",d:"Nieuwe Hoofdstad. BRI Suez."}],political:[{f:"🇺🇸",a:"VS",d:"Suez + Israël-vrede anker."},{f:"🇸🇦",a:"Golfstaten",d:"$20 mrd+ sinds 2013."}]},
"504":{name:"Marokko",s:"Abraham Akkoorden. VS/Israël-as. F-35 onderhandelingen.",defence:[{f:"🇺🇸",a:"VS",d:"F-16 ($6,5 mrd). F-35 gesprekken. African Lion."},{f:"🇮🇱",a:"Israël",d:"Abraham Akkoorden. Barak-8, Harop."}],economic:[{f:"🇫🇷",a:"Frankrijk",d:"Grootste investeerder. Tanger Med."},{f:"🇨🇳",a:"China",d:"BRI. EV-batterijhub."}],political:[{f:"🇺🇸",a:"VS",d:"W. Sahara erkend (2020)."},{f:"🇫🇷",a:"Frankrijk",d:"W. Sahara erkend (2024)."}]},
"788":{name:"Tunesië",s:"Bakermat Arabische Lente. Democratische terugval. EU-migratielijn.",defence:[{f:"🇺🇸",a:"VS",d:"$1,4 mrd+ veiligheidshulp."},{f:"🇫🇷",a:"Frankrijk",d:"Training. CT."}],economic:[{f:"🇪🇺",a:"EU",d:"Grootste partner. Migratiedeal ($127 mln)."},{f:"🇨🇳",a:"China",d:"BRI. Infrastructuur."}],political:[{f:"🇪🇺",a:"EU",d:"Migratie = hefboom."},{f:"🇺🇸",a:"VS",d:"Bezorgd autoritaire drift Saied."}]},
"732":{name:"W. Sahara",s:"Betwist. Marokko ~80%. VS/Frankrijk erkenden soevereiniteit.",defence:[{f:"🇲🇦",a:"Marokko",d:"~80% via zandwal."},{f:"🇩🇿",a:"Algerije (Polisario)",d:"Tindouf-kampen."}],economic:[{f:"🇲🇦",a:"Marokko",d:"Fosfaat, visserij, hernieuwbaar."},{f:"🇪🇺",a:"EU",d:"Handelsovereenkomsten — omstreden."}],political:[{f:"🇺🇸",a:"VS",d:"Soevereiniteit erkend (2020)."},{f:"🇩🇿",a:"Algerije",d:"Kernkwestie."}]},
"404":{name:"Kenia",s:"Grootste economie Oost-Afrika. VS Grote Niet-NAVO Bondgenoot.",defence:[{f:"🇺🇸",a:"VS",d:"Grote Niet-NAVO Bondgenoot (2024). Manda Bay."},{f:"🇬🇧",a:"VK",d:"BATUK ~2.000/jr."}],economic:[{f:"🇨🇳",a:"China",d:"$4,7 mrd SGR."},{f:"🇺🇸",a:"VS",d:"AGOA. Tech. Biden-bezoek (2024)."}],political:[{f:"🇺🇸",a:"VS",d:"Sterkste Oost-Afrikaanse bondgenoot."},{f:"🇨🇳",a:"China",d:"BRI. Schuld-backlash."}]},
"834":{name:"Tanzania",s:"Opkomend. China's grootste BRI-partner Oost-Afrika.",defence:[{f:"🇺🇸",a:"VS",d:"Training en oefeningen."},{f:"🇨🇳",a:"China",d:"Militaire hulp. Marine."}],economic:[{f:"🇨🇳",a:"China",d:"$10 mrd+ Bagamoyo. SGR-uitbreiding."},{f:"🇫🇷",a:"TotalEnergies",d:"EACOP-terminal ($10 mrd)."}],political:[{f:"🇨🇳",a:"China",d:"Sterkste BRI-partner regio."},{f:"🇺🇸",a:"VS",d:"Groeiend."}]},
"024":{name:"Angola",s:"Middelgrote mogendheid. Lobito Corridor = VS-China slagveld.",defence:[{f:"🇨🇳",a:"China",d:"$36 mln CATIC (2025). 85% financiering."},{f:"🇦🇪",a:"VAE",d:"EDGE marine. MBZ-bezoek (aug 2025)."}],economic:[{f:"🇨🇳",a:"China",d:"$24 mrd handel, $27 mrd+ investeringen."},{f:"🇺🇸",a:"VS",d:"Lobito Corridor — G7-vlaggenschip."},{f:"🇦🇪",a:"VAE",d:"$379 mln haven."}],political:[{f:"🇨🇳",a:"China",d:"Uitgebreid Strategisch Partnerschap (2024)."},{f:"🇺🇸",a:"VS",d:"Lobito = tegenwicht BRI."}]},
"508":{name:"Mozambique",s:"$60 mrd+ LNG. Rwanda 4.000–5.000 troepen.",defence:[{f:"🇷🇼",a:"Rwanda",d:"SOFA (aug 2025). Partijbedrijven in toeleveringsketen."},{f:"🇪🇺",a:"EU",d:"€20 mln Rwandese troepen."}],economic:[{f:"🇫🇷",a:"TotalEnergies",d:"$20,5 mrd LNG. Gas 2029."},{f:"🇺🇸",a:"ExxonMobil",d:"$30 mrd Rovuma."}],political:[{f:"🇷🇼",a:"Rwanda",d:"Militair → commercieel."},{f:"🇺🇸",a:"VS",d:"LNG-steun."}]},
"710":{name:"Zuid-Afrika",s:"BRICS. Non-gebonden. Oefeningen Rusland/China.",defence:[{f:"🇷🇺",a:"Rusland",d:"Marineoefeningen. ANC-banden."},{f:"🇨🇳",a:"China",d:"Oefeningen (2023)."}],economic:[{f:"🇨🇳",a:"China",d:"Grootste partner ($40 mrd+)."},{f:"🇺🇸",a:"VS",d:"2e partner. AGOA."}],political:[{f:"🇨🇳",a:"China/BRICS",d:"BRICS-gastheer."},{f:"🇺🇸",a:"VS",d:"Gespannen. Handel sterk."}]},
"716":{name:"Zimbabwe",s:"Grootste lithium Afrika. China domineert.",defence:[{f:"🇨🇳",a:"China",d:"Wapenleverancier."},{f:"🇷🇺",a:"Rusland",d:"Historisch. Anti-sanctie solidariteit."}],economic:[{f:"🇨🇳",a:"China",d:"Lithium (Sinomine, Huayou, Chengxin)."},{f:"🇦🇪",a:"VAE",d:"28 bedrijven. Mijnbouw, hernieuwbaar."}],political:[{f:"🇨🇳",a:"China",d:"'Kijk Oost'. Non-interventie."},{f:"🇺🇸",a:"VS",d:"Landsancties opgeheven (2024)."}]},
"894":{name:"Zambia",s:"Koperhart. Lobito-eindpunt. Wanbetaling 2020.",defence:[{f:"🇺🇸",a:"VS",d:"Democratische partner."},{f:"🇨🇳",a:"China",d:"Economische hefboom."}],economic:[{f:"🇨🇳",a:"China",d:"~$6 mrd schuld. Kopermijnen."},{f:"🇺🇸",a:"VS",d:"Lobito-eindpunt."}],political:[{f:"🇺🇸",a:"VS",d:"Hichilema = geprefereerd."},{f:"🇨🇳",a:"China",d:"Schuldspanning."}]},
"516":{name:"Namibië",s:"2e uraniumproducent. Venus-olievondst. Mineralenrace.",defence:[{f:"🇨🇳",a:"China",d:"SWAPO-banden."},{f:"🇷🇺",a:"Rusland",d:"Rosatom nucleair."}],economic:[{f:"🇨🇳",a:"China",d:"CGN Husab uranium."},{f:"🇫🇷",a:"TotalEnergies",d:"Venus diepwater (3 mrd+ vaten)."},{f:"🇪🇺",a:"EU",d:"Kritieke mineralen. Groene waterstof."}],political:[{f:"🇨🇳",a:"China",d:"SWAPO. Uranium."},{f:"🇺🇸",a:"VS/EU",d:"Mineralenconcurrentie."}]},
"072":{name:"Botswana",s:"Langste democratie. Diamanten. De Beers heronderhandeld.",defence:[{f:"🇺🇸",a:"VS",d:"AFRICOM. Stabiel."},{f:"🇬🇧",a:"VK",d:"Commonwealth."}],economic:[{f:"🇬🇧",a:"De Beers",d:"2023: 30% ruwe stenen."},{f:"🇮🇳",a:"India",d:"Surat-diamantindustrie."}],political:[{f:"🇺🇸",a:"VS",d:"Modeldemocratie."},{f:"🇨🇳",a:"China",d:"Groeiend."}]},
"454":{name:"Malawi",s:"Hulpafhankelijk. VS/VK primair.",defence:[{f:"🇺🇸",a:"VS",d:"Training."},{f:"🇬🇧",a:"VK",d:"Commonwealth."}],economic:[{f:"🇨🇳",a:"China",d:"Wegen, gebouwen."},{f:"🇺🇸",a:"VS/VK",d:"Grootste donoren."}],political:[{f:"🇺🇸",a:"VS",d:"Democratiesteun."},{f:"🇨🇳",a:"China",d:"Infrastructuurdiplomatie."}]},
"748":{name:"Eswatini",s:"Laatste monarchie. Taiwan-erkenning.",defence:[{f:"🇹🇼",a:"Taiwan",d:"Hulp, beurzen."},{f:"🇺🇸",a:"VS",d:"Beperkt."}],economic:[{f:"🇹🇼",a:"Taiwan",d:"Kernpartner."},{f:"🇿🇦",a:"Zuid-Afrika",d:"Dominant. Rand-koppeling."}],political:[{f:"🇹🇼",a:"Taiwan",d:"Enige Afrikaanse bondgenoot."},{f:"🇨🇳",a:"China",d:"Druk om te wisselen."}]},
"426":{name:"Lesotho",s:"Omringd door ZA. Water en textiel.",defence:[{f:"🇿🇦",a:"Zuid-Afrika",d:"De facto garant."},{f:"🇺🇸",a:"VS",d:"MCC-compact."}],economic:[{f:"🇿🇦",a:"Zuid-Afrika",d:"Water. AGOA-textiel."},{f:"🇨🇳",a:"China",d:"Infrastructuur."}],political:[{f:"🇿🇦",a:"Zuid-Afrika",d:"Patroonstaat."},{f:"🇺🇸",a:"VS",d:"MCC bestuur."}]},
"450":{name:"Madagaskar",s:"Biodiversiteit. Vanille #1 (80%).",defence:[{f:"🇫🇷",a:"Frankrijk",d:"Training. Gendarmerie."},{f:"🇮🇳",a:"India",d:"Marine. Indische Oceaan."}],economic:[{f:"🇫🇷",a:"Frankrijk",d:"Grootste investeerder. Vanille."},{f:"🇨🇳",a:"China",d:"Wegen. Mijnbouw groeit."}],political:[{f:"🇫🇷",a:"Frankrijk",d:"Sterkste partner."},{f:"🇨🇳",a:"China",d:"BRI. Soft power."}]},
"480":{name:"Mauritius",s:"Hoog inkomen. India's nauwste bondgenoot.",defence:[{f:"🇮🇳",a:"India",d:"Assumption Island. Patrouilleboten."},{f:"🇺🇸",a:"VS",d:"Diego Garcia — Chagos."}],economic:[{f:"🇮🇳",a:"India",d:"Grootste BDI. Diaspora."},{f:"🇨🇳",a:"China",d:"Vrijhandel (2021). BRI."}],political:[{f:"🇮🇳",a:"India",d:"Agaléga = Indische Oceaan."},{f:"🇬🇧",a:"VK",d:"Chagos-deal (2024)."}]},
"174":{name:"Comoren",s:"Vulkanisch. Frankrijk via Mayotte.",defence:[{f:"🇫🇷",a:"Frankrijk",d:"Gendarmerie. Mayotte = Frans."},{f:"🇸🇦",a:"Saoedi-Arabië",d:"Militaire hulp."}],economic:[{f:"🇫🇷",a:"Frankrijk",d:"Hulp. Vanille/kruidnagel."},{f:"🇸🇦",a:"Saoedi/Golf",d:"Ontwikkeling. Moskeeën."}],political:[{f:"🇫🇷",a:"Frankrijk",d:"Mayotte-spanning."},{f:"🇸🇦",a:"Saoedi/Golf",d:"Islamitische solidariteit."}]},
"690":{name:"Seychellen",s:"Kleinste staat (100K). India marinefaciliteit.",defence:[{f:"🇮🇳",a:"India",d:"Assumption Island. Patrouilleboten."},{f:"🇺🇸",a:"VS",d:"Drone-surveillance."}],economic:[{f:"🇦🇪",a:"VAE",d:"Toerisme. Haven."},{f:"🇨🇳",a:"China",d:"Handel. BRI."}],political:[{f:"🇮🇳",a:"India",d:"Nauwste partner."},{f:"🇨🇳",a:"China",d:"Concurreert Indische Oceaan."}]},
"686":{name:"Senegal",s:"Soevereiniteit-president Faye (2024). Frankrijk vertrekt. Eerste olie.",defence:[{f:"🇫🇷",a:"Frankrijk (vertrekkend)",d:"350 troepen weg."},{f:"🇹🇷",a:"Turkije",d:"Groeiend. Bayraktar."}],economic:[{f:"🇦🇺",a:"Woodside",d:"Sangomar — juni 2024. ~100K bpd."},{f:"🇬🇧",a:"BP",d:"Grand Tortue LNG."}],political:[{f:"🇫🇷",a:"Frankrijk",d:"Reset. Faye won op soevereiniteit."},{f:"🇷🇺",a:"Rusland",d:"Openheid. Nog geen deal."}]}
};

const HD=new Set(Object.keys(DEFAULT_DATA));

// ─── SUPABASE HELPERS ───
async function loadAllCountries(){
  const{data,error}=await supabase.from("countries").select("*");
  if(error)throw error;
  if(!data||data.length===0)return null;
  const obj={};
  data.forEach(row=>{obj[row.id]=row.data});
  return obj;
}

async function saveCountry(id,countryData){
  const{error}=await supabase.from("countries").upsert({id,data:countryData});
  if(error)throw error;
}

async function seedDatabase(allData){
  const rows=Object.entries(allData).map(([id,data])=>({id,data}));
  const{error}=await supabase.from("countries").upsert(rows);
  if(error)throw error;
}

// ─── ADMIN PANEL ───
function AdminPanel({data,onUpdate}){
  const[search,setSearch]=useState("");
  const[clFilt,setClFilt]=useState("Alle");
  const[selId,setSelId]=useState(null);
  const[editData,setEditData]=useState(null);
  const[saved,setSaved]=useState(false);
  const[saving,setSaving]=useState(false);

  const ids=useMemo(()=>{
    let list=Object.keys(data).map(id=>({id,name:data[id].name,cl:CL[id]}));
    if(clFilt!=="Alle")list=list.filter(x=>x.cl===clFilt);
    if(search){const q=search.toLowerCase();list=list.filter(x=>x.name.toLowerCase().includes(q))}
    return list.sort((a,b)=>a.name.localeCompare(b.name));
  },[data,search,clFilt]);

  const startEdit=useCallback(id=>{setSelId(id);setEditData(JSON.parse(JSON.stringify(data[id])));setSaved(false)},[data]);
  const saveEdit=useCallback(async()=>{
    if(!selId||!editData)return;
    setSaving(true);
    await onUpdate(selId,editData);
    setSaving(false);setSaved(true);setTimeout(()=>setSaved(false),2000);
  },[selId,editData,onUpdate]);

  const upField=(field,val)=>setEditData(p=>({...p,[field]:val}));
  const upActor=(cat,idx,key,val)=>setEditData(p=>{const n={...p};n[cat]=[...n[cat]];n[cat][idx]={...n[cat][idx],[key]:val};return n});
  const addActor=cat=>setEditData(p=>{const n={...p};n[cat]=[...n[cat],{a:"",d:""}];return n});
  const rmActor=(cat,idx)=>setEditData(p=>{const n={...p};n[cat]=n[cat].filter((_,i)=>i!==idx);return n});

  return(
    <div style={{display:"flex",height:"100%",fontFamily:"'Inter',system-ui,sans-serif",fontSize:12}}>
      <div style={{width:240,minWidth:240,borderRight:"1px solid #e2e8f0",display:"flex",flexDirection:"column",background:"#f8fafc"}}>
        <div style={{padding:"10px 10px 6px"}}>
          <div style={{fontWeight:800,fontSize:14,marginBottom:6}}>Admin Editor</div>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Zoek land..." style={{width:"100%",padding:"5px 8px",borderRadius:6,border:"1px solid #e2e8f0",fontSize:11,boxSizing:"border-box"}}/>
          <div style={{display:"flex",flexWrap:"wrap",gap:2,marginTop:6}}>
            {["Alle",...CLUSTERS].map(cl=>(
              <button key={cl} onClick={()=>setClFilt(cl)} style={{padding:"2px 6px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:9,fontWeight:600,cursor:"pointer",background:clFilt===cl?(cl==="Alle"?"#1e293b":(P[cl]||{f:"#666"}).f):"#fff",color:clFilt===cl?"#fff":"#64748b"}}>{cl}</button>
            ))}
          </div>
        </div>
        <div style={{flex:1,overflow:"auto"}}>
          {ids.map(({id,name,cl})=>(
            <div key={id} onClick={()=>startEdit(id)} style={{padding:"6px 10px",cursor:"pointer",background:selId===id?"#e0e7ff":"transparent",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:6,height:6,borderRadius:2,background:(P[cl]||{f:"#999"}).f,flexShrink:0}}/>
              <span style={{fontSize:11,fontWeight:selId===id?700:500}}>{name}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{flex:1,overflow:"auto",padding:16,background:"#fff"}}>
        {editData?(
          <div style={{maxWidth:700}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <h2 style={{margin:0,fontSize:18,fontWeight:800}}>{editData.name}</h2>
              <button onClick={saveEdit} disabled={saving} style={{padding:"6px 16px",borderRadius:6,border:"none",background:saved?"#059669":saving?"#94a3b8":"#4F46E5",color:"#fff",fontWeight:700,fontSize:12,cursor:saving?"wait":"pointer"}}>{saving?"Opslaan...":saved?"✓ Opgeslagen":"Opslaan"}</button>
            </div>
            <label style={{fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase"}}>Samenvatting</label>
            <textarea value={editData.s} onChange={e=>upField("s",e.target.value)} style={{width:"100%",padding:8,borderRadius:6,border:"1px solid #e2e8f0",fontSize:11,minHeight:50,marginBottom:12,boxSizing:"border-box",resize:"vertical"}}/>
            {TABS.map(cat=>(
              <div key={cat} style={{marginBottom:16}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                  <span style={{fontSize:11,fontWeight:700,color:TC[cat]}}>{TL[cat]}</span>
                  <button onClick={()=>addActor(cat)} style={{fontSize:10,padding:"2px 8px",borderRadius:4,border:"1px solid #e2e8f0",background:"#fff",cursor:"pointer"}}>+ Actor</button>
                </div>
                {(editData[cat]||[]).map((actor,i)=>(
                  <div key={i} style={{padding:8,borderRadius:6,border:"1px solid #f1f5f9",background:"#fafbfc",marginBottom:4}}>
                    <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:4}}>
                      <input value={actor.a} onChange={e=>upActor(cat,i,"a",e.target.value)} placeholder="Actor naam" style={{flex:1,padding:"3px 6px",borderRadius:4,border:"1px solid #e2e8f0",fontSize:11,fontWeight:600}}/>
                      <button onClick={()=>rmActor(cat,i)} style={{fontSize:10,color:"#DC2626",background:"none",border:"none",cursor:"pointer",padding:"2px 4px"}}>✕</button>
                    </div>
                    <textarea value={actor.d} onChange={e=>upActor(cat,i,"d",e.target.value)} placeholder="Beschrijving..." style={{width:"100%",padding:"4px 6px",borderRadius:4,border:"1px solid #e2e8f0",fontSize:10,minHeight:32,boxSizing:"border-box",resize:"vertical"}}/>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ):(
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",color:"#94a3b8"}}>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:32,marginBottom:6}}>✏️</div>
              <div style={{fontWeight:700,fontSize:14,color:"#1e293b"}}>Selecteer een land</div>
              <div style={{fontSize:11,marginTop:2}}>Kies links een land om te bewerken</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAP VIEW ───
function MapView({data,sel,setSel}){
  const svgRef=useRef(null);
  const[geo,setGeo]=useState(null);const[ld,setLd]=useState(true);const[er,setEr]=useState(null);
  const[hov,setHov]=useState(null);const[tip,setTip]=useState({x:0,y:0});const[tab,setTab]=useState("defence");
  const[query,setQuery]=useState("");const[showResults,setShowResults]=useState(false);
  const searchRef=useRef(null);
  const searchResults=useMemo(()=>{
    if(!query.trim())return[];
    const q=query.toLowerCase();
    return Object.entries(data).filter(([id,c])=>c.name.toLowerCase().includes(q)||(CL[id]||"").toLowerCase().includes(q)||c.s.toLowerCase().includes(q)).slice(0,8);
  },[query,data]);
  useEffect(()=>{const h=e=>{if(searchRef.current&&!searchRef.current.contains(e.target))setShowResults(false)};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h)},[]);
  const W=520,H=640;

  useEffect(()=>{fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then(r=>{if(!r.ok)throw new Error(r.status);return r.json()}).then(t=>{setGeo({type:"FeatureCollection",features:dt(t,"countries").features.filter(f=>AI.has(f.id))});setLd(false)}).catch(e=>{setEr(e.message);setLd(false)})},[]);
  const pr=useMemo(()=>geo?d3.geoMercator().fitExtent([[10,10],[W-10,H-10]],geo):null,[geo]);
  const pa=useMemo(()=>pr?d3.geoPath(pr):null,[pr]);

  useEffect(()=>{
    if(!geo||!pa||!svgRef.current)return;const sv=d3.select(svgRef.current);sv.selectAll("*").remove();
    const df=sv.append("defs");const gl=df.append("filter").attr("id","gl").attr("x","-50%").attr("y","-50%").attr("width","200%").attr("height","200%");
    gl.append("feGaussianBlur").attr("in","SourceGraphic").attr("stdDeviation",2.5).attr("result","b");
    const m=gl.append("feMerge");m.append("feMergeNode").attr("in","b");m.append("feMergeNode").attr("in","SourceGraphic");
    sv.append("path").datum(d3.geoGraticule().step([10,10])()).attr("d",pa).attr("fill","none").attr("stroke","#e5e7eb").attr("stroke-width",.5);
    sv.selectAll("path.c").data(geo.features).join("path").attr("class","c").attr("d",pa)
      .attr("fill",d=>(P[CL[d.id]]||{f:"#d1d5db"}).f)
      .attr("stroke",d=>HD.has(d.id)?(sel===d.id?"#1e293b":"rgba(0,0,0,0.4)"):"#fff")
      .attr("stroke-width",d=>sel===d.id?2.5:(HD.has(d.id)?1.2:.5))
      .attr("cursor",d=>HD.has(d.id)?"pointer":"default")
      .attr("opacity",d=>{if(sel&&sel!==d.id)return HD.has(d.id)?.6:.25;return HD.has(d.id)?1:.5})
      .attr("filter",d=>sel===d.id?"url(#gl)":null)
      .on("mouseenter",function(ev,d){if(!NM[d.id])return;const c=P[CL[d.id]];
        if(HD.has(d.id))d3.select(this).raise().transition().duration(80).attr("fill",c?c.h:c?.f).attr("stroke","#1e293b").attr("stroke-width",2.5).attr("opacity",1);
        else d3.select(this).raise().transition().duration(80).attr("fill",c?c.h:"#9ca3af").attr("opacity",.8);setHov(d.id)})
      .on("mousemove",function(ev){const r=svgRef.current.getBoundingClientRect();setTip({x:ev.clientX-r.left+12,y:ev.clientY-r.top-8})})
      .on("mouseleave",function(ev,d){const isSel=sel===d.id,c=P[CL[d.id]];
        d3.select(this).transition().duration(120).attr("fill",(c||{f:"#d1d5db"}).f)
          .attr("stroke",isSel?"#1e293b":(HD.has(d.id)?"rgba(0,0,0,0.4)":"#fff"))
          .attr("stroke-width",isSel?2.5:(HD.has(d.id)?1.2:.5))
          .attr("opacity",sel&&!isSel?(HD.has(d.id)?.6:.25):(HD.has(d.id)?1:.5)).attr("filter",null);setHov(null)})
      .on("click",function(ev,d){if(HD.has(d.id)){setSel(prev=>prev===d.id?null:d.id);setTab("defence")}});
    // Disputed border: erase original border, draw dashed line
    if(pr){
      const wsPoints=[[-13.17,27.67],[-12.0,27.67],[-10.0,27.67],[-8.67,27.67]];
      const proj=wsPoints.map(c=>pr(c)).filter(Boolean);
      if(proj.length>1){
        const line=d3.line().x(d=>d[0]).y(d=>d[1]);
        // Erase the existing solid border
        sv.append("path").attr("d",line(proj))
          .attr("fill","none").attr("stroke","#f8fafc").attr("stroke-width",4)
          .attr("opacity",1);
        // Draw dashed line on top
        sv.append("path").attr("d",line(proj))
          .attr("fill","none").attr("stroke","#888").attr("stroke-width",1.5)
          .attr("stroke-dasharray","5,4").attr("opacity",.8);
      }
    }
  },[geo,pa,sel]);

  const cd=sel?data[sel]:null;

  if(ld)return(<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",background:"#fff"}}><div style={{textAlign:"center"}}><div style={{width:34,height:34,border:"3px solid #e5e7eb",borderTop:"3px solid #4F46E5",borderRadius:"50%",animation:"sp .8s linear infinite",margin:"0 auto 10px"}}/><div style={{fontSize:14,fontWeight:600}}>Laden</div><style>{`@keyframes sp{to{transform:rotate(360deg)}}`}</style></div></div>);
  if(er)return(<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",color:"#DC2626"}}>⚠️ {er}</div>);

  return(
    <div style={{display:"flex",height:"100%",fontFamily:"'Inter',system-ui,sans-serif",color:"#1e293b",overflow:"hidden"}}>
      <div style={{width:W,minWidth:W,position:"relative",background:"#f8fafc"}}>
        <svg ref={svgRef} width={W} height={H} style={{background:"#f8fafc"}}/>
        {hov&&NM[hov]&&(<div style={{position:"absolute",left:Math.min(tip.x,W-160),top:tip.y,pointerEvents:"none",background:"rgba(255,255,255,.96)",border:"1px solid #e2e8f0",borderRadius:7,padding:"4px 9px",boxShadow:"0 4px 12px rgba(0,0,0,.1)",zIndex:100,whiteSpace:"nowrap"}}>
          <div style={{fontWeight:700,fontSize:11}}>{NM[hov]}</div>
          <div style={{fontSize:8.5,color:HD.has(hov)?"#4F46E5":"#94a3b8",marginTop:1}}>{HD.has(hov)?`${CL[hov]} · Klik`:CL[hov]||""}</div>
        </div>)}
        <div style={{position:"absolute",bottom:8,left:8,background:"rgba(255,255,255,.92)",border:"1px solid #e2e8f0",borderRadius:8,padding:"8px 12px"}}>
          <div style={{fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:.6,marginBottom:4}}>Clusters</div>
          {Object.entries(P).map(([n,c])=>(<div key={n} style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}><div style={{width:10,height:10,borderRadius:3,background:c.f}}/><span style={{fontSize:11,color:"#4a5568"}}>{n}</span></div>))}
        </div>
        <div style={{position:"absolute",top:8,left:8}}>
          <h1 style={{margin:0,fontSize:15,fontWeight:800}}>Afrika</h1>
          <p style={{margin:"1px 0",fontSize:8.5,color:"#94a3b8"}}>Buitenlandse Invloed · 54 landen</p>
        </div>
        <div ref={searchRef} style={{position:"absolute",top:8,right:8,width:220}}>
          <input value={query} onChange={e=>{setQuery(e.target.value);setShowResults(true)}} onFocus={()=>setShowResults(true)} placeholder="Zoek land..." style={{width:"100%",padding:"8px 12px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:13,background:"rgba(255,255,255,.95)",boxSizing:"border-box",outline:"none",boxShadow:"0 2px 8px rgba(0,0,0,.08)"}}/>
          {showResults&&searchResults.length>0&&(
            <div style={{position:"absolute",top:30,left:0,right:0,background:"#fff",border:"1px solid #e2e8f0",borderRadius:8,boxShadow:"0 4px 16px rgba(0,0,0,.12)",overflow:"hidden",zIndex:200}}>
              {searchResults.map(([id,c])=>(
                <div key={id} onClick={()=>{setSel(id);setQuery("");setShowResults(false);setTab("defence")}} style={{padding:"6px 10px",cursor:"pointer",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"center",gap:6}} onMouseEnter={e=>e.currentTarget.style.background="#f1f5f9"} onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                  <div style={{width:6,height:6,borderRadius:2,background:(P[CL[id]]||{f:"#999"}).f,flexShrink:0}}/>
                  <div>
                    <div style={{fontSize:11,fontWeight:600}}>{c.name}</div>
                    <div style={{fontSize:8.5,color:"#94a3b8"}}>{CL[id]}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div style={{flex:1,overflow:"hidden",background:"#fff",borderLeft:"1px solid #e2e8f0",display:"flex",flexDirection:"column"}}>
        {cd?(<>
          <div style={{padding:"16px 18px 10px",borderBottom:"1px solid #e2e8f0",flexShrink:0}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"start"}}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                  <div style={{width:9,height:9,borderRadius:3,background:(P[CL[sel]]||{}).f}}/>
                  <span style={{fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase"}}>{CL[sel]}</span>
                </div>
                <h2 style={{margin:0,fontSize:22,fontWeight:800}}>{cd.name}</h2>
              </div>
              <button onClick={()=>setSel(null)} style={{background:"#f1f5f9",border:"1px solid #e2e8f0",color:"#94a3b8",borderRadius:5,width:26,height:26,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
            </div>
            <p style={{margin:"6px 0 0",fontSize:13,color:"#64748b",lineHeight:1.55}}>{cd.s}</p>
          </div>
          <div style={{display:"flex",gap:3,padding:"8px 18px 0",flexShrink:0}}>
            {TABS.map(t=>(<button key={t} onClick={()=>setTab(t)} style={{padding:"5px 12px",borderRadius:6,border:"none",cursor:"pointer",fontSize:13,fontWeight:600,background:tab===t?TC[t]+"15":"transparent",color:tab===t?TC[t]:"#94a3b8"}}>{TL[t]}</button>))}
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"8px 18px 18px"}}>
            {(cd[tab]||[]).map((x,i)=>(<div key={i} style={{padding:"10px 12px",borderRadius:8,marginBottom:6,background:"#f8fafc",border:"1px solid #f1f5f9"}}>
              <div style={{marginBottom:3}}><span style={{fontSize:14,fontWeight:700}}>{x.a}</span></div>
              <p style={{margin:0,fontSize:13,color:"#64748b",lineHeight:1.6}}>{x.d}</p>
            </div>))}
          </div>
        </>):(
          <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
            <div style={{textAlign:"center",maxWidth:260}}>
              <div style={{fontSize:34,marginBottom:6}}>🌍</div>
              <h3 style={{margin:0,fontSize:14,fontWeight:700}}>Buitenlandse Invloed Verkenner</h3>
              <p style={{color:"#94a3b8",fontSize:10.5,lineHeight:1.5,marginTop:3}}>Klik op een land om te verkennen.</p>
              <div style={{marginTop:8,display:"flex",flexWrap:"wrap",gap:2,justifyContent:"center"}}>
                {Object.entries(P).map(([n,c])=>(<span key={n} style={{padding:"2px 7px",borderRadius:8,background:c.f+"15",color:c.f,fontSize:9,fontWeight:600}}>{n}</span>))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN APP ───
export default function App(){
  const[mode,setMode]=useState("map");
  const[data,setData]=useState(DEFAULT_DATA);
  const[sel,setSel]=useState(null);
  const[loading,setLoading]=useState(true);
  const[dbStatus,setDbStatus]=useState("");

  // Load from Supabase on mount
  useEffect(()=>{
    (async()=>{
      try{
        const saved=await loadAllCountries();
        if(saved&&Object.keys(saved).length>0){
          setData(saved);
          setDbStatus("✓ Data geladen uit database");
        }else{
          // First time: seed the database with default data
          await seedDatabase(DEFAULT_DATA);
          setDbStatus("✓ Database gevuld met standaarddata");
        }
      }catch(e){
        console.error("Supabase error:",e);
        setDbStatus("⚠️ Database niet bereikbaar — lokale data gebruikt");
      }
      setLoading(false);
    })();
  },[]);

  // Save handler
  const handleUpdate=useCallback(async(id,countryData)=>{
    setData(prev=>({...prev,[id]:countryData}));
    try{
      await saveCountry(id,countryData);
    }catch(e){
      console.error("Opslaan mislukt:",e);
    }
  },[]);

  if(loading)return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",fontFamily:"system-ui",flexDirection:"column",gap:8}}>
      <div style={{width:34,height:34,border:"3px solid #e5e7eb",borderTop:"3px solid #4F46E5",borderRadius:"50%",animation:"sp .8s linear infinite"}}/>
      <div style={{fontSize:14,fontWeight:600,color:"#64748b"}}>Database verbinden...</div>
      <style>{`@keyframes sp{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return(
    <div style={{height:"100vh",display:"flex",flexDirection:"column",fontFamily:"'Inter',system-ui,sans-serif"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 14px",borderBottom:"2px solid #e2e8f0",background:"#fff",flexShrink:0,zIndex:20}}>
        <div style={{display:"flex",gap:4}}>
          <button onClick={()=>setMode("map")} style={{padding:"5px 14px",borderRadius:6,border:"none",cursor:"pointer",fontSize:12,fontWeight:700,background:mode==="map"?"#1e293b":"#f1f5f9",color:mode==="map"?"#fff":"#64748b"}}>🌍 Kaart</button>
          <button onClick={()=>setMode("admin")} style={{padding:"5px 14px",borderRadius:6,border:"none",cursor:"pointer",fontSize:12,fontWeight:700,background:mode==="admin"?"#1e293b":"#f1f5f9",color:mode==="admin"?"#fff":"#64748b"}}>✏️ Admin</button>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:9,color:"#94a3b8"}}>{dbStatus}</span>
          <span style={{fontSize:9,color:"#94a3b8"}}>{Object.keys(data).length} landen</span>
        </div>
      </div>
      <div style={{flex:1,overflow:"hidden"}}>
        {mode==="map"?<MapView data={data} sel={sel} setSel={setSel}/>:<AdminPanel data={data} onUpdate={handleUpdate}/>}
      </div>
    </div>
  );
}

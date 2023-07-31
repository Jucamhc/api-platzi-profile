const express = require('express');
const app = express();
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const API = 'https://platzi.com/p/';
const https = require('https');
const cors = require('cors');

/*------------------- VARIABLES  ----------------------*/

let arrayCertificateRegex = /window\.data\s*=\s*\{([\s\S]*?)\};/;
let reg_username_careers = /"username":\s*"(\w+)",\s*([\s\S]*?)"careers":\s*\[(.*?)\]/s;
let reg_username_profile_url = /"username"\s*:\s*"([^"]+)".*?"profile_url"\s*:\s*"([^"]+)"/s;
let arrayCertificateRegexCurses = /courses:\s*\[\s*{.*?},?\s*\]/i;
let regexCurses = /\[[^\]]*\]/i;
let b = 0;
let firstResponse = { status: 900 };

const requestOptions = {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    },
    agent: new https.Agent({
        minVersion: 'TLSv1.3',
        maxVersion: 'TLSv1.3'
    })
};

app.use(express.json());
app.use(cors());

/*------------------- URL ---------------------*/

app.get('/', (req, res) => {
    res.send('Hola, esta API está diseñada con fines educativos y para compartir información en comunidad. Puedes acceder a la información a través de una consulta a la siguiente URL: ' + "URL/api_profile/TU_USUARIO");
});

app.get('/api_profile/:id', async (req, res) => {
    try {
        const user = req.params.id;

        if (b === 0) {
            b++;
            await firstFetch(user);
        } else {
            await secondFetch(user);
        }

        async function firstFetch(user) {
            firstResponse = await fetch(`${API}${user}/`, requestOptions);

            if (firstResponse.status !== 200) {
                return res.status(firstResponse.status).send("El usuario no existe en la base de datos.");
            }

            consult(firstResponse);
        }

        async function secondFetch(user) {
            const secondResponse = await fetch(`${API}${user}/`, {
                ...requestOptions,
                headers: {
                    Cookie: firstResponse.headers.get('set-cookie'),
                    'Cache-Control': 'no-cache',
                },
            });

            if (secondResponse.status !== 200) {
                await firstFetch(user);
            }

            consult(secondResponse);
        }

        async function consult(consult) {

            try {

                let respuesta = await consult.text();
                let matches = arrayCertificateRegex.exec(respuesta);

                if (matches?.length >= 1) {
                    let corchetes = matches[1]?.replace(/\'/g, "\"");
                    let matchesCursos = arrayCertificateRegexCurses?.exec(respuesta);
                    let jsonCourses = JSON.parse(regexCurses?.exec(matchesCursos));

                    let jsonData = JSON.stringify(`{${corchetes}}`);
                    jsonData = jsonData.replace(/(['"])?([a-zA-Z0-9]+)(['"])?:/g, '"$2": ');
                    jsonData = jsonData.replace(/\\n/g, "");
                    jsonData = jsonData.replace(/\\/g, '');
                    jsonData = jsonData.trim().substring(1, jsonData.length - 1);
                    jsonData = jsonData.trim().substring(1, jsonData.length - 1);
                    jsonData = jsonData.replace(/"https": \/\/+/g, '"https://');
                    jsonData = jsonData.replace('profile_"url":', '"profile_url":');
                    jsonData = jsonData.replace('"Twitter":', 'Twitter:');
                    jsonData = jsonData.replace('"Instagram":', 'Instagram:');
                    jsonData = jsonData.replace('"http":', '"http:');
                    jsonData = jsonData.replace('."1":', '.1:');

                    let jsonData_username_careers = reg_username_careers.exec(jsonData);

                    if (null != jsonData_username_careers) {
                        jsonData_username_careers = JSON.parse("{" + jsonData_username_careers[0] + "}");
                        jsonData_username_careers.courses = jsonCourses;
                        console.log(jsonData_username_careers.username);
                        res.send(jsonData_username_careers);
                    } else {
                        let jsonData_username_profile_url = reg_username_profile_url.exec(jsonData);
                        jsonData_username_profile_url = JSON.parse("{" + jsonData_username_profile_url[0] + "}");
                        jsonData_username_profile_url.courses = jsonCourses;
                        console.log(jsonData_username_profile_url.username);
                        res.status(200).send(JSON.stringify(jsonData_username_profile_url));
                        /*  res.setHeader('Content-Type', 'application/json');
                        res.header("Access-Control-Allow-Origin", "*");
                        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept"); */
                    }
                } else {
                    let matchesCursos = arrayCertificateRegexCurses.exec(respuesta);
                    let jsonCourses = regexCurses.exec(matchesCursos);
                    let curses = [];
                    if (jsonCourses != null) {
                        curses = JSON.parse(jsonCourses[0]);
                        res.status(200).send(JSON.stringify({ curses: curses }));
                    }
                    res.send("THE PROFILE IS PRIVATE OR YOUR PROFILE HAVE OTHER PARAMETER");
                }
            } catch (error) {
                console.log(error);
            }
        }

    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
})

const PORT = process.env.PORT || 80;
app.listen(PORT, () => console.log(`Escuchando en el puerto ${PORT}`));


/*             console.log(matches);
            if (null === matches || "null" === matches ||  matches[1] === null ||  matches[1] === "null") {
                res.send("The perfil is private");
            }
 
            if ('1' == matches || '1' === matches[1]) {
                res.send("THE PROFILE IS PRIVATE OR YOUR PROFILE HAVE OTHER PARAMETER");
            };
 */
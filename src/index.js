const express = require('express');
const app = express()
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const API = 'https://platzi.com/p/'
const https = require('https');

/*------------------- VARIABLES  ----------------------*/

let arrayCertificateRegex = /window\.data\s*=\s*\{([\s\S]*?)\};/;
let reg_username_careers = /"username":\s*"(\w+)",\s*([\s\S]*?)"careers":\s*\[(.*?)\]/s;
let reg_username_profile_url = /"username"\s*:\s*"([^"]+)".*?"profile_url"\s*:\s*"([^"]+)"/s;
let arrayCertificateRegexCurses = /courses:\s*\[\s*{.*?},?\s*\]/i;
let regexCurses = /\[[^\]]*\]/i;
let b = 0;
let firstResponse = { status: 900 }

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

/*------------------- URL ---------------------*/

app.get('/', (req, res) => {
    res.send('Hola, Esta Api esta diseña con fines educativos y compartir en comunidad el acceso a su informacion mediante una consulta, la respuesta se da en un array accede a esta url '
    + "mas URL/api_profile/TU_USUARIO")
});

app.get('/api_profile/:id', async (req, res) => {

    try {
        const user = req.params.id;

        if (b == 0) {
            b++
            firstFetch(user)
        } else {
            secondFetch(user)
        }

        async function firstFetch(user) {

            firstResponse = await fetch(`${API}${user}/`, requestOptions);

            if (firstResponse.status !== 200) {
                return res.status(firstResponse.status).send("user does not exist DB");
            }

            return consult(firstResponse)
        }

        async function secondFetch() {

            const secondResponse = await fetch(`${API}${user}/`, {
                ...requestOptions,
                headers: {
                    Cookie: firstResponse.headers.get('set-cookie'),
                    'Cache-Control': 'no-cache',
                },
            });

            if (secondResponse.status !== 200) {
                firstFetch(user)
            }

            return consult(secondResponse)
        }

        async function consult(consult) {

            let respuesta = await consult.text();
            let matches = arrayCertificateRegex.exec(respuesta);

            if (null == matches) {
                res.send("THE PERFIL IS PRIVATE");
            };
            let corchetes = matches[1].replace(/\'/g, "\"");

            let matchesCursos = arrayCertificateRegexCurses.exec(respuesta);
            let jsonCourses = JSON.parse(regexCurses.exec(matchesCursos));

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

            let jsonData_username_careers = reg_username_careers.exec(jsonData);

            if (null != jsonData_username_careers) {
                jsonData_username_careers = JSON.parse("{" + jsonData_username_careers[0] + "}");
                jsonData_username_careers.courses = jsonCourses;
                res.send(jsonData_username_careers);
            } else {
                let jsonData_username_profile_url = reg_username_profile_url.exec(jsonData);
                jsonData_username_profile_url = JSON.parse("{" + jsonData_username_profile_url[0] + "}");
                jsonData_username_profile_url.courses = jsonCourses
                res.send(jsonData_username_profile_url);
            }

        }

    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
})

const port = process.env.port || 80;
app.listen(port, () => console.log(`Escuchando en el puerto ${port}`));
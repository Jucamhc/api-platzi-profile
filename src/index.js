const express = require('express');
const app = express()
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const API = 'https://platzi.com/p/'

let arrayCertificateRegex = /window\.data\s*=\s*\{([\s\S]*?)\};/;
//let re = /"username":\s*"(\w+)",\s*([\s\S]*?)"profile_url":\s*"(.*?)"/gm
//let re = /"username":\s*"(\w+)",\s*([\s\S]*?)"careers":\s*\[((?:(?!\[\]|\]).)*)\]/gm;
let reg_username_careers = /"username":\s*"(\w+)",\s*([\s\S]*?)"careers":\s*\[(.*?)\]/s;
let reg_username_profile_url = /"username"\s*:\s*"([^"]+)".*?"profile_url"\s*:\s*"([^"]+)"/s;
//let re = /"username":\s*"(\w+)",\s*([\s\S]*?)"careers":\s*\[\]/s;
let arrayCertificateRegexCurses = /courses:\s*\[\s*{.*?},?\s*\]/i;
let regexCurses = /\[[^\]]*\]/i;
let b = 0;
let firstResponse;


/* let myHeaders = new Headers();
myHeaders.append("Cookie", "isLogged=true;"); */

let requestOptions = {
    method: 'GET',
    headers: {
        age: '1349',
        'alt-svc': 'h3=":443"; ma=86400, h3-29=":443"; ma=86400',
        'cache-control': 'no-store',
        'cf-cache-status': 'HIT',
        'cf-ray': '7c23d7310b1d0ddf-SCL',
        connection: 'close',
        'content-encoding': 'br',
        'content-language': 'es-co',
        'content-type': 'text/html; charset=utf-8',
        date: 'Thu, 04 May 2023 21:29:41 GMT',
        expires: 'Fri, 03 May 2024 21:29:41 GMT',
        'last-modified': 'Thu, 04 May 2023 14:44:36 GMT',
        server: 'cloudflare',
        'set-cookie': ['__cf_bm=72dDuBFeAJgr2Q.C4fc71UPZXDEydu3.DnTlnF2uvVU-1683236758-0-AfmPao5Kaq4g7cMuQ02nRoHrMatwyZxxkLZbyL5ebC1pXUAYqJNac8Y4CS+6WsLB2vBOnWutb4/Jcz21Xw5sgG4=; path=/; expires=Thu, 04-May-23 22:15:58 GMT; domain=.platzi.com; HttpOnly; Secure; SameSite=None, _cfuvid=fsqB_3xbeE1z0u7jTzI.lZKgRLnxNPJHRxWqbTNBo_Y-1683236758603-0-604800000; path=/; domain=.platzi.com; HttpOnly; Secure; SameSite=None'],
        'strict-transport-security': 'max-age=15552000; includeSubDomains; preload',
        'transfer-encoding': 'chunked',
        vary: 'Accept-Encoding, Accept-Language, Cookie, Origin',
        'x-content-type-options': 'nosniff',
        'x-frame-options': 'SAMEORIGIN',
        'x-xss-protection': '1; mode=block'
      },
    redirect: 'follow'
};

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Node JS Api')
});

app.get('/api/students/:id', async (req, res) => {

    try {
        const user = req.params.id;

        if (b == 0) {
            b++
            // Realizamos la primera petición
            firstResponse = await fetch(`${API}${user}/`, requestOptions);
            console.log(firstResponse.status);

            // Si la respuesta de la primera petición es diferente a 200, detenemos el proceso
            if (firstResponse.status !== 200) {
                return res.status(firstResponse.status).send("user does not exist DB");
            }

            return consult(firstResponse)
        }

        // Realizamos la segunda petición utilizando el valor de la primera respuesta
        const secondResponse = await fetch(`${API}${user}/`, {
            ...requestOptions,
            headers: {
                //...myHeaders,
                Cookie: firstResponse.headers.get('set-cookie'),
                'Cache-Control': 'no-cache',
            },
        });

        // Si la respuesta de la segunda petición es diferente a 200, detenemos el proceso
        if (secondResponse.status !== 200) {
            return res.status(secondResponse.status).send(secondResponse.statusText);
        }

        // Si todo fue exitoso, dentra en la funcion
        return consult(secondResponse)

        async function consult(consult) {
            try {

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

                //console.log(jsonData);

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
            } catch (error) {
                console.log(error);
            }


        }


    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
})

const port = process.env.port || 80;
app.listen(port, () => console.log(`Escuchando en el puerto ${port}`));
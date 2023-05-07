const express = require('express');
const app = express()
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const API = 'https://platzi.com/p/'
const nocache = require('nocache');

/*------------------- VARIABLES  ----------------------*/

let arrayCertificateRegex = /window\.data\s*=\s*\{([\s\S]*?)\};/;
let reg_username_careers = /"username":\s*"(\w+)",\s*([\s\S]*?)"careers":\s*\[(.*?)\]/s;
let reg_username_profile_url = /"username"\s*:\s*"([^"]+)".*?"profile_url"\s*:\s*"([^"]+)"/s;
let arrayCertificateRegexCurses = /courses:\s*\[\s*{.*?},?\s*\]/i;
let regexCurses = /\[[^\]]*\]/i;
let b = 0;
let firstResponse;

const requestOptions = {
    method: 'GET',
    headers: {
        server: 'cloudflare',
        'set-cookie': ['Cookie: isLogged=true;', 'Cache-Control: no-store']
    },
    redirect: 'follow'
};


app.use(express.json());
app.use(nocache());
/*------------------- URL ---------------------*/

app.get('/', (req, res) => {
    res.send('Node JS Api')
});


app.get('/api_profile/:id', async (req, res, next) => {

    try {
        const user = req.params.id;

/*         if (b == 0) {
            b++ */
            // Realizamos la primera petición
            firstResponse = await fetch(`${API}${user}/`, {
                headers: {
                    Cookie: '__cf_bm=2CFIq44Frj91S00QhJnj1NIAKfAKCvaokhtepIr159g-1683283362-0-AfXqeETJ8IJDxhJI1qYzRUcx79y4Hk8NSmDAqqB6hWoInthno6k/4pyI7kvMQIh6xpbwS5P1rlnQmUklyvsz7ss=; path=/; expires=Fri, domain=.platzi.com; HttpOnly; Secure; SameSite=None, _cfuvid=R5eaeNLJYmulPdOa2cuucV0PwwxeNNHDElXBlcUSRlc-1683283362497-0-604800000; path=/; domain=.platzi.com; HttpOnly; Secure; SameSite=None ',
                    'Cache-Control': 'no-cache',
                }
            },);
            console.log("firstResponse Status " + firstResponse.status);

            // Si la respuesta de la primera petición es diferente a 200, detenemos el proceso
            if (firstResponse.status !== 200) {
                return res.set('Cache-Control', 'no-store').status(firstResponse.status).send("user does not exist DB");
                next();
            }

            return consult(firstResponse)
/*         }

        // Realizamos la segunda petición utilizando el valor de la primera respuesta
        const secondResponse = await fetch(`${API}${user}/`, {
            headers: {
                //Cookie: firstResponse.headers.get('set-cookie'),
                Cookie: '__cf_bm=2CFIq44Frj91S00QhJnj1NIAKfAKCvaokhtepIr159g-1683283362-0-AfXqeETJ8IJDxhJI1qYzRUcx79y4Hk8NSmDAqqB6hWoInthno6k/4pyI7kvMQIh6xpbwS5P1rlnQmUklyvsz7ss=; path=/; expires=Fri, domain=.platzi.com; HttpOnly; Secure; SameSite=None, _cfuvid=R5eaeNLJYmulPdOa2cuucV0PwwxeNNHDElXBlcUSRlc-1683283362497-0-604800000; path=/; domain=.platzi.com; HttpOnly; Secure; SameSite=None ',
                'Cache-Control': 'no-cache',
            },

        });
        //console.log(firstResponse.headers.get('set-cookie'))
        console.log("secondResponse Status " + secondResponse.status);

        // Si la respuesta de la segunda petición es diferente a 200, detenemos el proceso
        if (secondResponse.status !== 200) {
            return res.set('Cache-Control', 'no-store').status(secondResponse.status).send(secondResponse.statusText);
        } */

        // Si todo fue exitoso, dentra en la funcion
        //return consult(secondResponse)

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
                    res.set('Cache-Control', 'no-store').send(jsonData_username_careers);
                } else {
                    let jsonData_username_profile_url = reg_username_profile_url.exec(jsonData);
                    jsonData_username_profile_url = JSON.parse("{" + jsonData_username_profile_url[0] + "}");
                    jsonData_username_profile_url.courses = jsonCourses
                    res.set('Cache-Control', 'no-store').send(jsonData_username_profile_url);
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
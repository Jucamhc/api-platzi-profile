const express = require('express');
const app = express()
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

app.use(express.json());

app.get('/api_profile/:id', async (req, res) => {

    var requestOptions = {
		method: 'GET',
		redirect: 'follow'
};

fetch("https://platzi.com/p/Jucamhc/", requestOptions)
		.then(response => response.text())
		.then(result =>  res.status(firstResponse.status).send(response))
		.catch(error => console.log('error', error));

})

const port = process.env.port || 80;
app.listen(port, () => console.log(`Escuchando en el puerto ${port}`));
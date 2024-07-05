const express = require('express');
const axios = require('axios');
const app = express();
const port = 9876;

// Configuration
const WINDOW_SIZE = 10;
const THIRD_PARTY_API = "http://20.244.56.144/test";
const AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzIwMTkwODIxLCJpYXQiOjE3MjAxOTA1MjEsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6IjI4MzllZWNmLWMxY2ItNGQwNi05ODNlLTQ1NGUxM2M2YzMxNiIsInN1YiI6InZpc2hudS5rYW1zQGdtYWlsLmNvbSJ9LCJjb21wYW55TmFtZSI6IlZrcHJvamVjdCIsImNsaWVudElEIjoiMjgzOWVlY2YtYzFjYi00ZDA2LTk4M2UtNDU0ZTEzYzZjMzE2IiwiY2xpZW50U2VjcmV0IjoiVklncGRLcUNwRWRZYUZ2dSIsIm93bmVyTmFtZSI6IlZpc2hudSBLYW1pc2V0dGkiLCJvd25lckVtYWlsIjoidmlzaG51LmthbXNAZ21haWwuY29tIiwicm9sbE5vIjoiMTYwMTIxNzM3MjAwIn0.5pD066dwjOMVilmGVcbtIKqthkpzUaOeWf6pDUxCQNM";

// Shared resources
let numbersWindow = [];
let numbersSet = new Set();

const fetchNumbers = async (numberType) => {
    let endpoint;
    switch (numberType) {
        case 'e':
            endpoint = 'even';
            break;
        case 'p':
            endpoint = 'primes';
            break;
        case 'f':
            endpoint = 'fibo';
            break;
        case 'r':
            endpoint = 'rand';
            break;
        default:
            throw new Error('Invalid number type');
    }

    try {
        const response = await axios.get(`${THIRD_PARTY_API}/${endpoint}`, {
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`
            },
            timeout: 500
        });
        if (response.status === 200) {
            return response.data.numbers || [];
        }
    } catch (error) {
        console.error('Error fetching numbers:', error.message);
        return [];
    }
    return [];
};


app.get('/numbers/:numberType', async (req, res) => {
    const numberType = req.params.numberType;
    if (!['e', 'p', 'f', 'r'].includes(numberType)) {
        return res.status(400).json({ error: 'Invalid number type' });
    }

    const prevState = [...numbersWindow];
    const newNumbers = await fetchNumbers(numberType);
    for (const number of newNumbers) {
        if (!numbersSet.has(number)) {
            numbersWindow.push(number);
            numbersSet.add(number);
            if (numbersWindow.length > WINDOW_SIZE) {
                const removed = numbersWindow.shift();
                numbersSet.delete(removed);
            }
        }
    }

    const currState = [...numbersWindow];
    const average = currState.length ? currState.reduce((sum, num) => sum + num, 0) / currState.length : 0.0;

    const response = {
        windowPrevState: prevState,
        windowCurrState: currState,
        numbers: newNumbers,
        avg: parseFloat(average.toFixed(2))
    };
    res.json(response);
});

app.listen(port, () => {
    console.log(`Average Calculator microservice running on port ${port}`);
});

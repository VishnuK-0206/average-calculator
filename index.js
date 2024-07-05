const express = require('express');
const axios = require('axios');
const app = express();
const port = 9876;

// Configuration
const WINDOW_SIZE = 10;
const THIRD_PARTY_API = "http://20.244.56.144/test";

// Shared resources
let numbersWindow = [];
let numbersSet = new Set();

const fetchNumbers = async (numberType) => {
    try {
        const response = await axios.get(`${THIRD_PARTY_API}/${numberType}`, { timeout: 500 });
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
    if (!['p', 'f', 'e', 'r'].includes(numberType)) {
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

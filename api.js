require("dotenv").config(); 
const fetch = require("node-fetch");
const API_KEY = process.env.API_KEY;

/*Autenticación*/

function logIn(data) {
    const { URLSearchParams } = require("url");
    const encodedParams = new URLSearchParams();

    encodedParams.set("provider", data.provider);
    encodedParams.set("username", data.name);
    encodedParams.set("password", data.password);

    const url = "https://banking.sandbox.prometeoapi.com/login/";
    const options = {
        method: "POST",
        headers: {
            accept: "application/json",
            "content-type": "application/x-www-form-urlencoded",
            "X-API-Key": API_KEY,
        },
        body: encodedParams,
    };
    return request(url, options);
}

function logOut(key) {
    const url = `https://banking.sandbox.prometeoapi.com/logout/?key=${key}`;
    const options = {
        method: "GET",
        headers: {
            accept: "application/json",
            "X-API-Key": API_KEY,
        },
    };
    return request(url, options);
}

/*Datos transaccionales*/

function accounts(key) {
    const url = `https://banking.sandbox.prometeoapi.com/account/?key=${key}`;
    const options = {
        method: "GET",
        headers: {
            accept: "application/json",
            "X-API-Key": API_KEY,
        },
    };
    return request(url, options);
}

function accountMovements(data, key) {
    const url = `https://banking.sandbox.prometeoapi.com/account/${data.account}/movement/?currency=${data.currency}&date_start=${data.start}&date_end=${data.end}&key=${key}`;
    const options = {
        method: "GET",
        headers: {
            accept: "application/json",
            "X-API-Key": API_KEY,
        },
    };
    return request(url, options);
}

function creditCards(key) {
    const url = `https://banking.sandbox.prometeoapi.com/credit-card/?key=${key}`;
    const options = {
        method: "GET",
        headers: {
            accept: "application/json",
            "X-API-Key": API_KEY,
        },
    };
    return request(url, options);
}

function creditCardMovements(data, key) {
    const url = `https://banking.sandbox.prometeoapi.com/credit-card/${data.card}/movements?currency=${data.currency}&date_start=${data.start}&date_end=${data.end}&key=${key}`;
    const options = {
        method: "GET",
        headers: {
            accept: "application/json",
            "X-API-Key": API_KEY,
        },
    };
    return request(url, options);
}

/*Meta*/

function providersList() {
    const url = "https://banking.sandbox.prometeoapi.com/provider/";
    const options = {
        method: "GET",
        headers: {
            accept: "application/json",
            "X-API-Key": API_KEY,
        },
    };
    return request(url, options);
}

function request(url, options) {
    return fetch(url, options)
        .then((res) => res.json())
        .catch((err) => console.error("error: " + err));
}

module.exports = {
    logIn,
    logOut,
    providersList,
    accounts,
    accountMovements,
    creditCards,
    creditCardMovements
};
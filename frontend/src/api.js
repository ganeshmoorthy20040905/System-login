import axios from "axios";

const API = axios.create({
    baseURL: "https://auth-backend-rrgv.onrender.com",
    withCredentials: true,
});

export default API;
const dotenv = require('dotenv');
dotenv.config();
const express = require('express')
const cors = require('cors');
const app = express();


const cookieParser = require('cookie-parser');
const connectTODb = require("./DB/db");
const DoctorRoutes = require('./routes/Doctor.routes')
const PatientRoutes = require('./routes/patient.routes');



connectTODb();
app.use(cors()); 
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());


app.use("/patient",DoctorRoutes);
app.use("/Doctor",PatientRoutes);
app.use("/", mapRoutes);
app.get('/',(req,res)=>{
    res.send("hello world")
});
app.use("/rides", rideRoutes);



module.exports = app;

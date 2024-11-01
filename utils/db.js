const mongoose=require('mongoose')

async function connectDB(){
    await mongoose.connect('mongodb+srv://aaisali228:dmVjrpFGj7uwgI8m@cluster0.9jkf7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0').then(()=>{
        console.log('connected to db')
    }).catch((err)=>{
        console.error(err.message)
    })
    
}

module.exports=connectDB;
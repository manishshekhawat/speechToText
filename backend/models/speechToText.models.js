const mongoose=require("mongoose");

const speechToTextSchema=new mongoose.Schema({
    text:{
        type:String,
        required:true,
    },
    audioUrl:{
        type:String,
        required:true,
    },
    
},{timestamps:true})

 const SpeechToText=mongoose.model("SpeechToText",speechToTextSchema);

 module.exports = { SpeechToText };
import mongoose from "mongoose";

const ProfilesSchema = new mongoose.Schema({
    FullName: {
         type: String
      },
      headline: {
         type: String
      },
      Summary: {
         type: String
      },
      Experience: {
         type: Array
      },
      Education: {
         type: Array
      },
      Skills: {
         type: Array
      },
      Certifications: {
         type: Array
      },
      source:{
        type:String,
        default:"Linkedin"
      },
      scraped_at:{
        type:Date,
        default:Date.now()
      }
    
},{timestamps:true})

export const profiles=new mongoose.model("profiles",ProfilesSchema)
import mongoose  from "mongoose";


const SocialsConnectSchema = new mongoose.Schema({


   userId: {
    type : mongoose.Schema.Types.ObjectId,
    ref : "Auth_User",
    required : true 
   },


   socialProvider : {
    type : String ,
    enum : ["LinkedIn", "GitHub"],
    required : true
   },

   socialProviderId : {
    type : String,
   },


   accessToken : {
    type : String
   },


   refreshToken : {
    type : String
   },


   scrappedData : {
    type : Object,
    default : {},
   },


   connectedAt :{
    type : Date ,
    default: Date.now()
   }
  },
   {timestamps: true} 
);

const SocialsConnect = mongoose.model("Socials_Connect", SocialsConnectSchema);

export default SocialsConnect;